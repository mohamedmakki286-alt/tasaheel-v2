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
public class CarHistoryDTO {
    private Long requestId;
    private String status;
    private String serviceTypeName;
    private String workshopName;
    private Double grandTotal;
    private String invoiceStatus;
    private String reportStatus;
    private LocalDateTime createdAt;
}
