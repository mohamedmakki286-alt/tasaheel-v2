package com.tasaheel.controller;

import com.tasaheel.dto.ApiResponse;
import com.tasaheel.dto.ServiceCatalogDTO;
import com.tasaheel.dto.ServiceTemplateDTO;
import com.tasaheel.entity.ServiceCategory;
import com.tasaheel.entity.ServiceTemplate;
import com.tasaheel.entity.Workshop;
import com.tasaheel.entity.WorkshopServiceListing;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.ServiceCategoryRepository;
import com.tasaheel.repository.ServiceTemplateRepository;
import com.tasaheel.repository.WorkshopServiceListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/service-catalog")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ServiceCatalogController {

    private final ServiceCategoryRepository categoryRepository;
    private final ServiceTemplateRepository templateRepository;
    private final WorkshopServiceListingRepository listingRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceCatalogDTO>>> getCatalog(
            @RequestParam(required = false) String search) {
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        List<ServiceCatalogDTO> result = categoryRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(category -> toCatalogDTO(category, normalizedSearch))
                .filter(dto -> normalizedSearch.isBlank()
                        || dto.getCategoryName().toLowerCase(Locale.ROOT).contains(normalizedSearch)
                        || (dto.getCategoryNameEn() != null
                            && dto.getCategoryNameEn().toLowerCase(Locale.ROOT).contains(normalizedSearch))
                        || !dto.getTemplates().isEmpty())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<ServiceCatalogDTO>> getCategoryTemplates(@PathVariable Long categoryId) {
        ServiceCategory category = categoryRepository.findById(categoryId)
                .filter(ServiceCategory::getIsActive)
                .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));
        return ResponseEntity.ok(ApiResponse.success(toCatalogDTO(category, "")));
    }

    @GetMapping("/customer/services")
    public ResponseEntity<ApiResponse<List<ServiceCatalogDTO>>> getCustomerServices() {
        return getCatalog(null);
    }

    @GetMapping("/templates/{templateId}")
    public ResponseEntity<ApiResponse<ServiceTemplateDTO>> getTemplateById(@PathVariable Long templateId) {
        ServiceTemplate template = templateRepository.findById(templateId)
                .filter(ServiceTemplate::getIsActive)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceTemplate", templateId));
        return ResponseEntity.ok(ApiResponse.success(toTemplateDTO(template)));
    }

    @GetMapping("/templates/{templateId}/workshops")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWorkshopsForTemplate(
            @PathVariable Long templateId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        templateRepository.findById(templateId)
                .filter(ServiceTemplate::getIsActive)
                .orElseThrow(() -> new ResourceNotFoundException("ServiceTemplate", templateId));
        List<Map<String, Object>> workshops = listingRepository
                .findByServiceTemplateIdAndVisibleAndAvailable(templateId).stream()
                .filter(listing -> Boolean.TRUE.equals(listing.getWorkshop().getIsApproved())
                        && Boolean.TRUE.equals(listing.getWorkshop().getIsActive()))
                .map(listing -> toTemplateWorkshop(listing, lat, lng))
                .sorted((first, second) -> {
                    double firstDistance = ((Number) first.getOrDefault("distanceKm", Double.MAX_VALUE)).doubleValue();
                    double secondDistance = ((Number) second.getOrDefault("distanceKm", Double.MAX_VALUE)).doubleValue();
                    return Double.compare(firstDistance, secondDistance);
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(workshops));
    }

    private ServiceCatalogDTO toCatalogDTO(ServiceCategory category, String search) {
        List<ServiceTemplateDTO> templates = templateRepository
                .findByCategory_IdAndIsActiveTrueOrderByIdAsc(category.getId()).stream()
                .filter(template -> search.isBlank()
                        || template.getName().toLowerCase(Locale.ROOT).contains(search)
                        || (template.getNameEn() != null
                            && template.getNameEn().toLowerCase(Locale.ROOT).contains(search)))
                .map(this::toTemplateDTO)
                .collect(Collectors.toList());
        return ServiceCatalogDTO.builder()
                .categoryId(category.getId())
                .categoryName(category.getName())
                .categoryNameEn(category.getNameEn())
                .categoryIcon(category.getIcon())
                .displayOrder(category.getDisplayOrder())
                .templates(templates)
                .workshopCount(Math.toIntExact(
                        listingRepository.countWorkshopsByCategoryId(category.getId())))
                .build();
    }

    private ServiceTemplateDTO toTemplateDTO(ServiceTemplate template) {
        return ServiceTemplateDTO.builder()
                .id(template.getId())
                .name(template.getName())
                .nameEn(template.getNameEn())
                .categoryId(template.getCategory().getId())
                .categoryName(template.getCategory().getName())
                .categoryIcon(template.getCategory().getIcon())
                .defaultDuration(template.getDefaultDuration())
                .description(template.getDescription())
                .icon(template.getIcon())
                .isActive(template.getIsActive())
                .build();
    }

    private Map<String, Object> toTemplateWorkshop(
            WorkshopServiceListing listing,
            Double customerLat,
            Double customerLng) {
        Workshop workshop = listing.getWorkshop();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("workshopId", workshop.getId());
        result.put("workshopName", workshop.getName());
        result.put("listingId", listing.getId());
        result.put("price", listing.getPrice());
        result.put("priceType", listing.getPriceType());
        result.put("estimatedDuration", listing.getEstimatedDuration() == null ? "" : listing.getEstimatedDuration());
        result.put("workshopRating", workshop.getRating() == null ? 0.0 : workshop.getRating());
        result.put("workshopCity", workshop.getCity() == null ? "" : workshop.getCity());
        if (customerLat != null && customerLng != null
                && workshop.getLatitude() != null && workshop.getLongitude() != null) {
            result.put("distanceKm", Math.round(
                    distanceKm(customerLat, customerLng, workshop.getLatitude(), workshop.getLongitude()) * 10.0
            ) / 10.0);
        }
        return result;
    }

    private double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double earthRadiusKm = 6371.0;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lngDistance = Math.toRadians(lng2 - lng1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
        return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}
