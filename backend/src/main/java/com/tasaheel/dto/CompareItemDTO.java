package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompareItemDTO {
    private Long id;
    private Long workshopId;
    private String workshopName;
    private String workshopCity;
    private Double workshopRating;
    private String workshopType;
    private Double price;
    private Integer estimatedDays;
    private Integer warrantyMonths;
    private String notes;
    private String status;
    private LocalDateTime createdAt;
    private Boolean isBestPrice;
    private Boolean isFastest;
    private Boolean isHighestRated;
}
