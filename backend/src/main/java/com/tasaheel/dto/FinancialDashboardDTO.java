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
public class FinancialDashboardDTO {
    private SummaryDTO summary;
    private List<MonthlyRevenueDTO> monthlyRevenue;
    private List<WorkshopPerformanceDTO> workshopPerformance;
    private List<TransactionDTO> recentTransactions;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SummaryDTO {
        private Double totalRevenue;
        private Double totalCommission;
        private Double totalNetToWorkshops;
        private Double totalPendingSettlement;
        private Double revenueChange;
        private Double commissionChange;
        private Double pendingChange;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class WorkshopPerformanceDTO {
        private Long workshopId;
        private String workshopName;
        private Integer invoiceCount;
        private Double totalGross;
        private Double totalCommission;
        private Double averageCommissionRate;
        private Double totalNet;
        private String settlementStatus;
    }
}
