package com.tasaheel.service;

import com.tasaheel.dto.*;
import com.tasaheel.entity.*;
import com.tasaheel.event.EventPublisher;
import com.tasaheel.event.EventType;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenanceRequestService {

    private final MaintenanceRequestRepository requestRepository;
    private final CustomerRepository customerRepository;
    private final CustomerCarRepository customerCarRepository;
    private final ServiceTypeRepository serviceTypeRepository;
    private final RequestStatusHistoryRepository statusHistoryRepository;
    private final QuoteRepository quoteRepository;
    private final InspectionReportRepository inspectionReportRepository;
    private final InspectionPartItemRepository inspectionPartItemRepository;
    private final InspectionLaborItemRepository inspectionLaborItemRepository;
    private final MediaRepository mediaRepository;
    private final HomeServiceAssignmentRepository homeServiceAssignmentRepository;
    private final WorkshopRepository workshopRepository;
    private final EventPublisher eventPublisher;
    private final ServiceItemService serviceItemService;
    private final SplitRequestService splitRequestService;
    private final InvoiceRepository invoiceRepository;

    @Transactional
    public MaintenanceRequestDTO createRequest(Long customerId, MaintenanceRequestDTO dto, boolean isDraft) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));
        CustomerCar car = customerCarRepository.findById(dto.getCarIdInput())
                .orElseThrow(() -> new ResourceNotFoundException("Car", dto.getCarIdInput()));
        if (!car.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("You are not the owner of this car");
        }
        List<ServiceType> serviceTypes = new java.util.ArrayList<>();
        if (dto.getServiceTypeIdsInput() != null && !dto.getServiceTypeIdsInput().isEmpty()) {
            serviceTypes = serviceTypeRepository.findAllById(dto.getServiceTypeIdsInput());
        } else if (dto.getServiceTypeIdInput() != null) {
            serviceTypeRepository.findById(dto.getServiceTypeIdInput()).ifPresent(serviceTypes::add);
        }
        List<ServiceType> sts = serviceTypes;
        String primaryServiceName = serviceTypes.isEmpty() ? "" : serviceTypes.get(0).getName();

        MaintenanceRequest request = MaintenanceRequest.builder()
                .customer(customer)
                .car(car)
                .serviceTypes(serviceTypes)
                .description(dto.getDescription())
                .locationLat(dto.getLocationLat())
                .locationLng(dto.getLocationLng())
                .locationAddress(dto.getLocationAddress())
                .city(dto.getCity())
                .status(isDraft ? "draft" : "pending")
                .hasTransportRequest(false)
                .executionMethod(dto.getExecutionMethod())
                .allowMultiWorkshop(dto.getAllowMultiWorkshop() != null ? dto.getAllowMultiWorkshop() : "mobile".equals(dto.getExecutionMethod()))
                .build();

        if (dto.getWorkshopIds() != null && !dto.getWorkshopIds().isEmpty()) {
            Workshop preferred = workshopRepository.findById(dto.getWorkshopIds().get(0)).orElse(null);
            if (preferred != null) {
                request.setPreferredWorkshopId(preferred.getId());
            }
        }

        request = requestRepository.save(request);
        serviceItemService.createServiceItems(request);

        if (!isDraft) {
            createStatusHistory(request, "pending", "Request created", "customer:" + customerId);
            eventPublisher.publish(this, EventType.REQUEST_SUBMITTED, request.getId(), "customer", customerId, Map.of(
                "serviceTypes", sts.stream().map(ServiceType::getName).toList(),
                "city", request.getCity() != null ? request.getCity() : ""
            ));
        } else {
            eventPublisher.publish(this, EventType.REQUEST_CREATED, request.getId(), "customer", customerId,
                Map.of("city", request.getCity() != null ? request.getCity() : ""));
        }

        String category = determineCategory(
                dto.getDescription(),
                primaryServiceName
        );
        if ("mobile_mechanic".equals(category)) {
            List<Workshop> mobileWorkshops = workshopRepository.findByCityAndWorkshopTypeIn(
                    dto.getCity(),
                    List.of("mobile", "both")
            );
            if (!mobileWorkshops.isEmpty()) {
                Workshop workshop = mobileWorkshops.get(0);
                HomeServiceAssignment assignment = HomeServiceAssignment.builder()
                        .request(request)
                        .workshop(workshop)
                        .status("pending_assignment")
                        .build();
                homeServiceAssignmentRepository.save(assignment);
            }
        }

        return toRequestDTO(request);
    }

    @Transactional
    public MaintenanceRequestDTO submitDraft(Long requestId, Long customerId) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
        if (!request.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("You are not the owner of this request");
        }
        if (!"draft".equals(request.getStatus())) {
            throw new BadRequestException("Request is not a draft");
        }
        request.setStatus("pending");
        request = requestRepository.save(request);
        createStatusHistory(request, "pending", "Draft submitted", "customer:" + customerId);
        eventPublisher.publish(this, EventType.REQUEST_SUBMITTED, request.getId(), "customer", customerId,
                Map.of("city", request.getCity() != null ? request.getCity() : ""));
        return toRequestDTO(request);
    }

    public List<MaintenanceRequestDTO> getCustomerDrafts(Long customerId) {
        return requestRepository.findByCustomerIdAndStatusOrderByCreatedAtDesc(customerId, "draft")
                .stream().map(this::toRequestDTO).collect(Collectors.toList());
    }

    public MaintenanceRequestDTO getRequest(Long id) {
        MaintenanceRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request", id));
        return toFullRequestDTO(request);
    }

    public List<MaintenanceRequestDTO> getCustomerRequests(Long customerId, int page, int size) {
        Page<MaintenanceRequest> requests = requestRepository.findByCustomerId(customerId, PageRequest.of(page, size));
        return requests.getContent().stream().map(this::toRequestDTO).collect(Collectors.toList());
    }

    public List<CarHistoryDTO> getCarMaintenanceHistory(Long carId, Long customerId) {
        CustomerCar car = customerCarRepository.findById(carId)
                .orElseThrow(() -> new ResourceNotFoundException("Car", carId));
        if (!car.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("This car does not belong to the current customer");
        }
        return requestRepository.findByCarIdOrderByCreatedAtDesc(carId)
                .stream()
                .filter(r -> List.of("completed", "verified", "paid").contains(r.getStatus()))
                .map(this::toCarHistoryDTO).collect(Collectors.toList());
    }

    private CarHistoryDTO toCarHistoryDTO(MaintenanceRequest r) {
        String workshopName = null;
        String grandTotal = null;

        String invoiceStatus = null;
        try {
            Invoice invoice = invoiceRepository.findByRequestId(r.getId()).orElse(null);
            if (invoice != null) {
                invoiceStatus = invoice.getStatus();
                grandTotal = invoice.getGrandTotal() != null ? String.valueOf(invoice.getGrandTotal()) : null;
                workshopName = invoice.getWorkshop() != null ? invoice.getWorkshop().getName() : null;
            }
        } catch (Exception ignored) {}

        if (workshopName == null) {
            Quote acceptedQuote = quoteRepository.findByRequestIdAndStatus(r.getId(), "accepted").orElse(null);
            if (acceptedQuote != null) {
                workshopName = acceptedQuote.getWorkshop() != null ? acceptedQuote.getWorkshop().getName() : null;
                grandTotal = acceptedQuote.getPrice() != null ? String.valueOf(acceptedQuote.getPrice()) : null;
            }
        }

        String reportStatus = null;
        try {
            InspectionReport report = inspectionReportRepository.findByRequestId(r.getId()).orElse(null);
            if (report != null) reportStatus = report.getStatus();
        } catch (Exception ignored) {}

        String serviceTypeName = null;
        if (r.getServiceTypes() != null && !r.getServiceTypes().isEmpty()) {
            serviceTypeName = r.getServiceTypes().stream().map(ServiceType::getName).collect(Collectors.joining("، "));
        }

        Double total = null;
        try {
            String gt = grandTotal;
            if (gt != null) total = Double.parseDouble(gt);
        } catch (Exception ignored) {}

        return CarHistoryDTO.builder()
                .requestId(r.getId())
                .status(r.getStatus())
                .serviceTypeName(serviceTypeName)
                .workshopName(workshopName)
                .grandTotal(total)
                .invoiceStatus(invoiceStatus)
                .reportStatus(reportStatus)
                .createdAt(r.getCreatedAt())
                .build();
    }


    @Transactional
    public void updateStatus(Long requestId, String status, Long userId, String role) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));

        validateStatusTransition(request.getStatus(), status);

        String oldStatus = request.getStatus();
        request.setStatus(status);
        requestRepository.save(request);

        createStatusHistory(request, status, "Status updated to " + status, role + ":" + userId);

        EventType eventType = switch (status) {
            case "in_progress" -> EventType.SERVICE_STARTED;
            case "completed" -> EventType.SERVICE_COMPLETED;
            default -> EventType.STATUS_UPDATED;
        };
        eventPublisher.publish(this, eventType, requestId, role, userId,
                Map.of("oldStatus", oldStatus, "status", status));
    }

    @Transactional
    public void acceptQuote(Long requestId, Long quoteId, Long customerId) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));

        if (!request.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("You are not the owner of this request");
        }

        Quote acceptedQuote = quoteRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote", quoteId));
        if (!acceptedQuote.getRequest().getId().equals(requestId)) {
            throw new BadRequestException("Quote does not belong to this request");
        }

        List<Quote> allQuotes = quoteRepository.findByRequestIdOrderByCreatedAtAsc(requestId);
        for (Quote q : allQuotes) {
            if (q.getId().equals(quoteId)) {
                q.setStatus("accepted");
                quoteRepository.save(q);
            } else {
                q.setStatus("rejected");
                quoteRepository.save(q);
                eventPublisher.publish(this, EventType.QUOTE_REJECTED, requestId, "customer", customerId,
                        Map.of("quoteId", q.getId(), "workshopId", q.getWorkshop().getId(),
                               "workshopName", q.getWorkshop().getName(), "price", q.getPrice()));
            }
        }

        request.setStatus("accepted");
        requestRepository.save(request);

        createStatusHistory(request, "accepted", "Quote accepted from workshop " + acceptedQuote.getWorkshop().getName(),
                "customer:" + customerId);

        eventPublisher.publish(this, EventType.OFFER_ACCEPTED, requestId, "customer", customerId,
                Map.of("quoteId", quoteId, "workshopId", acceptedQuote.getWorkshop().getId(),
                       "workshopName", acceptedQuote.getWorkshop().getName(), "price", acceptedQuote.getPrice()));
    }

    @Transactional
    public void approveReport(Long requestId, Long customerId) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));

        if (!request.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("You are not the owner of this request");
        }

        if (!request.getStatus().equals("inspection_report")) {
            throw new BadRequestException("Request is not in inspection report status");
        }

        InspectionReport report = inspectionReportRepository.findByRequestId(requestId).orElse(null);
        if (report != null) {
            report.setStatus("approved");
            inspectionReportRepository.save(report);
        }

        request.setStatus("customer_approved");
        requestRepository.save(request);

        createStatusHistory(request, "customer_approved", "Customer approved the inspection report",
                "customer:" + customerId);

        eventPublisher.publish(this, EventType.REPORT_APPROVED, requestId, "customer", customerId);
    }

    @Transactional
    public MaintenanceRequestDTO createTransportRequest(Long requestId, Long customerId, TransportRequestDTO transportDTO) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));

        request.setHasTransportRequest(true);
        requestRepository.save(request);

        return toRequestDTO(request);
    }

    public List<RequestStatusHistoryDTO> getTimeline(Long requestId) {
        return statusHistoryRepository.findByRequestIdOrderByCreatedAtAsc(requestId).stream()
                .map(this::toStatusHistoryDTO)
                .collect(Collectors.toList());
    }

    private void validateStatusTransition(String currentStatus, String newStatus) {
        switch (currentStatus) {
            case "draft":
                if (!newStatus.equals("pending"))
                    throw new BadRequestException("Cannot transition from " + currentStatus + " to " + newStatus);
                break;
            case "pending":
                if (!newStatus.equals("quoted") && !newStatus.equals("cancelled"))
                    throw new BadRequestException("Cannot transition from " + currentStatus + " to " + newStatus);
                break;
            case "quoted":
                if (!newStatus.equals("offer_selected") && !newStatus.equals("accepted") && !newStatus.equals("cancelled"))
                    throw new BadRequestException("Cannot transition from " + currentStatus + " to " + newStatus);
                break;
            case "offer_selected":
                if (!newStatus.equals("accepted") && !newStatus.equals("splitted") && !newStatus.equals("cancelled"))
                    throw new BadRequestException("Cannot transition from " + currentStatus + " to " + newStatus);
                break;
            case "splitted":
                if (!newStatus.equals("assigned") && !newStatus.equals("cancelled"))
                    throw new BadRequestException("Cannot transition from " + currentStatus + " to " + newStatus);
                break;
            case "accepted":
                if (!newStatus.equals("inspection_report") && !newStatus.equals("cancelled"))
                    throw new BadRequestException("Cannot transition from " + currentStatus + " to " + newStatus);
                break;
            case "inspection_report":
                if (!newStatus.equals("customer_approved") && !newStatus.equals("cancelled"))
                    throw new BadRequestException("Cannot transition from " + currentStatus + " to " + newStatus);
                break;
            case "customer_approved":
                if (!newStatus.equals("in_progress") && !newStatus.equals("cancelled"))
                    throw new BadRequestException("Cannot transition from " + currentStatus + " to " + newStatus);
                break;
            case "in_progress":
                if (!newStatus.equals("completed") && !newStatus.equals("cancelled"))
                    throw new BadRequestException("Cannot transition from " + currentStatus + " to " + newStatus);
                break;
            case "completed":
                if (!newStatus.equals("verified") && !newStatus.equals("cancelled"))
                    throw new BadRequestException("Cannot transition from " + currentStatus + " to " + newStatus);
                break;
            case "verified":
                if (!newStatus.equals("paid"))
                    throw new BadRequestException("Cannot transition from " + currentStatus + " to " + newStatus);
                break;
            case "paid":
            case "cancelled":
                throw new BadRequestException("Cannot transition from terminal status " + currentStatus);
        }
    }

    private void createStatusHistory(MaintenanceRequest request, String status, String notes, String createdBy) {
        RequestStatusHistory history = RequestStatusHistory.builder()
                .request(request)
                .status(status)
                .notes(notes)
                .createdBy(createdBy)
                .build();
        statusHistoryRepository.save(history);
    }

    private MaintenanceRequestDTO toRequestDTO(MaintenanceRequest r) {
        List<ServiceType> sts = r.getServiceTypes();
        ServiceType primary = sts.isEmpty() ? null : sts.get(0);

        String workshopName = null;
        try {
            Quote acceptedQuote = quoteRepository.findByRequestIdAndStatus(r.getId(), "accepted").orElse(null);
            if (acceptedQuote != null && acceptedQuote.getWorkshop() != null) {
                workshopName = acceptedQuote.getWorkshop().getName();
            }
        } catch (Exception ignored) {}

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
                .carColor(r.getCar().getColor())
                .carMileage(r.getCar().getMileage())
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
                .executionMethod(r.getExecutionMethod())
                .allowMultiWorkshop(r.getAllowMultiWorkshop())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .workshopIds(r.getPreferredWorkshopId() != null ? List.of(r.getPreferredWorkshopId()) : null)
                .technicianId(r.getTechnician() != null ? r.getTechnician().getId() : null)
                .technicianName(r.getTechnician() != null ? r.getTechnician().getName() : null)
                .technicianPhone(r.getTechnician() != null ? r.getTechnician().getPhone() : null)
                .technicianSpecialty(r.getTechnician() != null ? r.getTechnician().getSpecialty() : null)
                .workshopName(workshopName)
                .build();
    }

    private MaintenanceRequestDTO toFullRequestDTO(MaintenanceRequest r) {
        MaintenanceRequestDTO dto = toRequestDTO(r);

        List<QuoteDTO> quotes = quoteRepository.findByRequestIdOrderByCreatedAtAsc(r.getId()).stream()
                .map(q -> QuoteDTO.builder()
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
                        .build())
                .collect(Collectors.toList());
        dto.setQuotes(quotes);

        List<MediaDTO> media = mediaRepository.findByRequestIdOrderByCreatedAtAsc(r.getId()).stream()
                .map(m -> MediaDTO.builder()
                        .id(m.getId())
                        .requestId(m.getRequest().getId())
                        .type(m.getType())
                        .url(m.getUrl())
                        .thumbnailUrl(m.getThumbnailUrl())
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        dto.setMedia(media);

        InspectionReport report = inspectionReportRepository.findTopByRequestIdOrderByCreatedAtDesc(r.getId()).orElse(null);
        if (report != null) {
            List<InspectionPartItemDTO> parts = inspectionPartItemRepository.findByReportId(report.getId()).stream()
                    .map(p -> InspectionPartItemDTO.builder()
                            .id(p.getId())
                            .reportId(p.getReport().getId())
                            .partName(p.getPartName())
                            .quantity(p.getQuantity())
                            .unitPrice(p.getUnitPrice())
                            .total(p.getTotal())
                            .build())
                    .collect(Collectors.toList());

            List<InspectionLaborItemDTO> labor = inspectionLaborItemRepository.findByReportId(report.getId()).stream()
                    .map(l -> InspectionLaborItemDTO.builder()
                            .id(l.getId())
                            .reportId(l.getReport().getId())
                            .description(l.getDescription())
                            .hours(l.getHours())
                            .hourlyRate(l.getHourlyRate())
                            .total(l.getTotal())
                            .build())
                    .collect(Collectors.toList());

            dto.setInspectionReport(InspectionReportDTO.builder()
                    .id(report.getId())
                    .requestId(report.getRequest().getId())
                    .workshopId(report.getWorkshop().getId())
                    .workshopName(report.getWorkshop().getName())
                    .notes(report.getNotes())
                    .totalParts(report.getTotalParts())
                    .totalLabor(report.getTotalLabor())
                    .tax(report.getTax())
                    .grandTotal(report.getGrandTotal())
                    .status(report.getStatus())
                    .createdAt(report.getCreatedAt())
                    .updatedAt(report.getUpdatedAt())
                    .parts(parts)
                    .laborItems(labor)
                    .build());
        }

        List<RequestStatusHistoryDTO> timeline = statusHistoryRepository.findByRequestIdOrderByCreatedAtAsc(r.getId())
                .stream()
                .map(h -> RequestStatusHistoryDTO.builder()
                        .id(h.getId())
                        .requestId(h.getRequest().getId())
                        .status(h.getStatus())
                        .notes(h.getNotes())
                        .createdBy(h.getCreatedBy())
                        .createdAt(h.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        dto.setTimeline(timeline);

        dto.setServiceItems(serviceItemService.getServiceItems(r.getId()));

        try {
            dto.setSubOrders(splitRequestService.getSubOrders(r.getId()));
        } catch (Exception ignored) {}

        return dto;
    }

    @Transactional
    public void rejectQuote(Long requestId, Long quoteId, Long customerId, String reason) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));

        if (!request.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("You are not the owner of this request");
        }

        if (!"quoted".equals(request.getStatus()) && !"pending".equals(request.getStatus())) {
            throw new BadRequestException("Cannot reject quote in current request status: " + request.getStatus());
        }

        Quote quote = quoteRepository.findById(quoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Quote", quoteId));
        if (!quote.getRequest().getId().equals(requestId)) {
            throw new BadRequestException("Quote does not belong to this request");
        }

        if ("accepted".equals(quote.getStatus()) || "rejected".equals(quote.getStatus())) {
            throw new BadRequestException("Cannot reject a quote that is already " + quote.getStatus());
        }

        quote.setStatus("rejected");
        quoteRepository.save(quote);

        createStatusHistory(request, request.getStatus(),
                "Quote rejected from workshop " + quote.getWorkshop().getName() + (reason != null ? ": " + reason : ""),
                "customer:" + customerId);

        eventPublisher.publish(this, EventType.QUOTE_REJECTED, requestId, "customer", customerId,
                Map.of("quoteId", quoteId, "workshopId", quote.getWorkshop().getId(),
                       "workshopName", quote.getWorkshop().getName(), "reason", reason != null ? reason : ""));
    }

    @Transactional
    public void cancelRequest(Long requestId, Long customerId) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
        if (!request.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("You are not the owner of this request");
        }
        validateStatusTransition(request.getStatus(), "cancelled");
        request.setStatus("cancelled");
        requestRepository.save(request);
        createStatusHistory(request, "cancelled", "Request cancelled by customer", "customer:" + customerId);
        eventPublisher.publish(this, EventType.REQUEST_CANCELLED, requestId, "customer", customerId);
    }

    @Transactional
    public void rejectReportByRequest(Long requestId, Long customerId, String comment) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
        InspectionReport report = inspectionReportRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection report not found for request", requestId));
        report.setStatus("rejected");
        report.setNotes(comment);
        inspectionReportRepository.save(report);
        createStatusHistory(request, "inspection_report", "Report rejected: " + comment, "customer:" + customerId);
        eventPublisher.publish(this, EventType.REPORT_REJECTED, requestId, "customer", customerId);
    }

    public HomeServiceAssignmentDTO getTechnicianForRequest(Long requestId) {
        HomeServiceAssignment assignment = homeServiceAssignmentRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Home service assignment not found for request", requestId));
        return toAssignmentDTO(assignment);
    }

    private HomeServiceAssignmentDTO toAssignmentDTO(HomeServiceAssignment a) {
        MaintenanceRequest r = a.getRequest();
        return HomeServiceAssignmentDTO.builder()
                .id(a.getId())
                .requestId(r.getId())
                .customerName(r.getCustomer().getName())
                .customerPhone(r.getCustomer().getPhone())
                .carMake(r.getCar().getMake())
                .carModel(r.getCar().getModel())
                .carPlateNumber(r.getCar().getPlateNumber())
                .serviceTypeName(!r.getServiceTypes().isEmpty() ? r.getServiceTypes().get(0).getName() : null)
                .description(r.getDescription())
                .locationLat(r.getLocationLat())
                .locationLng(r.getLocationLng())
                .locationAddress(r.getLocationAddress())
                .city(r.getCity())
                .workshopId(a.getWorkshop().getId())
                .workshopName(a.getWorkshop().getName())
                .technicianId(a.getTechnician() != null ? a.getTechnician().getId() : null)
                .technicianName(a.getTechnician() != null ? a.getTechnician().getName() : null)
                .technicianPhone(a.getTechnician() != null ? a.getTechnician().getPhone() : null)
                .technicianSpecialty(a.getTechnician() != null ? a.getTechnician().getSpecialty() : null)
                .status(a.getStatus())
                .assignedAt(a.getAssignedAt())
                .enRouteAt(a.getEnRouteAt())
                .arrivedAt(a.getArrivedAt())
                .startedAt(a.getStartedAt())
                .completedAt(a.getCompletedAt())
                .createdAt(a.getCreatedAt())
                .build();
    }

    private RequestStatusHistoryDTO toStatusHistoryDTO(RequestStatusHistory h) {
        return RequestStatusHistoryDTO.builder()
                .id(h.getId())
                .requestId(h.getRequest().getId())
                .status(h.getStatus())
                .notes(h.getNotes())
                .createdBy(h.getCreatedBy())
                .createdAt(h.getCreatedAt())
                .build();
    }

    private static final java.util.Map<String, String> SERVICE_CATEGORY_MAP = new java.util.LinkedHashMap<>();

    static {
        SERVICE_CATEGORY_MAP.put("بطارية", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("battery", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("oil", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("فراامل", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("brake", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("إطار", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("tire", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("مكيف", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("ac", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("فلتر", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("filter", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("دوري", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("maintenance", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("فحص", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("inspection", "mobile_mechanic");
        SERVICE_CATEGORY_MAP.put("مولود", "mobile_mechanic");

        SERVICE_CATEGORY_MAP.put("محرك", "workshop");
        SERVICE_CATEGORY_MAP.put("engine", "workshop");
        SERVICE_CATEGORY_MAP.put("قير", "workshop");
        SERVICE_CATEGORY_MAP.put("transmission", "workshop");
        SERVICE_CATEGORY_MAP.put("جير", "workshop");
        SERVICE_CATEGORY_MAP.put("سمكرة", "workshop");
        SERVICE_CATEGORY_MAP.put("body", "workshop");
        SERVICE_CATEGORY_MAP.put("دهان", "workshop");
        SERVICE_CATEGORY_MAP.put("paint", "workshop");
        SERVICE_CATEGORY_MAP.put("دينمو", "workshop");
        SERVICE_CATEGORY_MAP.put("alternator", "workshop");
        SERVICE_CATEGORY_MAP.put("سلف", "workshop");
        SERVICE_CATEGORY_MAP.put("starter", "workshop");
        SERVICE_CATEGORY_MAP.put("مساعدات", "workshop");
        SERVICE_CATEGORY_MAP.put("suspension", "workshop");
        SERVICE_CATEGORY_MAP.put("شاصي", "workshop");
        SERVICE_CATEGORY_MAP.put("عادم", "workshop");
        SERVICE_CATEGORY_MAP.put("exhaust", "workshop");
        SERVICE_CATEGORY_MAP.put("تبريد", "workshop");
        SERVICE_CATEGORY_MAP.put("radiator", "workshop");

        SERVICE_CATEGORY_MAP.put("ونش", "tow_truck");
        SERVICE_CATEGORY_MAP.put("سحب", "tow_truck");
        SERVICE_CATEGORY_MAP.put("tow", "tow_truck");
        SERVICE_CATEGORY_MAP.put("سحب", "tow_truck");
        SERVICE_CATEGORY_MAP.put("تعطل", "tow_truck");
        SERVICE_CATEGORY_MAP.put("accident", "tow_truck");
        SERVICE_CATEGORY_MAP.put("تصليح", "tow_truck");
        SERVICE_CATEGORY_MAP.put("مشوار", "tow_truck");
    }

    private String determineCategory(String description, String serviceName) {
        String combined = (description != null ? description : "") + " " + (serviceName != null ? serviceName : "");
        for (var entry : SERVICE_CATEGORY_MAP.entrySet()) {
            if (combined.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        var serviceTypeOpt = serviceTypeRepository.findByName(serviceName);
        if (serviceTypeOpt.isPresent() && serviceTypeOpt.get().getCategory() != null) {
            return serviceTypeOpt.get().getCategory();
        }
        return "workshop";
    }
}
