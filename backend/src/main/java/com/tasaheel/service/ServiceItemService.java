package com.tasaheel.service;

import com.tasaheel.dto.ServiceItemResponseDTO;
import com.tasaheel.entity.MaintenanceRequest;
import com.tasaheel.entity.ServiceItem;
import com.tasaheel.entity.ServiceType;
import com.tasaheel.entity.Workshop;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.ServiceItemRepository;
import com.tasaheel.repository.WorkshopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceItemService {

    private final ServiceItemRepository serviceItemRepository;
    private final WorkshopRepository workshopRepository;

    @Transactional
    public void createServiceItems(MaintenanceRequest request) {
        for (ServiceType st : request.getServiceTypes()) {
            ServiceItem item = ServiceItem.builder()
                    .request(request)
                    .serviceType(st)
                    .status("NEW")
                    .build();
            serviceItemRepository.save(item);
        }
    }

    @Transactional
    public void assignServiceTypeToWorkshop(Long requestId, Long serviceTypeId, Long workshopId) {
        Workshop workshop = workshopRepository.findById(workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", workshopId));
        ServiceItem item = serviceItemRepository.findByRequestId(requestId).stream()
                .filter(si -> si.getServiceType().getId().equals(serviceTypeId))
                .findFirst().orElse(null);
        if (item != null) {
            item.setWorkshop(workshop);
            item.setStatus("ASSIGNED");
            item.setAssignedAt(LocalDateTime.now());
            serviceItemRepository.save(item);
        }
    }

    @Transactional
    public void updateStatus(Long itemId, String status) {
        ServiceItem item = serviceItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceItem", itemId));
        item.setStatus(status);
        switch (status) {
            case "ASSIGNED" -> item.setAssignedAt(LocalDateTime.now());
            case "ACCEPTED" -> item.setAcceptedAt(LocalDateTime.now());
            case "COMPLETED" -> item.setCompletedAt(LocalDateTime.now());
            case "VERIFIED" -> item.setVerifiedAt(LocalDateTime.now());
        }
        serviceItemRepository.save(item);
    }

    public List<ServiceItemResponseDTO> getServiceItems(Long requestId) {
        return serviceItemRepository.findByRequestId(requestId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public boolean allCompleted(Long requestId) {
        long total = serviceItemRepository.findByRequestId(requestId).size();
        long done = serviceItemRepository.findByRequestId(requestId).stream()
                .filter(si -> List.of("COMPLETED", "VERIFIED", "PAID").contains(si.getStatus()))
                .count();
        return done == total;
    }

    private ServiceItemResponseDTO toDTO(ServiceItem item) {
        return ServiceItemResponseDTO.builder()
                .id(item.getId())
                .requestId(item.getRequest().getId())
                .serviceTypeId(item.getServiceType().getId())
                .serviceTypeName(item.getServiceType().getName())
                .workshopId(item.getWorkshop() != null ? item.getWorkshop().getId() : null)
                .workshopName(item.getWorkshop() != null ? item.getWorkshop().getName() : null)
                .status(item.getStatus())
                .createdAt(item.getCreatedAt())
                .assignedAt(item.getAssignedAt())
                .acceptedAt(item.getAcceptedAt())
                .completedAt(item.getCompletedAt())
                .verifiedAt(item.getVerifiedAt())
                .build();
    }
}
