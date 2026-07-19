package com.tasaheel.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class WorkshopOfferRequest {
    @NotBlank private String title;
    private String description;
    private String type;
    private String serviceNames;
    @PositiveOrZero private Double originalPrice;
    @NotNull @PositiveOrZero private Double offerPrice;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isActive;
}
