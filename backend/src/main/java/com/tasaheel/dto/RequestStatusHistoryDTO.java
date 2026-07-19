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
public class RequestStatusHistoryDTO {
    private Long id;
    private Long requestId;
    private String status;
    private String notes;
    private String createdBy;
    private LocalDateTime createdAt;
}
