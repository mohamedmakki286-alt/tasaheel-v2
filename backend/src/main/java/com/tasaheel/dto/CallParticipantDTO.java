package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallParticipantDTO {
    private Long requestId;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long assignedTechnicianId;
    private String technicianName;
    private String technicianPhone;
    private Long workshopId;
    private String workshopName;
    private boolean canCall;
    private String denialReason;
    private String requestStatus;
}
