package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "workshops")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Workshop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "owner_name")
    private String ownerName;

    @Column(nullable = false, unique = true)
    private String phone;

    @Column
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(nullable = false)
    private String city;

    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(columnDefinition = "TEXT")
    private String services;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(name = "cover_image_url", columnDefinition = "TEXT")
    private String coverImageUrl;

    @Column(name = "commercial_registration", columnDefinition = "TEXT")
    private String commercialRegistration;

    @Column(name = "municipality_license", columnDefinition = "TEXT")
    private String municipalityLicense;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(nullable = false)
    @Builder.Default
    private Double rating = 0.0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_approved", nullable = false)
    @Builder.Default
    private Boolean isApproved = false;

    @Column(name = "workshop_type")
    @Builder.Default
    private String workshopType = "stationary";

    @Column(name = "provides_pickup_delivery")
    @Builder.Default
    private Boolean providesPickupDelivery = false;

    @Column(name = "working_hours", columnDefinition = "TEXT")
    private String workingHours;

    @Column(name = "fcm_token", columnDefinition = "TEXT")
    private String fcmToken;

    @Column(name = "whatsapp", columnDefinition = "TEXT")
    private String whatsapp;

    @Column(name = "website", columnDefinition = "TEXT")
    private String website;

    @Column(name = "tiktok_url", columnDefinition = "TEXT")
    private String tiktokUrl;

    @Column(name = "snapchat_url", columnDefinition = "TEXT")
    private String snapchatUrl;

    @Column(name = "facebook_url", columnDefinition = "TEXT")
    private String facebookUrl;

    @Column(name = "instagram_url", columnDefinition = "TEXT")
    private String instagramUrl;

    @Column(name = "x_url", columnDefinition = "TEXT")
    private String xUrl;

    @Column(name = "youtube_url", columnDefinition = "TEXT")
    private String youtubeUrl;

    @Column(columnDefinition = "TEXT")
    private String features;

    @Column(name = "beneficiary_name")
    private String beneficiaryName;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "iban")
    private String iban;

    @Column(name = "tax_number")
    private String taxNumber;

    @Column(name = "commission_percentage")
    private Double commissionPercentage;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "contract_url", columnDefinition = "TEXT")
    private String contractUrl;

    @Column(name = "contract_signed_at")
    private java.time.LocalDate contractSignedAt;

    @Column(name = "contract_expires_at")
    private java.time.LocalDate contractExpiresAt;

    @Column(name = "password_setup_completed")
    @Builder.Default
    private Boolean passwordSetupCompleted = false;

    @Column(name = "last_invitation_sent_at")
    private LocalDateTime lastInvitationSentAt;

    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
