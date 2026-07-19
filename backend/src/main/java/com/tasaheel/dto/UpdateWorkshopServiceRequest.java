package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWorkshopServiceRequest {
    private String name;
    private Long categoryId;
    private String description;
    private Double price;
    private String priceType;
    private String estimatedDuration;
    private String icon;
    private Boolean isVisible;
    private Boolean isAvailable;
    private Integer displayOrder;
}
