package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkshopSettlementDTO {
    private Long id;
    private Long workshopId;
    private String workshopName;
    private String settlementNumber;
    private Double totalGrossAmount;
    private Double totalCommission;
    private Double totalNetAmount;
    private Integer invoiceCount;
    private String status;
    private String notes;
    private LocalDateTime settledAt;
    private Long journalEntryId;
    private LocalDateTime createdAt;
    private List<InvoiceDTO> invoices;
}
