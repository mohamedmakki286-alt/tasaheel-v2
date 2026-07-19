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
public class TechnicianDTO {
    private Long id;
    private String name;
    private String phone;
    private String email;
    private String password;
    private String specialty;
    private Long workshopId;
    private String workshopName;
    private Boolean isActive;
    private Boolean isOnline;
    private Double latitude;
    private Double longitude;
    private String fcmToken;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
