package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_data_reset_audit_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestDataResetAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_user_id", nullable = false)
    private Long adminUserId;

    @Column(name = "admin_user_name")
    private String adminUserName;

    @Column(name = "customer_ids", columnDefinition = "TEXT")
    private String customerIds;

    @Column(name = "workshop_ids", columnDefinition = "TEXT")
    private String workshopIds;

    @Column(name = "technician_ids", columnDefinition = "TEXT")
    private String technicianIds;

    @Column(name = "total_records_deleted")
    private Long totalRecordsDeleted;

    @Column(name = "tables_affected", columnDefinition = "TEXT")
    private String tablesAffected;

    @Column(name = "files_deleted", columnDefinition = "TEXT")
    private String filesDeleted;

    @Column(name = "result", nullable = false, length = 20)
    private String result;

    @Column(columnDefinition = "TEXT")
    private String error;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
