package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_audit_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "service_id")
    private Long serviceId;

    @Column(name = "workshop_id")
    private Long workshopId;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(length = 100)
    private String field;

    @Column(columnDefinition = "TEXT")
    private String oldValue;

    @Column(columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "performed_by")
    private Long performedBy;

    @Column(name = "performed_by_role")
    private String performedByRole;

    @Column(name = "performed_at")
    @Builder.Default
    private LocalDateTime performedAt = LocalDateTime.now();
}
