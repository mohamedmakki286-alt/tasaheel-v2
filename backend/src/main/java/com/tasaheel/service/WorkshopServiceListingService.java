package com.tasaheel.service;

import com.tasaheel.dto.*;
import com.tasaheel.entity.*;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class WorkshopServiceListingService {

    private final WorkshopServiceListingRepository serviceListingRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final ServiceTemplateRepository templateRepository;
    private final ServiceImageRepository imageRepository;
    private final ServicePricingRepository pricingRepository;
    private final ServiceAuditLogRepository auditLogRepository;
    private final WorkshopRepository workshopRepository;

    // === WORKSHOP SERVICE CRUD ===

    public WorkshopServiceListingDTO createService(Long workshopId, CreateWorkshopServiceRequest req, Long userId) {
        Workshop workshop = workshopRepository.findById(workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", workshopId));

        ServiceCategory category = null;
        if (req.getCategoryId() != null) {
            category = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", req.getCategoryId()));
        }

        com.tasaheel.entity.ServiceTemplate template = null;
        if (req.getServiceTemplateId() != null) {
            template = templateRepository.findById(req.getServiceTemplateId())
                    .orElseThrow(() -> new ResourceNotFoundException("ServiceTemplate", req.getServiceTemplateId()));
            if (category == null && template.getCategory() != null) {
                category = template.getCategory();
            }
        }

        Integer maxOrder = serviceListingRepository.findMaxDisplayOrder(workshopId);

        WorkshopServiceListing service = WorkshopServiceListing.builder()
                .workshop(workshop)
                .category(category)
                .serviceTemplate(template)
                .name(req.getName())
                .description(req.getDescription())
                .price(req.getPrice())
                .priceType(req.getPriceType() != null ? req.getPriceType() : "fixed")
                .estimatedDuration(req.getEstimatedDuration())
                .icon(req.getIcon())
                .isVisible(req.getIsVisible() != null ? req.getIsVisible() : true)
                .isAvailable(req.getIsAvailable() != null ? req.getIsAvailable() : true)
                .displayOrder(req.getDisplayOrder() != null ? req.getDisplayOrder() : maxOrder + 1)
                .build();

        service = serviceListingRepository.save(service);

        // Save price history
        ServicePricing pricing = ServicePricing.builder()
                .service(service)
                .price(req.getPrice())
                .priceType(service.getPriceType())
                .effectiveFrom(LocalDateTime.now())
                .performedBy(userId)
                .build();
        pricingRepository.save(pricing);

        // Audit log
        logAudit(service.getId(), workshopId, "CREATE", null, null, service.getName(), userId, "workshop");

        return toDTO(service);
    }

    @Transactional(readOnly = true)
    public WorkshopServiceListingDTO getService(Long id) {
        WorkshopServiceListing service = serviceListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", id));
        return toDTO(service);
    }

    @Transactional(readOnly = true)
    public WorkshopServiceListingDTO getServiceByUuid(String uuid) {
        WorkshopServiceListing service = serviceListingRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Service", "uuid", uuid));
        return toDTO(service);
    }

    @Transactional(readOnly = true)
    public List<WorkshopServiceListingDTO> getWorkshopServices(Long workshopId) {
        return serviceListingRepository.findByWorkshopId(workshopId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkshopServiceListingDTO> getWorkshopVisibleServices(Long workshopId) {
        return serviceListingRepository.findVisibleByWorkshopId(workshopId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WorkshopServiceListingDTO> getWorkshopAvailableServices(Long workshopId) {
        return serviceListingRepository.findAvailableByWorkshopId(workshopId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<WorkshopServiceListingDTO> searchWorkshopServices(Long workshopId, String search, int page, int size) {
        Page<WorkshopServiceListing> result = serviceListingRepository.searchByWorkshopId(
                workshopId, search, PageRequest.of(page, size, Sort.by("displayOrder").ascending()));
        return result.map(this::toDTO);
    }

    public WorkshopServiceListingDTO updateService(Long id, UpdateWorkshopServiceRequest req, Long userId) {
        WorkshopServiceListing service = serviceListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", id));

        if (req.getName() != null) {
            logAudit(id, service.getWorkshop().getId(), "UPDATE", "name", service.getName(), req.getName(), userId, "workshop");
            service.setName(req.getName());
        }
        if (req.getCategoryId() != null) {
            ServiceCategory cat = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", req.getCategoryId()));
            logAudit(id, service.getWorkshop().getId(), "UPDATE", "category",
                    service.getCategory() != null ? service.getCategory().getName() : null, cat.getName(), userId, "workshop");
            service.setCategory(cat);
        }
        if (req.getDescription() != null) service.setDescription(req.getDescription());
        if (req.getPrice() != null) {
            logAudit(id, service.getWorkshop().getId(), "UPDATE", "price",
                    String.valueOf(service.getPrice()), String.valueOf(req.getPrice()), userId, "workshop");
            service.setPrice(req.getPrice());

            // Save price history
            ServicePricing pricing = ServicePricing.builder()
                    .service(service)
                    .price(req.getPrice())
                    .priceType(req.getPriceType() != null ? req.getPriceType() : service.getPriceType())
                    .effectiveFrom(LocalDateTime.now())
                    .performedBy(userId)
                    .build();
            pricingRepository.save(pricing);
        }
        if (req.getPriceType() != null) service.setPriceType(req.getPriceType());
        if (req.getEstimatedDuration() != null) service.setEstimatedDuration(req.getEstimatedDuration());
        if (req.getIcon() != null) service.setIcon(req.getIcon());
        if (req.getIsVisible() != null) {
            if (!req.getIsVisible().equals(service.getIsVisible())) {
                logAudit(id, service.getWorkshop().getId(), "TOGGLE_VISIBILITY", "isVisible",
                        String.valueOf(service.getIsVisible()), String.valueOf(req.getIsVisible()), userId, "workshop");
            }
            service.setIsVisible(req.getIsVisible());
        }
        if (req.getIsAvailable() != null) {
            if (!req.getIsAvailable().equals(service.getIsAvailable())) {
                logAudit(id, service.getWorkshop().getId(), "TOGGLE_AVAILABILITY", "isAvailable",
                        String.valueOf(service.getIsAvailable()), String.valueOf(req.getIsAvailable()), userId, "workshop");
            }
            service.setIsAvailable(req.getIsAvailable());
        }
        if (req.getDisplayOrder() != null) service.setDisplayOrder(req.getDisplayOrder());

        service.setUpdatedAt(LocalDateTime.now());
        service = serviceListingRepository.save(service);
        return toDTO(service);
    }

    public void deleteService(Long id, Long userId) {
        WorkshopServiceListing service = serviceListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", id));
        service.setIsDeleted(true);
        service.setUpdatedAt(LocalDateTime.now());
        serviceListingRepository.save(service);
        logAudit(id, service.getWorkshop().getId(), "SOFT_DELETE", "isDeleted", "false", "true", userId, "workshop");
    }

    public void restoreService(Long id, Long userId) {
        WorkshopServiceListing service = serviceListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", id));
        service.setIsDeleted(false);
        service.setUpdatedAt(LocalDateTime.now());
        serviceListingRepository.save(service);
        logAudit(id, service.getWorkshop().getId(), "RESTORE", "isDeleted", "true", "false", userId, "workshop");
    }

    public WorkshopServiceListingDTO duplicateService(Long id, Long userId) {
        WorkshopServiceListing original = serviceListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", id));

        Integer maxOrder = serviceListingRepository.findMaxDisplayOrder(original.getWorkshop().getId());

        WorkshopServiceListing copy = WorkshopServiceListing.builder()
                .workshop(original.getWorkshop())
                .category(original.getCategory())
                .serviceTemplate(original.getServiceTemplate())
                .name(original.getName() + " (نسخة)")
                .description(original.getDescription())
                .price(original.getPrice())
                .priceType(original.getPriceType())
                .estimatedDuration(original.getEstimatedDuration())
                .icon(original.getIcon())
                .isVisible(false)
                .isAvailable(original.getIsAvailable())
                .displayOrder(maxOrder + 1)
                .build();

        copy = serviceListingRepository.save(copy);
        logAudit(copy.getId(), copy.getWorkshop().getId(), "CREATE", null, null, copy.getName(), userId, "workshop");
        return toDTO(copy);
    }

    public void reorderServices(Long workshopId, List<Long> serviceIds, Long userId) {
        for (int i = 0; i < serviceIds.size(); i++) {
            serviceListingRepository.findById(serviceIds.get(i)).ifPresent(s -> {
                if (s.getWorkshop().getId().equals(workshopId)) {
                    s.setDisplayOrder(serviceIds.indexOf(s.getId()));
                    s.setUpdatedAt(LocalDateTime.now());
                    serviceListingRepository.save(s);
                }
            });
        }
        logAudit(null, workshopId, "REORDER", "displayOrder", null, "reordered " + serviceIds.size() + " services", userId, "workshop");
    }

    // === CATEGORY MANAGEMENT ===

    @Transactional(readOnly = true)
    public List<ServiceCategoryDTO> getCategories() {
        return categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(this::toCategoryDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ServiceCategoryDTO> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(this::toCategoryDTO)
                .collect(Collectors.toList());
    }

    public ServiceCategoryDTO createCategory(String name, String nameEn, String icon, Integer displayOrder, Long userId) {
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Category name already exists");
        }
        ServiceCategory category = ServiceCategory.builder()
                .name(name)
                .nameEn(nameEn)
                .icon(icon)
                .displayOrder(displayOrder != null ? displayOrder : 0)
                .build();
        category = categoryRepository.save(category);
        return toCategoryDTO(category);
    }

    public ServiceCategoryDTO updateCategory(Long id, String name, String nameEn, String icon, Integer displayOrder, Boolean isActive, Long userId) {
        ServiceCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        if (name != null) category.setName(name);
        if (nameEn != null) category.setNameEn(nameEn);
        if (icon != null) category.setIcon(icon);
        if (displayOrder != null) category.setDisplayOrder(displayOrder);
        if (isActive != null) category.setIsActive(isActive);
        category.setUpdatedAt(LocalDateTime.now());
        category = categoryRepository.save(category);
        return toCategoryDTO(category);
    }

    // === ADMIN OPERATIONS ===

    @Transactional(readOnly = true)
    public Page<WorkshopServiceListingDTO> adminGetAllServices(String search, Long workshopId, Long categoryId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<WorkshopServiceListingDTO> result;
        if (search != null && !search.isBlank()) {
            result = serviceListingRepository.searchAllActive(search, pageRequest).map(this::toDTO);
        } else {
            result = serviceListingRepository.findAllActive(pageRequest).map(this::toDTO);
        }
        // Filter by workshop/category in memory (can optimize later)
        if (workshopId != null) {
            List<WorkshopServiceListingDTO> filtered = result.getContent().stream()
                    .filter(s -> workshopId.equals(s.getWorkshopId()))
                    .collect(Collectors.toList());
            return new org.springframework.data.domain.PageImpl<>(filtered, pageRequest, filtered.size());
        }
        if (categoryId != null) {
            List<WorkshopServiceListingDTO> filtered = result.getContent().stream()
                    .filter(s -> categoryId.equals(s.getCategoryId()))
                    .collect(Collectors.toList());
            return new org.springframework.data.domain.PageImpl<>(filtered, pageRequest, filtered.size());
        }
        return result;
    }

    public void adminToggleServiceVisibility(Long id, Long adminId) {
        WorkshopServiceListing service = serviceListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", id));
        service.setIsVisible(!service.getIsVisible());
        service.setUpdatedAt(LocalDateTime.now());
        serviceListingRepository.save(service);
        logAudit(id, service.getWorkshop().getId(), "TOGGLE_VISIBILITY", "isVisible",
                String.valueOf(!service.getIsVisible()), String.valueOf(service.getIsVisible()), adminId, "admin");
    }

    public void adminDeleteService(Long id, Long adminId) {
        WorkshopServiceListing service = serviceListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service", id));
        service.setIsDeleted(true);
        service.setUpdatedAt(LocalDateTime.now());
        serviceListingRepository.save(service);
        logAudit(id, service.getWorkshop().getId(), "DELETE", "isDeleted", "false", "true", adminId, "admin");
    }

    // === AUDIT LOG ===

    @Transactional(readOnly = true)
    public Page<ServiceAuditLogDTO> getAuditLog(Long workshopId, int page, int size) {
        Page<ServiceAuditLog> logs;
        if (workshopId != null) {
            logs = auditLogRepository.findByWorkshopIdPaged(workshopId, PageRequest.of(page, size));
        } else {
            logs = auditLogRepository.findAllPaged(PageRequest.of(page, size));
        }
        return logs.map(this::toAuditLogDTO);
    }

    // === HELPERS ===

    private void logAudit(Long serviceId, Long workshopId, String action, String field, String oldValue, String newValue, Long userId, String role) {
        ServiceAuditLog audit = ServiceAuditLog.builder()
                .serviceId(serviceId)
                .workshopId(workshopId)
                .action(action)
                .field(field)
                .oldValue(oldValue)
                .newValue(newValue)
                .performedBy(userId)
                .performedByRole(role)
                .build();
        auditLogRepository.save(audit);
    }

    @Transactional(readOnly = true)
    private WorkshopServiceListingDTO toDTO(WorkshopServiceListing s) {
        List<String> images = imageRepository.findByServiceIdOrderByDisplayOrderAsc(s.getId()).stream()
                .map(ServiceImage::getImageUrl)
                .collect(Collectors.toList());

        return WorkshopServiceListingDTO.builder()
                .id(s.getId())
                .uuid(s.getUuid())
                .workshopId(s.getWorkshop().getId())
                .workshopName(s.getWorkshop().getName())
                .categoryId(s.getCategory() != null ? s.getCategory().getId() : null)
                .categoryName(s.getCategory() != null ? s.getCategory().getName() : null)
                .serviceTemplateId(s.getServiceTemplate() != null ? s.getServiceTemplate().getId() : null)
                .templateName(s.getServiceTemplate() != null ? s.getServiceTemplate().getName() : null)
                .name(s.getName())
                .description(s.getDescription())
                .price(s.getPrice())
                .priceType(s.getPriceType())
                .estimatedDuration(s.getEstimatedDuration())
                .icon(s.getIcon())
                .images(images)
                .isVisible(s.getIsVisible())
                .isAvailable(s.getIsAvailable())
                .displayOrder(s.getDisplayOrder())
                .isDeleted(s.getIsDeleted())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    private ServiceCategoryDTO toCategoryDTO(ServiceCategory c) {
        long count = 0;
        return ServiceCategoryDTO.builder()
                .id(c.getId())
                .name(c.getName())
                .nameEn(c.getNameEn())
                .icon(c.getIcon())
                .displayOrder(c.getDisplayOrder())
                .isActive(c.getIsActive())
                .serviceCount(count)
                .createdAt(c.getCreatedAt())
                .build();
    }

    private ServiceAuditLogDTO toAuditLogDTO(ServiceAuditLog a) {
        String serviceName = "";
        if (a.getServiceId() != null) {
            var sOpt = serviceListingRepository.findById(a.getServiceId());
            if (sOpt.isPresent()) serviceName = sOpt.get().getName();
        }
        String workshopName = "";
        if (a.getWorkshopId() != null) {
            var wOpt = workshopRepository.findById(a.getWorkshopId());
            if (wOpt.isPresent()) workshopName = wOpt.get().getName();
        }
        return ServiceAuditLogDTO.builder()
                .id(a.getId())
                .serviceId(a.getServiceId())
                .serviceName(serviceName)
                .workshopId(a.getWorkshopId())
                .workshopName(workshopName)
                .action(a.getAction())
                .field(a.getField())
                .oldValue(a.getOldValue())
                .newValue(a.getNewValue())
                .performedBy(a.getPerformedBy())
                .performedByRole(a.getPerformedByRole())
                .performedAt(a.getPerformedAt())
                .build();
    }
}
