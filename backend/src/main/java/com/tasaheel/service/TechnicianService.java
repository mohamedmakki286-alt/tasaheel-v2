package com.tasaheel.service;

import com.tasaheel.dto.HomeServiceAssignmentDTO;
import com.tasaheel.dto.MaintenanceRequestDTO;
import com.tasaheel.dto.MediaDTO;
import com.tasaheel.dto.TechnicianDTO;
import com.tasaheel.entity.*;
import com.tasaheel.event.EventPublisher;
import com.tasaheel.event.EventType;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.exception.UnauthorizedException;
import com.tasaheel.repository.ChatRoomRepository;
import com.tasaheel.repository.HomeServiceAssignmentRepository;
import com.tasaheel.repository.MaintenanceRequestRepository;
import com.tasaheel.repository.MediaRepository;
import com.tasaheel.repository.QuoteRepository;
import com.tasaheel.repository.RequestStatusHistoryRepository;
import com.tasaheel.repository.TechnicianRepository;
import com.tasaheel.repository.WorkshopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TechnicianService {

    private final TechnicianRepository technicianRepository;
    private final HomeServiceAssignmentRepository assignmentRepository;
    private final WorkshopRepository workshopRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final MediaRepository mediaRepository;
    private final QuoteRepository quoteRepository;
    private final RequestStatusHistoryRepository statusHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final EventPublisher eventPublisher;

    // ---- Technician CRUD ----

    public List<TechnicianDTO> getWorkshopTechnicians(Long workshopId) {
        return technicianRepository.findByWorkshopId(workshopId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public TechnicianDTO getTechnicianById(Long id, Long workshopId) {
        Technician tech = technicianRepository.findByIdAndWorkshopId(id, workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician", id));
        return toDTO(tech);
    }

    @Transactional
    public TechnicianDTO createTechnician(TechnicianDTO dto, Long workshopId) {
        if (technicianRepository.existsByPhone(dto.getPhone())) {
            throw new BadRequestException("Phone number already registered");
        }

        Workshop workshop = workshopRepository.getReferenceById(workshopId);

        Technician tech = Technician.builder()
                .name(dto.getName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .specialty(dto.getSpecialty())
                .workshop(workshop)
                .isActive(true)
                .isOnline(false)
                .availabilityStatus(dto.getAvailabilityStatus() != null ? dto.getAvailabilityStatus() : "available")
                .profileImageUrl(dto.getProfileImageUrl())
                .build();

        tech = technicianRepository.save(tech);
        return toDTO(tech);
    }

    @Transactional
    public TechnicianDTO updateTechnician(Long id, Long workshopId, TechnicianDTO dto) {
        Technician tech = technicianRepository.findByIdAndWorkshopId(id, workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician", id));

        if (dto.getName() != null) tech.setName(dto.getName());
        if (dto.getPhone() != null) {
            technicianRepository.findByPhone(dto.getPhone())
                    .ifPresent(existing -> { if (!existing.getId().equals(id)) throw new BadRequestException("Phone already in use"); });
            tech.setPhone(dto.getPhone());
        }
        if (dto.getEmail() != null) tech.setEmail(dto.getEmail());
        if (dto.getSpecialty() != null) tech.setSpecialty(dto.getSpecialty());
        if (dto.getAvailabilityStatus() != null) tech.setAvailabilityStatus(dto.getAvailabilityStatus());
        if (dto.getProfileImageUrl() != null) tech.setProfileImageUrl(dto.getProfileImageUrl());
        if (dto.getIsOnline() != null) tech.setIsOnline(dto.getIsOnline());
        if (dto.getIsActive() != null) tech.setIsActive(dto.getIsActive());
        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            tech.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        tech = technicianRepository.save(tech);
        return toDTO(tech);
    }

    @Transactional
    public void deleteTechnician(Long id, Long workshopId) {
        Technician tech = technicianRepository.findByIdAndWorkshopId(id, workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician", id));
        tech.setIsActive(false);
        technicianRepository.save(tech);
    }

    // ---- Home Service Assignments ----

    public List<HomeServiceAssignmentDTO> getWorkshopAssignments(Long workshopId) {
        return assignmentRepository.findByWorkshopIdOrderByCreatedAtDesc(workshopId).stream()
                .map(this::toAssignmentDTO)
                .collect(Collectors.toList());
    }

    public List<HomeServiceAssignmentDTO> getWorkshopAssignmentsByStatus(Long workshopId, String status) {
        return assignmentRepository.findByWorkshopIdAndStatusOrderByCreatedAtDesc(workshopId, status).stream()
                .map(this::toAssignmentDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public HomeServiceAssignmentDTO assignTechnician(Long assignmentId, Long workshopId, Long technicianId) {
        HomeServiceAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("HomeServiceAssignment", assignmentId));

        if (!assignment.getWorkshop().getId().equals(workshopId)) {
            throw new BadRequestException("Assignment does not belong to this workshop");
        }

        Technician tech = technicianRepository.findByIdAndWorkshopId(technicianId, workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician", technicianId));

        assignment.setTechnician(tech);
        assignment.setStatus("assigned");
        assignment.setAssignedAt(java.time.LocalDateTime.now());
        assignment = assignmentRepository.save(assignment);

        // Add technician to chat room for this request
        chatRoomRepository.findByRequestId(assignment.getRequest().getId()).ifPresent(room -> {
            room.setTechnician(tech);
            chatRoomRepository.save(room);
        });

        return toAssignmentDTO(assignment);
    }

    @Transactional
    public HomeServiceAssignmentDTO updateAssignmentStatus(Long assignmentId, Long workshopId, String status) {
        HomeServiceAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("HomeServiceAssignment", assignmentId));

        if (!assignment.getWorkshop().getId().equals(workshopId)) {
            throw new BadRequestException("Assignment does not belong to this workshop");
        }

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        assignment.setStatus(status);

        switch (status) {
            case "en_route" -> assignment.setEnRouteAt(now);
            case "arrived" -> assignment.setArrivedAt(now);
            case "in_progress" -> assignment.setStartedAt(now);
            case "completed" -> {
                assignment.setCompletedAt(now);
                markWorkAwaitingPayment(assignment.getRequest(), "workshop:" + workshopId);
            }
        }

        assignment = assignmentRepository.save(assignment);
        return toAssignmentDTO(assignment);
    }

    public HomeServiceAssignmentDTO getAssignmentByRequestId(Long requestId) {
        HomeServiceAssignment assignment = assignmentRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("HomeServiceAssignment not found for request", requestId));
        return toAssignmentDTO(assignment);
    }

    // ---- Technician Self-Service (logged-in technician) ----

    public TechnicianDTO getTechnicianProfile(Long technicianId) {
        Technician tech = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician", technicianId));
        return toDTO(tech);
    }

    @Transactional
    public TechnicianDTO updateTechnicianProfile(Long technicianId, java.util.Map<String, Object> body) {
        Technician tech = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician", technicianId));
        if (body.containsKey("name")) tech.setName((String) body.get("name"));
        if (body.containsKey("phone")) tech.setPhone((String) body.get("phone"));
        if (body.containsKey("email")) tech.setEmail((String) body.get("email"));
        if (body.containsKey("specialty")) tech.setSpecialty((String) body.get("specialty"));
        if (body.containsKey("profileImageUrl")) tech.setProfileImageUrl((String) body.get("profileImageUrl"));
        if (body.containsKey("latitude")) tech.setLatitude(((Number) body.get("latitude")).doubleValue());
        if (body.containsKey("longitude")) tech.setLongitude(((Number) body.get("longitude")).doubleValue());
        tech = technicianRepository.save(tech);
        return toDTO(tech);
    }

    @Transactional
    public TechnicianDTO updateAvailability(Long technicianId, String status) {
        Technician tech = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician", technicianId));
        tech.setAvailabilityStatus(status);
        tech = technicianRepository.save(tech);
        return toDTO(tech);
    }

    public List<HomeServiceAssignmentDTO> getTechnicianAssignments(Long technicianId) {
        return assignmentRepository.findByTechnicianId(technicianId).stream()
                .map(this::toAssignmentDTO)
                .collect(Collectors.toList());
    }

    public List<MaintenanceRequestDTO> getTechnicianAssignedRequests(Long technicianId) {
        return maintenanceRequestRepository.findByTechnicianIdOrderByCreatedAtDesc(technicianId).stream()
                .map(this::toRequestDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MaintenanceRequestDTO updateTechnicianRequestStatus(Long requestId, Long technicianId, String status) {
        MaintenanceRequest request = maintenanceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));

        if (request.getTechnician() == null || !request.getTechnician().getId().equals(technicianId)) {
            throw new BadRequestException("This request is not assigned to you");
        }

        String effectiveStatus = "completed".equals(status) ? "awaiting_payment" : status;
        boolean allowed = ("customer_approved".equals(request.getStatus()) && "in_progress".equals(effectiveStatus))
                || ("in_progress".equals(request.getStatus()) && "awaiting_payment".equals(effectiveStatus));
        if (!allowed) {
            throw new BadRequestException("Cannot transition from " + request.getStatus() + " to " + effectiveStatus);
        }
        request.setStatus(effectiveStatus);
        maintenanceRequestRepository.save(request);
        statusHistoryRepository.save(RequestStatusHistory.builder()
                .request(request)
                .status(effectiveStatus)
                .notes("Status updated by assigned technician")
                .createdBy("technician:" + technicianId)
                .build());

        Long customerId = request.getCustomer() != null ? request.getCustomer().getId() : null;

        eventPublisher.publish(this, EventType.STATUS_UPDATED, requestId, "technician", technicianId);

        return toRequestDTO(request);
    }

    @Transactional
    public HomeServiceAssignmentDTO updateTechnicianAssignmentStatus(Long assignmentId, Long technicianId, String status) {
        HomeServiceAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("HomeServiceAssignment", assignmentId));

        if (assignment.getTechnician() == null || !assignment.getTechnician().getId().equals(technicianId)) {
            throw new BadRequestException("This assignment is not assigned to you");
        }

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        assignment.setStatus(status);

        switch (status) {
            case "accepted" -> assignment.setAssignedAt(now);
            case "en_route" -> assignment.setEnRouteAt(now);
            case "arrived" -> assignment.setArrivedAt(now);
            case "in_progress" -> assignment.setStartedAt(now);
            case "completed" -> {
                assignment.setCompletedAt(now);
                markWorkAwaitingPayment(assignment.getRequest(), "technician:" + technicianId);
            }
        }

        assignment = assignmentRepository.save(assignment);
        return toAssignmentDTO(assignment);
    }

    @Transactional
    public void changeEmail(Long technicianId, String newEmail, String currentPassword) {
        Technician tech = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician", technicianId));

        if (newEmail == null || newEmail.isBlank()) {
            throw new BadRequestException("New email is required");
        }
        newEmail = newEmail.trim().toLowerCase();
        if (!newEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new BadRequestException("Invalid email format");
        }
        if (currentPassword == null || currentPassword.isBlank()) {
            throw new BadRequestException("Current password is required");
        }
        if (!passwordEncoder.matches(currentPassword, tech.getPassword())) {
            throw new UnauthorizedException("Current password is incorrect");
        }
        if (!newEmail.equals(tech.getEmail())) {
            technicianRepository.findByEmail(newEmail).ifPresent(existing -> {
                if (!existing.getId().equals(technicianId)) {
                    throw new BadRequestException("Email already registered");
                }
            });
            tech.setEmail(newEmail);
            technicianRepository.save(tech);
        }
    }

    @Transactional
    public void changePassword(Long technicianId, String currentPassword, String newPassword) {
        Technician tech = technicianRepository.findById(technicianId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician", technicianId));

        if (currentPassword == null || currentPassword.isBlank()) {
            throw new BadRequestException("Current password is required");
        }
        if (newPassword == null || newPassword.isBlank()) {
            throw new BadRequestException("New password is required");
        }
        if (newPassword.length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters");
        }
        if (!passwordEncoder.matches(currentPassword, tech.getPassword())) {
            throw new UnauthorizedException("Current password is incorrect");
        }
        tech.setPassword(passwordEncoder.encode(newPassword));
        technicianRepository.save(tech);
    }

    // ---- Assign Technician to Any Request (not just home service) ----

    @Transactional
    public MaintenanceRequestDTO assignTechnicianToRequest(Long requestId, Long workshopId, Long technicianId) {
        MaintenanceRequest request = maintenanceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
        requireSelectedWorkshop(requestId, workshopId);
        if (!List.of("accepted", "inspection_report", "customer_approved", "in_progress").contains(request.getStatus())) {
            throw new BadRequestException("Technician cannot be assigned in request status " + request.getStatus());
        }

        Technician tech = technicianRepository.findByIdAndWorkshopId(technicianId, workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Technician", technicianId));
        if (!Boolean.TRUE.equals(tech.getIsActive())) {
            throw new BadRequestException("Technician is inactive");
        }

        request.setTechnician(tech);
        maintenanceRequestRepository.save(request);
        statusHistoryRepository.save(RequestStatusHistory.builder()
                .request(request)
                .status(request.getStatus())
                .notes("Technician assigned: " + tech.getName())
                .createdBy("workshop:" + workshopId)
                .build());

        // Add technician to chat room if exists
        chatRoomRepository.findByRequestId(requestId).ifPresent(room -> {
            room.setTechnician(tech);
            chatRoomRepository.save(room);
        });

        return toRequestDTO(request);
    }

    @Transactional
    public MaintenanceRequestDTO unassignTechnicianFromRequest(Long requestId, Long workshopId) {
        MaintenanceRequest request = maintenanceRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
        requireSelectedWorkshop(requestId, workshopId);
        if ("in_progress".equals(request.getStatus()) || "awaiting_payment".equals(request.getStatus())
                || "completed".equals(request.getStatus())) {
            throw new BadRequestException("Technician cannot be removed after work has started");
        }

        request.setTechnician(null);
        maintenanceRequestRepository.save(request);
        statusHistoryRepository.save(RequestStatusHistory.builder()
                .request(request)
                .status(request.getStatus())
                .notes("Technician unassigned")
                .createdBy("workshop:" + workshopId)
                .build());

        return toRequestDTO(request);
    }

    private void requireSelectedWorkshop(Long requestId, Long workshopId) {
        boolean selected = quoteRepository.findByRequestIdAndStatus(requestId, "accepted")
                .map(quote -> quote.getWorkshop().getId().equals(workshopId))
                .orElse(false);
        if (!selected) {
            throw new BadRequestException("Only the selected workshop can manage technicians for this request");
        }
    }

    private void markWorkAwaitingPayment(MaintenanceRequest request, String actor) {
        request.setStatus("awaiting_payment");
        maintenanceRequestRepository.save(request);
        statusHistoryRepository.save(RequestStatusHistory.builder()
                .request(request)
                .status("awaiting_payment")
                .notes("Work completed; awaiting invoice payment")
                .createdBy(actor)
                .build());
    }

    private MaintenanceRequestDTO toRequestDTO(MaintenanceRequest r) {
        List<com.tasaheel.entity.ServiceType> sts = r.getServiceTypes();
        com.tasaheel.entity.ServiceType primary = sts.isEmpty() ? null : sts.get(0);
        MaintenanceRequestDTO dto = MaintenanceRequestDTO.builder()
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
                .serviceTypeIds(sts.stream().map(com.tasaheel.entity.ServiceType::getId).collect(Collectors.toList()))
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
                .technicianId(r.getTechnician() != null ? r.getTechnician().getId() : null)
                .technicianName(r.getTechnician() != null ? r.getTechnician().getName() : null)
                .technicianPhone(r.getTechnician() != null ? r.getTechnician().getPhone() : null)
                .technicianSpecialty(r.getTechnician() != null ? r.getTechnician().getSpecialty() : null)
                .build();
        List<MediaDTO> media = mediaRepository.findByRequestIdOrderByCreatedAtAsc(r.getId()).stream()
                .map(m -> MediaDTO.builder()
                        .id(m.getId())
                        .url(m.getUrl())
                        .type(m.getType())
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        dto.setMedia(media);
        return dto;
    }

    // ---- Mappers ----

    private TechnicianDTO toDTO(Technician tech) {
        return TechnicianDTO.builder()
                .id(tech.getId())
                .name(tech.getName())
                .phone(tech.getPhone())
                .email(tech.getEmail())
                .specialty(tech.getSpecialty())
                .workshopId(tech.getWorkshop() != null ? tech.getWorkshop().getId() : null)
                .isActive(tech.getIsActive())
                .isOnline(tech.getIsOnline())
                .latitude(tech.getLatitude())
                .longitude(tech.getLongitude())
                .fcmToken(tech.getFcmToken())
                .availabilityStatus(tech.getAvailabilityStatus())
                .profileImageUrl(tech.getProfileImageUrl())
                .workshopName(tech.getWorkshop() != null ? tech.getWorkshop().getName() : null)
                .createdAt(tech.getCreatedAt())
                .updatedAt(tech.getUpdatedAt())
                .build();
    }

    private HomeServiceAssignmentDTO toAssignmentDTO(HomeServiceAssignment a) {
        MaintenanceRequest req = a.getRequest();
        return HomeServiceAssignmentDTO.builder()
                .id(a.getId())
                .requestId(req.getId())
                .customerName(req.getCustomer().getName())
                .customerPhone(req.getCustomer().getPhone())
                .carMake(req.getCar().getMake())
                .carModel(req.getCar().getModel())
                .carPlateNumber(req.getCar().getPlateNumber())
                .serviceTypeName(!req.getServiceTypes().isEmpty() ? req.getServiceTypes().get(0).getName() : null)
                .description(req.getDescription())
                .locationLat(req.getLocationLat())
                .locationLng(req.getLocationLng())
                .locationAddress(req.getLocationAddress())
                .city(req.getCity())
                .technicianId(a.getTechnician() != null ? a.getTechnician().getId() : null)
                .technicianName(a.getTechnician() != null ? a.getTechnician().getName() : null)
                .technicianPhone(a.getTechnician() != null ? a.getTechnician().getPhone() : null)
                .technicianSpecialty(a.getTechnician() != null ? a.getTechnician().getSpecialty() : null)
                .workshopId(a.getWorkshop().getId())
                .workshopName(a.getWorkshop().getName())
                .status(a.getStatus())
                .assignedAt(a.getAssignedAt())
                .enRouteAt(a.getEnRouteAt())
                .arrivedAt(a.getArrivedAt())
                .startedAt(a.getStartedAt())
                .completedAt(a.getCompletedAt())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
