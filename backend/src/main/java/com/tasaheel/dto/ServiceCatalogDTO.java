package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCatalogDTO {
    private Long categoryId;
    private String categoryName;
    private String categoryNameEn;
    private String categoryIcon;
    private Integer displayOrder;
    private List<ServiceTemplateDTO> templates;
    private Integer workshopCount;
}
