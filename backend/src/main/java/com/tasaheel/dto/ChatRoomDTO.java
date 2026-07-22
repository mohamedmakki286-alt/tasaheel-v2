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
public class ChatRoomDTO {
    private Long id;
    private Long requestId;
    private Long customerId;
    private String customerName;
    private Long workshopId;
    private String workshopName;
    private Long driverId;
    private String driverName;
    private Long technicianId;
    private String technicianName;
    private ChatMessageDTO lastMessage;
    private long unreadCount;
    private LocalDateTime createdAt;
}
