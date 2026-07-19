package com.tasaheel.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkshopDTO {
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    private String ownerName;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^05\\d{8}$", message = "Phone must be a valid Saudi number")
    private String phone;

    @Email(message = "Email must be valid")
    private String email;

    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    private Double latitude;
    private Double longitude;
    private String services;
    private String description;
    private String logoUrl;
    private String coverImageUrl;
    private String commercialRegistration;
    private String municipalityLicense;
    private String rejectionReason;
    private Double rating;
    private String workshopType;
    private Boolean providesPickupDelivery;
    private Boolean isActive;
    private Boolean isApproved;
    private String workingHours;
    private String fcmToken;
    private String whatsapp;
    private String website;
    private String tiktokUrl;
    private String snapchatUrl;
    private String facebookUrl;
    private String instagramUrl;
    private String xUrl;
    private String youtubeUrl;
    private String features;
    private String beneficiaryName;
    private String bankName;
    private String iban;
    private String maskedIban;
    private String taxNumber;
    private Double commissionPercentage;
    private String adminNotes;
    private String contractUrl;
    private java.time.LocalDate contractSignedAt;
    private java.time.LocalDate contractExpiresAt;
    private Boolean passwordSetupCompleted;
    private LocalDateTime lastInvitationSentAt;
    private List<WorkshopGalleryDTO> gallery;
    private Long reviewCount;
    private Long completedJobs;
    private Long averageResponseTimeMinutes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
