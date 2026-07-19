package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkshopDashboardDTO {
    private Double totalRevenue;
    private Double totalPending;
    private Double totalCommission;
    private Double totalNet;
    private Double totalSettled;
    private Double pendingSettlement;
    private Long invoiceCount;
    private Long paidCount;
    private Long pendingCount;
    private Long rejectedCount;
    private Long settledCount;
    private List<MonthlyRevenueDTO> monthlyRevenue;
    private List<TransactionDTO> recentTransactions;
}
