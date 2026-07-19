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
public class ServiceAuditLogDTO {
    private Long id;
    private Long serviceId;
    private String serviceName;
    private Long workshopId;
    private String workshopName;
    private String action;
    private String field;
    private String oldValue;
    private String newValue;
    private Long performedBy;
    private String performedByRole;
    private LocalDateTime performedAt;
}
