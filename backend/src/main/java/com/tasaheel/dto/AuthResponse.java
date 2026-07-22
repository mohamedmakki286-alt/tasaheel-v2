package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private String role;
    private Long userId;
    private String name;
    private String phone;
    private String email;
    private Boolean isActive;
    private Boolean emailVerified;
    private Boolean isApproved;

    // Technician-specific fields
    private String specialty;
    private String availabilityStatus;
    private Long workshopId;
    private String workshopName;
    private String profileImageUrl;

    // Workshop-specific fields
    private String ownerName;
    private String address;
    private String city;
    private String workshopType;
    private String services;
    private String commercialRegistration;
    private String municipalityLicense;
    private String rejectionReason;
    private Double rating;
    private String tiktokUrl;
    private String snapchatUrl;
    private String facebookUrl;
    private Double latitude;
    private Double longitude;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
