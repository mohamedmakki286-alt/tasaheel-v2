package com.tasaheel.controller;

import com.tasaheel.dto.ApiResponse;
import com.tasaheel.dto.ServiceCatalogDTO;
import com.tasaheel.dto.ServiceTemplateDTO;
import com.tasaheel.entity.ServiceCategory;
import com.tasaheel.entity.ServiceTemplate;
import com.tasaheel.entity.WorkshopServiceListing;
import com.tasaheel.repository.ServiceCategoryRepository;
import com.tasaheel.repository.ServiceTemplateRepository;
import com.tasaheel.repository.WorkshopServiceListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/service-catalog")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ServiceCatalogController {

    private final ServiceCategoryRepository categoryRepository;
    private final ServiceTemplateRepository templateRepository;
    private final WorkshopServiceListingRepository serviceListingRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceCatalogDTO>>> getCatalog(
            @RequestParam(required = false) String search) {
        List<ServiceCategory> categories = categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        List<ServiceTemplate> templates = search != null && !search.isBlank()
                ? templateRepository.searchActive(search)
                : templateRepository.findAllActive();

        Map<Long, List<ServiceTemplate>> grouped = templates.stream()
                .collect(Collectors.groupingBy(t -> t.getCategory().getId(), LinkedHashMap::new, Collectors.toList()));

        List<ServiceCatalogDTO> result = new ArrayList<>();
        for (ServiceCategory cat : categories) {
            List<ServiceTemplate> catTemplates = grouped.getOrDefault(cat.getId(), Collections.emptyList());
            long workshopCount = serviceListingRepository.countWorkshopsByCategoryId(cat.getId());
            result.add(ServiceCatalogDTO.builder()
                    .categoryId(cat.getId())
                    .categoryName(cat.getName())
                    .categoryNameEn(cat.getNameEn())
                    .categoryIcon(cat.getIcon())
                    .displayOrder(cat.getDisplayOrder())
                    .templates(catTemplates.stream().map(this::toTemplateDTO).collect(Collectors.toList()))
                    .workshopCount((int) workshopCount)
                    .build());
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<ServiceCatalogDTO>> getCategoryTemplates(@PathVariable Long categoryId) {
        ServiceCategory cat = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new com.tasaheel.exception.ResourceNotFoundException("Category", categoryId));
        List<ServiceTemplate> templates = templateRepository.findActiveByCategoryId(categoryId);
        long workshopCount = serviceListingRepository.countWorkshopsByCategoryId(categoryId);
        ServiceCatalogDTO dto = ServiceCatalogDTO.builder()
                .categoryId(cat.getId())
                .categoryName(cat.getName())
                .categoryNameEn(cat.getNameEn())
                .categoryIcon(cat.getIcon())
                .displayOrder(cat.getDisplayOrder())
                .templates(templates.stream().map(this::toTemplateDTO).collect(Collectors.toList()))
                .workshopCount((int) workshopCount)
                .build();
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/customer/services")
    public ResponseEntity<ApiResponse<List<ServiceCatalogDTO>>> getCustomerServices() {
        List<ServiceCategory> categories = categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        List<ServiceCatalogDTO> result = new ArrayList<>();
        for (ServiceCategory cat : categories) {
            List<ServiceTemplate> templates = templateRepository.findActiveByCategoryId(cat.getId());
            List<Map<String, Object>> services = new ArrayList<>();
            for (ServiceTemplate t : templates) {
                Map<String, Object> svc = new LinkedHashMap<>();
                svc.put("id", t.getId());
                svc.put("name", t.getName());
                svc.put("nameEn", t.getNameEn());
                svc.put("duration", t.getDefaultDuration());
                svc.put("description", t.getDescription());
                long workshopOffering = serviceListingRepository.countByServiceTemplateIdAndAvailable(t.getId());
                svc.put("workshopCount", workshopOffering);
                services.add(svc);
            }
            result.add(ServiceCatalogDTO.builder()
                    .categoryId(cat.getId())
                    .categoryName(cat.getName())
                    .categoryNameEn(cat.getNameEn())
                    .categoryIcon(cat.getIcon())
                    .displayOrder(cat.getDisplayOrder())
                    .templates(templates.stream().map(this::toTemplateDTO).collect(Collectors.toList()))
                    .workshopCount(services.size())
                    .build());
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/templates/{templateId}")
    public ResponseEntity<ApiResponse<ServiceTemplateDTO>> getTemplateById(@PathVariable Long templateId) {
        ServiceTemplate template = templateRepository.findById(templateId)
                .filter(ServiceTemplate::getIsActive)
                .orElseThrow(() -> new com.tasaheel.exception.ResourceNotFoundException("ServiceTemplate", templateId));
        return ResponseEntity.ok(ApiResponse.success(toTemplateDTO(template)));
    }

    @GetMapping("/templates/{templateId}/workshops")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWorkshopsForTemplate(
            @PathVariable Long templateId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        List<WorkshopServiceListing> listings = serviceListingRepository
                .findByServiceTemplateIdAndVisibleAndAvailable(templateId);

        List<Map<String, Object>> result = new ArrayList<>();
        for (WorkshopServiceListing listing : listings) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("workshopId", listing.getWorkshop().getId());
            item.put("workshopName", listing.getWorkshop().getName());
            item.put("listingId", listing.getId());
            item.put("price", listing.getPrice());
            item.put("priceType", listing.getPriceType());
            item.put("estimatedDuration", listing.getEstimatedDuration());
            item.put("workshopRating", listing.getWorkshop().getRating());
            item.put("workshopCity", listing.getWorkshop().getCity());

            if (lat != null && lng != null && listing.getWorkshop().getLatitude() != null && listing.getWorkshop().getLongitude() != null) {
                double dist = haversine(lat, lng, listing.getWorkshop().getLatitude(), listing.getWorkshop().getLongitude());
                item.put("distanceKm", Math.round(dist * 10.0) / 10.0);
            }
            result.add(item);
        }
        result.sort((a, b) -> {
            Double da = (Double) a.getOrDefault("distanceKm", 9999.0);
            Double db = (Double) b.getOrDefault("distanceKm", 9999.0);
            return da.compareTo(db);
        });
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private double haversine(double lat1, double lng1, double lat2, double lng2) {
        double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private ServiceTemplateDTO toTemplateDTO(ServiceTemplate t) {
        return ServiceTemplateDTO.builder()
                .id(t.getId())
                .name(t.getName())
                .nameEn(t.getNameEn())
                .categoryId(t.getCategory().getId())
                .categoryName(t.getCategory().getName())
                .categoryIcon(t.getCategory().getIcon())
                .defaultDuration(t.getDefaultDuration())
                .description(t.getDescription())
                .icon(t.getIcon())
                .isActive(t.getIsActive())
                .build();
    }
}
