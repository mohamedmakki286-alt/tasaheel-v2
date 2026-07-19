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
public class InspectionLaborItemDTO {
    private Long id;
    private Long reportId;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Hours is required")
    @Positive(message = "Hours must be positive")
    private Double hours;

    @NotNull(message = "Hourly rate is required")
    @Positive(message = "Hourly rate must be positive")
    private Double hourlyRate;

    private Double total;
}
