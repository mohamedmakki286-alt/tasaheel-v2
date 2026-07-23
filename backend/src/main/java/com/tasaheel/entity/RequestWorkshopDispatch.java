package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "request_workshop_dispatches",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_request_workshop_dispatch",
                columnNames = {"request_id", "workshop_id"}
        ),
        indexes = {
                @Index(name = "idx_dispatch_workshop_status", columnList = "workshop_id,status"),
                @Index(name = "idx_dispatch_request", columnList = "request_id"),
                @Index(name = "idx_dispatch_expires_at", columnList = "expires_at")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestWorkshopDispatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private MaintenanceRequest request;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "workshop_id", nullable = false)
    private Workshop workshop;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "SENT";

    @Column(name = "is_preferred", nullable = false)
    @Builder.Default
    private Boolean isPreferred = false;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "viewed_at")
    private LocalDateTime viewedAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "decline_reason", columnDefinition = "TEXT")
    private String declineReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
