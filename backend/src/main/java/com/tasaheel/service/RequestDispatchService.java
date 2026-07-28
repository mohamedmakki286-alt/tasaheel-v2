package com.tasaheel.service;

import com.tasaheel.entity.MaintenanceRequest;
import com.tasaheel.entity.RequestWorkshopDispatch;
import com.tasaheel.entity.Workshop;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.integration.FirebaseService;
import com.tasaheel.repository.RequestWorkshopDispatchRepository;
import com.tasaheel.repository.WorkshopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RequestDispatchService {
    private static final List<String> OPEN_STATUSES = List.of("SENT", "VIEWED");

    private final RequestWorkshopDispatchRepository dispatchRepository;
    private final WorkshopRepository workshopRepository;
    private final NotificationService notificationService;
    private final FirebaseService firebaseService;

    @Value("${application.dispatch.max-workshops:10}")
    private int maxWorkshops;

    @Value("${application.dispatch.expiry-hours:24}")
    private long expiryHours;

    @Transactional
    public List<RequestWorkshopDispatch> dispatch(MaintenanceRequest request) {
        LinkedHashMap<Long, Workshop> candidates = new LinkedHashMap<>();

        if (request.getPreferredWorkshopId() != null) {
            workshopRepository.findById(request.getPreferredWorkshopId())
                    .filter(workshop -> isEligibleForRequest(workshop, request))
                    .ifPresent(workshop -> candidates.put(workshop.getId(), workshop));
        }

        workshopRepository.findByCityAndIsApprovedAndIsActive(request.getCity(), true, true).stream()
                .filter(workshop -> isEligibleForRequest(workshop, request))
                .sorted(Comparator.comparingDouble(workshop -> distanceKm(workshop, request)))
                .forEach(workshop -> candidates.putIfAbsent(workshop.getId(), workshop));

        workshopRepository.findByIsApprovedAndIsActive(true, true).stream()
                .filter(workshop -> isEligibleForRequest(workshop, request))
                .filter(workshop -> isSameCityOrNearby(workshop, request))
                .sorted(Comparator.comparingDouble(workshop -> distanceKm(workshop, request)))
                .forEach(workshop -> candidates.putIfAbsent(workshop.getId(), workshop));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusHours(expiryHours);
        List<RequestWorkshopDispatch> created = new ArrayList<>();

        for (Workshop workshop : candidates.values().stream().limit(Math.max(1, maxWorkshops)).toList()) {
            if (dispatchRepository.existsByRequestIdAndWorkshopId(request.getId(), workshop.getId())) continue;

            RequestWorkshopDispatch dispatch = dispatchRepository.save(RequestWorkshopDispatch.builder()
                    .request(request)
                    .workshop(workshop)
                    .status("SENT")
                    .isPreferred(workshop.getId().equals(request.getPreferredWorkshopId()))
                    .sentAt(now)
                    .expiresAt(expiresAt)
                    .build());
            created.add(dispatch);
            notifyWorkshop(dispatch);
        }
        return created;
    }

    public List<MaintenanceRequest> getOpenRequests(Long workshopId) {
        return dispatchRepository
                .findByWorkshopIdAndStatusInAndExpiresAtAfterOrderBySentAtDesc(
                        workshopId, OPEN_STATUSES, LocalDateTime.now())
                .stream()
                .map(RequestWorkshopDispatch::getRequest)
                .filter(request -> List.of("pending", "quoted").contains(request.getStatus()))
                .distinct()
                .toList();
    }

    @Transactional
    public void markViewed(Long requestId, Long workshopId) {
        RequestWorkshopDispatch dispatch = requireDispatch(requestId, workshopId);
        if ("SENT".equals(dispatch.getStatus())) {
            dispatch.setStatus("VIEWED");
            dispatch.setViewedAt(LocalDateTime.now());
            dispatchRepository.save(dispatch);
        }
    }

    @Transactional
    public void decline(Long requestId, Long workshopId, String reason) {
        RequestWorkshopDispatch dispatch = requireDispatch(requestId, workshopId);
        if (!OPEN_STATUSES.contains(dispatch.getStatus())) {
            throw new BadRequestException("This request can no longer be declined");
        }
        dispatch.setStatus("DECLINED");
        dispatch.setDeclineReason(reason);
        dispatch.setRespondedAt(LocalDateTime.now());
        dispatchRepository.save(dispatch);
    }

    @Transactional
    public void markQuoted(Long requestId, Long workshopId) {
        RequestWorkshopDispatch dispatch = requireDispatch(requestId, workshopId);
        if (!OPEN_STATUSES.contains(dispatch.getStatus())) {
            throw new BadRequestException("This request is not available for quoting");
        }
        if (dispatch.getExpiresAt().isBefore(LocalDateTime.now())) {
            dispatch.setStatus("EXPIRED");
            dispatchRepository.save(dispatch);
            throw new BadRequestException("The request invitation has expired");
        }
        dispatch.setStatus("QUOTED");
        dispatch.setRespondedAt(LocalDateTime.now());
        dispatchRepository.save(dispatch);
    }

    @Transactional
    public void resolveAfterAcceptance(Long requestId, Long selectedWorkshopId) {
        for (RequestWorkshopDispatch dispatch : dispatchRepository.findByRequestId(requestId)) {
            if (dispatch.getWorkshop().getId().equals(selectedWorkshopId)) {
                dispatch.setStatus("ACCEPTED");
            } else if (!List.of("DECLINED", "EXPIRED").contains(dispatch.getStatus())) {
                dispatch.setStatus("NOT_SELECTED");
            }
            dispatch.setRespondedAt(dispatch.getRespondedAt() != null
                    ? dispatch.getRespondedAt() : LocalDateTime.now());
            dispatchRepository.save(dispatch);
        }
    }

    public boolean canAccess(Long requestId, Long workshopId) {
        return dispatchRepository.existsByRequestIdAndWorkshopId(requestId, workshopId);
    }

    private RequestWorkshopDispatch requireDispatch(Long requestId, Long workshopId) {
        return dispatchRepository.findByRequestIdAndWorkshopId(requestId, workshopId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "RequestWorkshopDispatch", "requestId/workshopId", requestId + "/" + workshopId));
    }

    private boolean isEligible(Workshop workshop) {
        return Boolean.TRUE.equals(workshop.getIsApproved()) && Boolean.TRUE.equals(workshop.getIsActive());
    }

    private boolean isEligibleForRequest(Workshop workshop, MaintenanceRequest request) {
        if (!isEligible(workshop)) return false;

        String method = request.getExecutionMethod();
        String type = workshop.getWorkshopType() == null
                ? "stationary"
                : workshop.getWorkshopType().trim().toLowerCase(Locale.ROOT);

        if ("mobile".equals(method)) {
            return "mobile".equals(type) || "both".equals(type);
        }
        if ("workshop".equals(method)) {
            return "stationary".equals(type) || "both".equals(type);
        }
        if ("pickup_delivery".equals(method)) {
            return Boolean.TRUE.equals(workshop.getProvidesPickupDelivery());
        }
        return true;
    }

    private boolean isSameCityOrNearby(Workshop workshop, MaintenanceRequest request) {
        if (normalizeCity(workshop.getCity()).equals(normalizeCity(request.getCity()))) {
            return true;
        }
        return distanceKm(workshop, request) <= 80.0;
    }

    private double distanceKm(Workshop workshop, MaintenanceRequest request) {
        if (workshop.getLatitude() == null || workshop.getLongitude() == null
                || request.getLocationLat() == null || request.getLocationLng() == null) {
            return Double.MAX_VALUE;
        }
        double earthRadiusKm = 6371.0;
        double latDistance = Math.toRadians(workshop.getLatitude() - request.getLocationLat());
        double lngDistance = Math.toRadians(workshop.getLongitude() - request.getLocationLng());
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(request.getLocationLat()))
                * Math.cos(Math.toRadians(workshop.getLatitude()))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
        return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private String normalizeCity(String city) {
        if (city == null) return "";
        String value = Normalizer.normalize(city.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('أ', 'ا')
                .replace('إ', 'ا')
                .replace('آ', 'ا')
                .replace('ة', 'ه')
                .replace('ى', 'ي')
                .replaceAll("[^\\p{L}\\p{N}]+", " ")
                .replaceAll("\\s+", " ")
                .trim();

        return switch (value) {
            case "riyadh", "ar riyad" -> "الرياض";
            case "jeddah", "jiddah" -> "جده";
            case "makkah", "mecca" -> "مكه";
            case "madinah", "medina" -> "المدينه المنوره";
            case "dammam" -> "الدمام";
            case "khobar", "al khobar" -> "الخبر";
            case "khamis mushait", "khamis musheit" -> "خميس مشيط";
            default -> value;
        };
    }

    private void notifyWorkshop(RequestWorkshopDispatch dispatch) {
        Workshop workshop = dispatch.getWorkshop();
        MaintenanceRequest request = dispatch.getRequest();
        String title = Boolean.TRUE.equals(dispatch.getIsPreferred()) ? "طلب موجه لورشتك" : "طلب صيانة جديد";
        String body = "طلب جديد في " + request.getCity() + " متاح لتقديم عرض سعر";

        notificationService.save(workshop.getId(), "workshop", "REQUEST_DISPATCHED",
                title, body, request.getId(), "REQUEST_DISPATCHED");

        if (workshop.getFcmToken() != null && !workshop.getFcmToken().isBlank()) {
            firebaseService.sendNotification(workshop.getFcmToken(), title, body, Map.of(
                    "type", "REQUEST_DISPATCHED",
                    "requestId", String.valueOf(request.getId()),
                    "dispatchId", String.valueOf(dispatch.getId())
            ));
        }
    }
}
