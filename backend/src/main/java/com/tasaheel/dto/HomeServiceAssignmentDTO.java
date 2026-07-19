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
public class HomeServiceAssignmentDTO {
    private Long id;
    private Long requestId;
    private String customerName;
    private String customerPhone;
    private String carMake;
    private String carModel;
    private String carPlateNumber;
    private String serviceTypeName;
    private String description;
    private Double locationLat;
    private Double locationLng;
    private String locationAddress;
    private String city;
    private Long technicianId;
    private String technicianName;
    private String technicianPhone;
    private String technicianSpecialty;
    private Long workshopId;
    private String workshopName;
    private String status;
    private LocalDateTime assignedAt;
    private LocalDateTime enRouteAt;
    private LocalDateTime arrivedAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
}
