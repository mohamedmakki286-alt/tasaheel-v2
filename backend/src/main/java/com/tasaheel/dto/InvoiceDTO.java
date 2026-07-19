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
public class InvoiceDTO {
    private Long id;
    private Long requestId;
    private Long customerId;
    private String customerName;
    private Long workshopId;
    private String workshopName;
    private String invoiceNumber;
    private Double partsTotal;
    private Double laborTotal;
    private Double totalAmount;
    private Double tax;
    private Double taxPercent;
    private Double grandTotal;
    private String status;
    private String paymentMethod;
    private String paymentId;
    private LocalDateTime paidAt;
    private Double commissionPercentage;
    private Double commissionAmount;
    private Double netAmount;
    private Long settlementId;
    private LocalDateTime settledAt;
    private LocalDateTime createdAt;
    private List<InvoiceItemDTO> items;
}
