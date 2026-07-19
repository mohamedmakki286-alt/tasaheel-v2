package com.tasaheel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWorkshopServiceRequest {
    @NotBlank(message = "Service name is required")
    private String name;

    private Long categoryId;

    private Long serviceTemplateId;

    private String description;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private Double price;

    @NotBlank(message = "Price type is required")
    private String priceType;

    private String estimatedDuration;
    private String icon;
    private Boolean isVisible;
    private Boolean isAvailable;
    private Integer displayOrder;
}
