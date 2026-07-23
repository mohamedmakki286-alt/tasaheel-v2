package com.tasaheel.service;

import com.tasaheel.dto.*;
import com.tasaheel.entity.*;
import com.tasaheel.event.EventPublisher;
import com.tasaheel.event.EventType;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class WorkshopService {

    private final WorkshopRepository workshopRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final QuoteRepository quoteRepository;
    private final CustomerRepository customerRepository;
    private final CustomerCarRepository customerCarRepository;
    private final ServiceTypeRepository serviceTypeRepository;
    private final WorkshopServiceRepository workshopServiceRepository;
    private final ReviewRepository reviewRepository;
    private final WorkshopGalleryRepository galleryRepository;
    private final RequestStatusHistoryRepository statusHistoryRepository;
    private final RequestDispatchService requestDispatchService;
    private final MaintenanceRequestService maintenanceRequestService;
    private final EventPublisher eventPublisher;

    public List<WorkshopDTO> getPublicWorkshops(String city, String type, String search) {
        Stream<Workshop> stream = workshopRepository.findByIsApprovedAndIsActive(true, true).stream();
        if (city != null && !city.isBlank()) {
            stream = stream.filter(w -> w.getCity() != null && w.getCity().contains(city));
        }
        if (type != null && !type.isBlank()) {
            stream = stream.filter(w -> w.getWorkshopType() != null && w.getWorkshopType().equalsIgnoreCase(type));
        }
        if (search != null && !search.isBlank()) {
            String s = search.toLowerCase();
            stream = stream.filter(w ->
                (w.getName() != null && w.getName().toLowerCase().contains(s)) ||
                (w.getServices() != null && w.getServices().toLowerCase().contains(s))
            );
        }
        return stream.map(this::toPublicWorkshopDTO).collect(Collectors.toList());
    }

    public WorkshopDTO getPublicWorkshopById(Long id) {
        Workshop workshop = workshopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", id));
        WorkshopDTO dto = toPublicWorkshopDTO(workshop);
        dto.setReviewCount(reviewRepository.countByWorkshopId(id));
        dto.setCompletedJobs(requestRepository.countByStatusAndWorkshopId("completed", id));
        dto.setAverageResponseTimeMinutes(computeAvgResponseTime(id));
        return dto;
    }

    private WorkshopDTO toPublicWorkshopDTO(Workshop w) {
        List<WorkshopGalleryDTO> gallery = galleryRepository.findByWorkshopIdAndIsDeletedFalseOrderByDisplayOrderAsc(w.getId())
                .stream().map(this::toGalleryDTO).collect(Collectors.toList());
        return WorkshopDTO.builder()
                .id(w.getId())
                .name(w.getName())
                .phone(w.getPhone())
                .address(w.getAddress())
                .city(w.getCity())
                .latitude(w.getLatitude())
                .longitude(w.getLongitude())
                .services(w.getServices())
                .description(w.getDescription())
                .logoUrl(w.getLogoUrl())
                .coverImageUrl(w.getCoverImageUrl())
                .rating(w.getRating())
                .workshopType(w.getWorkshopType())
                .providesPickupDelivery(w.getProvidesPickupDelivery())
                .isActive(w.getIsActive())
                .isApproved(w.getIsApproved())
                .workingHours(w.getWorkingHours())
                .whatsapp(w.getWhatsapp())
                .website(w.getWebsite())
                .tiktokUrl(w.getTiktokUrl())
                .snapchatUrl(w.getSnapchatUrl())
                .facebookUrl(w.getFacebookUrl())
                .instagramUrl(w.getInstagramUrl())
                .xUrl(w.getXUrl())
                .youtubeUrl(w.getYoutubeUrl())
                .features(w.getFeatures())
                .gallery(gallery)
                .build();
    }

    private Long computeAvgResponseTime(Long workshopId) {
        List<Object[]> times = quoteRepository.findAcceptedQuoteTimesByWorkshopId(workshopId);
        if (times.isEmpty()) return null;
        double avg = times.stream()
                .mapToLong(t -> {
                    var quoteTime = (java.time.LocalDateTime) t[0];
                    var requestTime = (java.time.LocalDateTime) t[1];
                    return Duration.between(requestTime, quoteTime).toMinutes();
                })
                .average()
                .orElse(0);
        return Math.round(avg);
    }

    public WorkshopDTO getProfile(Long id) {
        Workshop workshop = workshopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", id));
        return toWorkshopDTO(workshop);
    }

    public WorkshopDTO updateProfile(Long id, WorkshopDTO dto) {
        Workshop workshop = workshopRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", id));

        if (dto.getName() != null) workshop.setName(dto.getName());
        if (dto.getOwnerName() != null) workshop.setOwnerName(dto.getOwnerName());
        if (dto.getPhone() != null) workshop.setPhone(dto.getPhone());
        if (dto.getAddress() != null) workshop.setAddress(dto.getAddress());
        if (dto.getCity() != null) workshop.setCity(dto.getCity());
        if (dto.getLatitude() != null) workshop.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) workshop.setLongitude(dto.getLongitude());
        if (dto.getServices() != null) workshop.setServices(dto.getServices());
        if (dto.getDescription() != null) workshop.setDescription(dto.getDescription());
        if (dto.getLogoUrl() != null) workshop.setLogoUrl(dto.getLogoUrl());
        if (dto.getCoverImageUrl() != null) workshop.setCoverImageUrl(dto.getCoverImageUrl());
        if (dto.getCommercialRegistration() != null) workshop.setCommercialRegistration(dto.getCommercialRegistration());
        if (dto.getMunicipalityLicense() != null) workshop.setMunicipalityLicense(dto.getMunicipalityLicense());
        if (dto.getEmail() != null) workshop.setEmail(dto.getEmail());
        if (dto.getFcmToken() != null) workshop.setFcmToken(dto.getFcmToken());
        if (dto.getWorkingHours() != null) workshop.setWorkingHours(dto.getWorkingHours());
        if (dto.getWhatsapp() != null) workshop.setWhatsapp(dto.getWhatsapp());
        if (dto.getWebsite() != null) workshop.setWebsite(dto.getWebsite());
        if (dto.getTiktokUrl() != null) workshop.setTiktokUrl(dto.getTiktokUrl());
        if (dto.getSnapchatUrl() != null) workshop.setSnapchatUrl(dto.getSnapchatUrl());
        if (dto.getFacebookUrl() != null) workshop.setFacebookUrl(dto.getFacebookUrl());
        if (dto.getInstagramUrl() != null) workshop.setInstagramUrl(dto.getInstagramUrl());
        if (dto.getXUrl() != null) workshop.setXUrl(dto.getXUrl());
        if (dto.getYoutubeUrl() != null) workshop.setYoutubeUrl(dto.getYoutubeUrl());
        if (dto.getFeatures() != null) workshop.setFeatures(dto.getFeatures());

        workshop = workshopRepository.save(workshop);
        return toWorkshopDTO(workshop);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceRequestDTO> getPendingRequests(Long workshopId, String city) {
        List<MaintenanceRequest> dispatched = requestDispatchService.getOpenRequests(workshopId).stream()
                .filter(request -> quoteRepository.findByRequestIdAndWorkshopId(request.getId(), workshopId).isEmpty())
                .collect(Collectors.toList());
        return dispatched.stream().map(this::toRequestDTO).collect(Collectors.toList());
    }

    public List<QuoteDTO> getMyQuotes(Long workshopId) {
        return quoteRepository.findByWorkshopIdOrderByCreatedAtDesc(workshopId).stream()
                .map(this::toQuoteDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public QuoteDTO submitQuote(Long requestId, Long workshopId, Double price, String notes,
                                 Integer estimatedDays, Integer warrantyMonths, Long serviceTypeId) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
        Workshop workshop = workshopRepository.findById(workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", workshopId));

        if (!List.of("pending", "quoted").contains(request.getStatus())) {
            throw new BadRequestException("Request is not open for quotes");
        }
        requestDispatchService.markQuoted(requestId, workshopId);

        if (!quoteRepository.findByRequestIdAndWorkshopId(requestId, workshopId).isEmpty()) {
            throw new BadRequestException("Workshop has already submitted a quote for this request");
        }

        ServiceType serviceType = null;
        if (serviceTypeId != null) {
            serviceType = serviceTypeRepository.findById(serviceTypeId)
                    .orElseThrow(() -> new ResourceNotFoundException("ServiceType", serviceTypeId));
        }

        Quote quote = Quote.builder()
                .request(request)
                .workshop(workshop)
                .serviceType(serviceType)
                .price(price)
                .notes(notes)
                .estimatedDays(estimatedDays)
                .warrantyMonths(warrantyMonths)
                .status("pending")
                .build();

        quote = quoteRepository.save(quote);

        if ("pending".equals(request.getStatus())) {
            request.setStatus("quoted");
            requestRepository.save(request);
        }

        Map<String, Object> eventData = new HashMap<>();
        eventData.put("quoteId", quote.getId());
        eventData.put("workshopId", workshop.getId());
        eventData.put("workshopName", workshop.getName());
        eventData.put("price", price);
        eventData.put("serviceTypeId", serviceTypeId);
        eventPublisher.publish(this, EventType.QUOTE_GENERATED, request.getId(), "workshop", workshop.getId(), eventData);

        return toQuoteDTO(quote);
    }

    @Transactional
    public MaintenanceRequestDTO getDispatchedRequest(Long requestId, Long workshopId) {
        if (!requestDispatchService.canAccess(requestId, workshopId)
                && quoteRepository.findByRequestIdAndWorkshopId(requestId, workshopId).isEmpty()) {
            throw new BadRequestException("This request was not dispatched to your workshop");
        }
        requestDispatchService.markViewed(requestId, workshopId);
        return maintenanceRequestService.getRequest(requestId);
    }

    public void declineDispatchedRequest(Long requestId, Long workshopId, String reason) {
        requestDispatchService.decline(requestId, workshopId, reason);
    }

    public void markDispatchedRequestViewed(Long requestId, Long workshopId) {
        requestDispatchService.markViewed(requestId, workshopId);
    }

    public List<MaintenanceRequestDTO> getMyRequests(Long workshopId) {
        List<Long> requestIds = quoteRepository.findByWorkshopIdOrderByCreatedAtDesc(workshopId).stream()
                .map(q -> q.getRequest().getId())
                .distinct()
                .collect(Collectors.toList());
        return requestRepository.findByIdsWithDetails(requestIds).stream()
                .map(this::toRequestDTO)
                .collect(Collectors.toList());
    }

    public void acceptRequest(Long requestId, Long workshopId) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));

        if (!request.getStatus().equals("accepted")) {
            throw new BadRequestException("Request is not in accepted status");
        }
        requireSelectedWorkshop(requestId, workshopId);
    }

    private static final java.util.Map<String, java.util.Set<String>> WORKSHOP_ALLOWED_TRANSITIONS = java.util.Map.of(
        "customer_approved", java.util.Set.of("in_progress"),
        "in_progress", java.util.Set.of("awaiting_payment")
    );

    @Transactional
    public void updateRequestStatus(Long requestId, Long workshopId, String status) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
        requireSelectedWorkshop(requestId, workshopId);

        String effectiveStatus = "completed".equals(status) ? "awaiting_payment" : status;

        java.util.Set<String> allowed = WORKSHOP_ALLOWED_TRANSITIONS.getOrDefault(request.getStatus(), java.util.Set.of());
        if (!allowed.contains(effectiveStatus)) {
            throw new BadRequestException("Cannot transition from " + request.getStatus() + " to " + effectiveStatus);
        }

        request.setStatus(effectiveStatus);
        requestRepository.save(request);
        statusHistoryRepository.save(RequestStatusHistory.builder()
                .request(request)
                .status(effectiveStatus)
                .notes("Status updated by selected workshop")
                .createdBy("workshop:" + workshopId)
                .build());

        eventPublisher.publish(this, EventType.STATUS_UPDATED, requestId, "workshop", workshopId,
                Map.of("status", effectiveStatus));
    }

    private void requireSelectedWorkshop(Long requestId, Long workshopId) {
        boolean selected = quoteRepository.findByRequestIdAndStatus(requestId, "accepted")
                .map(quote -> quote.getWorkshop().getId().equals(workshopId))
                .orElse(false);
        if (!selected) {
            throw new BadRequestException("Only the selected workshop can manage this request");
        }
    }

    public List<WorkshopServiceDTO> getWorkshopServices(Long workshopId) {
        return workshopServiceRepository.findByWorkshopId(workshopId).stream()
                .map(this::toWorkshopServiceDTO)
                .collect(Collectors.toList());
    }

    public List<WorkshopServiceDTO> getMyWorkshopServices(Long workshopId) {
        return getWorkshopServices(workshopId);
    }

    @Transactional
    public List<WorkshopServiceDTO> updateMyWorkshopServices(Long workshopId, List<WorkshopServiceDTO> services) {
        workshopServiceRepository.findByWorkshopId(workshopId).forEach(ws ->
                workshopServiceRepository.delete(ws));

        Workshop workshop = workshopRepository.findById(workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", workshopId));

        List<com.tasaheel.entity.WorkshopService> saved = services.stream()
                .filter(dto -> dto.getPrice() != null && dto.getPrice() > 0)
                .map(dto -> {
                    ServiceType st = serviceTypeRepository.findById(dto.getServiceTypeId())
                            .orElseThrow(() -> new ResourceNotFoundException("ServiceType", dto.getServiceTypeId()));
                    return com.tasaheel.entity.WorkshopService.builder()
                            .workshop(workshop)
                            .serviceType(st)
                            .price(dto.getPrice())
                            .build();
                })
                .map(workshopServiceRepository::save)
                .collect(Collectors.toList());

        return saved.stream()
                .map(this::toWorkshopServiceDTO)
                .collect(Collectors.toList());
    }

    private WorkshopServiceDTO toWorkshopServiceDTO(com.tasaheel.entity.WorkshopService ws) {
        return WorkshopServiceDTO.builder()
                .id(ws.getId())
                .workshopId(ws.getWorkshop().getId())
                .workshopName(ws.getWorkshop().getName())
                .serviceTypeId(ws.getServiceType().getId())
                .serviceTypeName(ws.getServiceType().getName())
                .price(ws.getPrice())
                .build();
    }

    private WorkshopDTO toWorkshopDTO(Workshop w) {
        List<WorkshopGalleryDTO> gallery = galleryRepository.findByWorkshopIdAndIsDeletedFalseOrderByDisplayOrderAsc(w.getId())
                .stream().map(this::toGalleryDTO).collect(Collectors.toList());
        return WorkshopDTO.builder()
                .id(w.getId())
                .name(w.getName())
                .ownerName(w.getOwnerName())
                .phone(w.getPhone())
                .email(w.getEmail())
                .address(w.getAddress())
                .city(w.getCity())
                .latitude(w.getLatitude())
                .longitude(w.getLongitude())
                .services(w.getServices())
                .description(w.getDescription())
                .logoUrl(w.getLogoUrl())
                .coverImageUrl(w.getCoverImageUrl())
                .commercialRegistration(w.getCommercialRegistration())
                .municipalityLicense(w.getMunicipalityLicense())
                .rejectionReason(w.getRejectionReason())
                .rating(w.getRating())
                .workshopType(w.getWorkshopType())
                .providesPickupDelivery(w.getProvidesPickupDelivery())
                .isActive(w.getIsActive())
                .isApproved(w.getIsApproved())
                .fcmToken(w.getFcmToken())
                .workingHours(w.getWorkingHours())
                .whatsapp(w.getWhatsapp())
                .website(w.getWebsite())
                .tiktokUrl(w.getTiktokUrl())
                .snapchatUrl(w.getSnapchatUrl())
                .facebookUrl(w.getFacebookUrl())
                .instagramUrl(w.getInstagramUrl())
                .xUrl(w.getXUrl())
                .youtubeUrl(w.getYoutubeUrl())
                .features(w.getFeatures())
                .gallery(gallery)
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .build();
    }

    // ========== Gallery Management ==========

    public List<WorkshopGalleryDTO> getGallery(Long workshopId) {
        return galleryRepository.findByWorkshopIdAndIsDeletedFalseOrderByDisplayOrderAsc(workshopId)
                .stream().map(this::toGalleryDTO).collect(Collectors.toList());
    }

    public WorkshopGalleryDTO addToGallery(Long workshopId, String mediaUrl, String mediaType, Boolean isCover) {
        Workshop workshop = workshopRepository.findById(workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", workshopId));
        if (isCover != null && isCover) {
            galleryRepository.findByWorkshopIdAndIsDeletedFalseAndIsCoverTrue(workshopId)
                    .forEach(g -> { g.setIsCover(false); galleryRepository.save(g); });
        }
        List<WorkshopGallery> existing = galleryRepository.findByWorkshopIdAndIsDeletedFalseOrderByDisplayOrderAsc(workshopId);
        int nextOrder = existing.stream().mapToInt(WorkshopGallery::getDisplayOrder).max().orElse(-1) + 1;
        WorkshopGallery item = WorkshopGallery.builder()
                .workshop(workshop)
                .mediaUrl(mediaUrl)
                .mediaType(mediaType != null ? mediaType : "image")
                .displayOrder(nextOrder)
                .isCover(isCover != null && isCover)
                .build();
        return toGalleryDTO(galleryRepository.save(item));
    }

    public WorkshopGalleryDTO updateGalleryItem(Long workshopId, Long itemId, Integer displayOrder, Boolean isCover) {
        WorkshopGallery item = galleryRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Gallery item", itemId));
        if (!item.getWorkshop().getId().equals(workshopId)) {
            throw new BadRequestException("Not your gallery item");
        }
        if (isCover != null && isCover) {
            galleryRepository.findByWorkshopIdAndIsDeletedFalseAndIsCoverTrue(workshopId)
                    .forEach(g -> { g.setIsCover(false); galleryRepository.save(g); });
            item.setIsCover(true);
        }
        if (displayOrder != null) item.setDisplayOrder(displayOrder);
        return toGalleryDTO(galleryRepository.save(item));
    }

    public void deleteGalleryItem(Long workshopId, Long itemId) {
        WorkshopGallery item = galleryRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Gallery item", itemId));
        if (!item.getWorkshop().getId().equals(workshopId)) {
            throw new BadRequestException("Not your gallery item");
        }
        item.setIsDeleted(true);
        galleryRepository.save(item);
    }

    private WorkshopGalleryDTO toGalleryDTO(WorkshopGallery g) {
        return WorkshopGalleryDTO.builder()
                .id(g.getId())
                .workshopId(g.getWorkshop().getId())
                .mediaUrl(g.getMediaUrl())
                .mediaType(g.getMediaType())
                .displayOrder(g.getDisplayOrder())
                .isCover(g.getIsCover())
                .createdAt(g.getCreatedAt())
                .build();
    }

    private MaintenanceRequestDTO toRequestDTO(MaintenanceRequest r) {
        List<ServiceType> sts = r.getServiceTypes();
        ServiceType primary = sts.isEmpty() ? null : sts.get(0);
        return MaintenanceRequestDTO.builder()
                .id(r.getId())
                .customerId(r.getCustomer().getId())
                .customerName(r.getCustomer().getName())
                .customerPhone(r.getCustomer().getPhone())
                .carId(r.getCar().getId())
                .carMake(r.getCar().getMake())
                .carModel(r.getCar().getModel())
                .carYear(r.getCar().getYear())
                .carPlateNumber(r.getCar().getPlateNumber())
                .serviceTypeId(primary != null ? primary.getId() : null)
                .serviceTypeName(primary != null ? primary.getName() : null)
                .serviceTypeIds(sts.stream().map(ServiceType::getId).collect(Collectors.toList()))
                .serviceTypes(sts.stream().map(s -> new ServiceItemDTO(s.getId(), s.getName())).collect(Collectors.toList()))
                .description(r.getDescription())
                .locationLat(r.getLocationLat())
                .locationLng(r.getLocationLng())
                .locationAddress(r.getLocationAddress())
                .city(r.getCity())
                .status(r.getStatus())
                .hasTransportRequest(r.getHasTransportRequest())
                .allowMultiWorkshop(r.getAllowMultiWorkshop())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .workshopIds(r.getPreferredWorkshopId() != null ? List.of(r.getPreferredWorkshopId()) : null)
                .build();
    }

    private QuoteDTO toQuoteDTO(Quote q) {
        return QuoteDTO.builder()
                .id(q.getId())
                .requestId(q.getRequest().getId())
                .workshopId(q.getWorkshop().getId())
                .workshopName(q.getWorkshop().getName())
                .workshopLogo(null)
                .serviceTypeId(q.getServiceType() != null ? q.getServiceType().getId() : null)
                .serviceTypeName(q.getServiceType() != null ? q.getServiceType().getName() : null)
                .price(q.getPrice())
                .notes(q.getNotes())
                .estimatedDays(q.getEstimatedDays())
                .warrantyMonths(q.getWarrantyMonths())
                .status(q.getStatus())
                .createdAt(q.getCreatedAt())
                .build();
    }
}
