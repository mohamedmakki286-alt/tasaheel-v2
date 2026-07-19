package com.tasaheel.dto;

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
public class QuoteDTO {
    private Long id;
    private Long requestId;
    private Long workshopId;
    private String workshopName;
    private String workshopLogo;
    private Long serviceTypeId;
    private String serviceTypeName;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private Double price;

    private String notes;
    private Integer estimatedDays;
    private Integer warrantyMonths;
    private String status;
    private LocalDateTime createdAt;
}
