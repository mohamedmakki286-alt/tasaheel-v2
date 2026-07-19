package com.tasaheel.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceTypeDTO {
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    private String nameEn;
    private String icon;
    private String description;
    private Boolean isActive;
    private String category;
    private String estimatedDuration;
}
