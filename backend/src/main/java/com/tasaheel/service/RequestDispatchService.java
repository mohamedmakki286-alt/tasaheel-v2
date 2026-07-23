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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
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
                    .filter(this::isEligible)
                    .ifPresent(workshop -> candidates.put(workshop.getId(), workshop));
        }

        workshopRepository.findByCityAndIsApprovedAndIsActive(request.getCity(), true, true)
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
