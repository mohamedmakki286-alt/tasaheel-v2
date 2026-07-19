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
public class TransportRequestDTO {
    private Long id;
    private Long requestId;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long driverId;
    private String driverName;
    private String driverPhone;
    private Double pickupLat;
    private Double pickupLng;
    private String pickupAddress;
    private Double dropoffLat;
    private Double dropoffLng;
    private String dropoffAddress;
    private String status;
    private Double price;
    private Double distance;
    private Integer estimatedTime;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
}
