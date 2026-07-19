package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialStatsDTO {
    private Double totalRevenue;
    private Long totalInvoices;
    private Long paidCount;
    private Long pendingCount;
    private Double pendingAmount;
}
