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
public class ServiceItemResponseDTO {
    private Long id;
    private Long requestId;
    private Long serviceTypeId;
    private String serviceTypeName;
    private Long workshopId;
    private String workshopName;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime assignedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime completedAt;
    private LocalDateTime verifiedAt;
}
