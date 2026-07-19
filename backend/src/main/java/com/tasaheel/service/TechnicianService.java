package com.tasaheel.service;

import com.tasaheel.dto.HomeServiceAssignmentDTO;
import com.tasaheel.dto.TechnicianDTO;
import com.tasaheel.entity.*;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.HomeServiceAssignmentRepository;
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
    private final PasswordEncoder passwordEncoder;

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
                assignment.getRequest().setStatus("completed");
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
