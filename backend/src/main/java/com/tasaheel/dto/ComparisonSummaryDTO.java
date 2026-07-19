package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComparisonSummaryDTO {
    private Double lowestPrice;
    private Double highestPrice;
    private Double averagePrice;
    private Integer quoteCount;
    private Integer fastestDays;
}
