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
public class PaymentDTO {
    private Long id;
    private Long requestId;
    private Long customerId;
    private String customerName;
    private Double amount;
    private Double fee;
    private Double total;
    private String currency;
    private String method;
    private String status;
    private String moyasarPaymentId;
    private String moyasarInvoiceId;
    private String paymentUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
