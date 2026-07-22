package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private Long id;
    private Long userId;
    private String userRole;
    private String type;
    private String title;
    private String body;
    private Long requestId;
    private String eventType;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
