package com.tasaheel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerCarDTO {
    private Long id;
    private Long customerId;

    @NotBlank(message = "Make is required")
    private String make;

    @NotBlank(message = "Model is required")
    private String model;

    @NotNull(message = "Year is required")
    @Positive(message = "Year must be positive")
    private Integer year;

    private String plateNumber;
    private String color;
    @Positive(message = "Mileage must be positive")
    private Integer mileage;
    private java.time.LocalDate nextOilChangeDate;
    private Integer nextOilChangeMileage;
    private java.time.LocalDate nextAppointmentDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
