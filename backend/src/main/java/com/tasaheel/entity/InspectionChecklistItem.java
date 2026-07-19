package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "inspection_checklist_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InspectionChecklistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private InspectionReport report;

    @Column(nullable = false)
    private String category;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
