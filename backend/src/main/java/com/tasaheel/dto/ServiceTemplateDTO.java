package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceTemplateDTO {
    private Long id;
    private String name;
    private String nameEn;
    private Long categoryId;
    private String categoryName;
    private String categoryIcon;
    private String defaultDuration;
    private String description;
    private String icon;
    private Boolean isActive;
}
