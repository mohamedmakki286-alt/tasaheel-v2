package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "workshop_settlements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkshopSettlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workshop_id", nullable = false)
    private Workshop workshop;

    @Column(name = "settlement_number", unique = true, nullable = false, length = 30)
    private String settlementNumber;

    @Column(name = "total_gross_amount", nullable = false)
    private Double totalGrossAmount;

    @Column(name = "total_commission", nullable = false)
    private Double totalCommission;

    @Column(name = "total_net_amount", nullable = false)
    private Double totalNetAmount;

    @Column(name = "invoice_count", nullable = false)
    private Integer invoiceCount;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "settled_at")
    private LocalDateTime settledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id")
    private JournalEntry journalEntry;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
