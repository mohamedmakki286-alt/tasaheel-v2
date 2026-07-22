package com.tasaheel.controller;

import com.tasaheel.dto.ApiResponse;
import com.tasaheel.dto.ServiceCatalogDTO;
import com.tasaheel.dto.ServiceTemplateDTO;
import com.tasaheel.entity.ServiceType;
import com.tasaheel.repository.ServiceTypeRepository;
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

    private final ServiceTypeRepository serviceTypeRepository;

    private static final LinkedHashMap<String, String[]> CATEGORY_META = new LinkedHashMap<>();
    static {
        CATEGORY_META.put("periodic", new String[]{"الصيانة الدورية", "periodic", "🚗"});
        CATEGORY_META.put("mechanical", new String[]{"الميكانيكا", "mechanical", "🔧"});
        CATEGORY_META.put("electrical", new String[]{"الكهرباء", "electrical", "⚡"});
        CATEGORY_META.put("ac", new String[]{"التكييف", "ac", "❄️"});
        CATEGORY_META.put("suspension", new String[]{"الإطارات والتعليق", "suspension", "🛞"});
        CATEGORY_META.put("bodywork", new String[]{"السمكرة والدهان", "bodywork", "🎨"});
        CATEGORY_META.put("emergency", new String[]{"الطوارئ", "emergency", "🚨"});
        CATEGORY_META.put("inspection", new String[]{"الفحص والتقييم", "inspection", "🔍"});
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceCatalogDTO>>> getCatalog(
            @RequestParam(required = false) String search) {
        List<ServiceType> types = search != null && !search.isBlank()
                ? serviceTypeRepository.findByIsActiveTrue().stream()
                    .filter(t -> t.getName().contains(search) || (t.getNameEn() != null && t.getNameEn().contains(search)))
                    .collect(Collectors.toList())
                : serviceTypeRepository.findByIsActiveTrue();

        Map<String, List<ServiceType>> grouped = types.stream()
                .filter(t -> t.getCategory() != null)
                .collect(Collectors.groupingBy(ServiceType::getCategory, LinkedHashMap::new, Collectors.toList()));

        List<ServiceCatalogDTO> result = new ArrayList<>();
        int order = 0;
        for (Map.Entry<String, List<ServiceType>> entry : grouped.entrySet()) {
            String catKey = entry.getKey();
            String[] meta = CATEGORY_META.getOrDefault(catKey, new String[]{catKey, catKey, "🔧"});
            List<ServiceType> catTypes = entry.getValue();
            result.add(ServiceCatalogDTO.builder()
                    .categoryId((long) (order + 1))
                    .categoryName(meta[0])
                    .categoryNameEn(meta[1])
                    .categoryIcon(meta[2])
                    .displayOrder(order++)
                    .templates(catTypes.stream().map(this::toTemplateDTO).collect(Collectors.toList()))
                    .workshopCount(catTypes.size())
                    .build());
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<ServiceCatalogDTO>> getCategoryTemplates(@PathVariable Long categoryId) {
        int idx = categoryId.intValue() - 1;
        List<String> keys = new ArrayList<>(CATEGORY_META.keySet());
        if (idx < 0 || idx >= keys.size()) {
            throw new com.tasaheel.exception.ResourceNotFoundException("Category", categoryId);
        }
        String catKey = keys.get(idx);
        String[] meta = CATEGORY_META.get(catKey);
        List<ServiceType> types = serviceTypeRepository.findByIsActiveTrue().stream()
                .filter(t -> catKey.equals(t.getCategory()))
                .collect(Collectors.toList());
        ServiceCatalogDTO dto = ServiceCatalogDTO.builder()
                .categoryId(categoryId)
                .categoryName(meta[0])
                .categoryNameEn(meta[1])
                .categoryIcon(meta[2])
                .displayOrder(idx)
                .templates(types.stream().map(this::toTemplateDTO).collect(Collectors.toList()))
                .workshopCount(types.size())
                .build();
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/customer/services")
    public ResponseEntity<ApiResponse<List<ServiceCatalogDTO>>> getCustomerServices() {
        return getCatalog(null);
    }

    @GetMapping("/templates/{templateId}")
    public ResponseEntity<ApiResponse<ServiceTemplateDTO>> getTemplateById(@PathVariable Long templateId) {
        ServiceType st = serviceTypeRepository.findById(templateId)
                .filter(ServiceType::getIsActive)
                .orElseThrow(() -> new com.tasaheel.exception.ResourceNotFoundException("ServiceTemplate", templateId));
        return ResponseEntity.ok(ApiResponse.success(toTemplateDTO(st)));
    }

    @GetMapping("/templates/{templateId}/workshops")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWorkshopsForTemplate(
            @PathVariable Long templateId,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        return ResponseEntity.ok(ApiResponse.success(new ArrayList<>()));
    }

    private ServiceTemplateDTO toTemplateDTO(ServiceType t) {
        return ServiceTemplateDTO.builder()
                .id(t.getId())
                .name(t.getName())
                .nameEn(t.getNameEn())
                .categoryId(0L)
                .categoryName(t.getCategory())
                .categoryIcon(null)
                .defaultDuration(t.getEstimatedDuration())
                .description(t.getDescription())
                .icon(t.getIcon())
                .isActive(t.getIsActive())
                .build();
    }
}
