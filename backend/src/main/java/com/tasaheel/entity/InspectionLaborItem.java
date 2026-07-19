package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "inspection_labor_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InspectionLaborItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private InspectionReport report;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private Double hours;

    @Column(name = "hourly_rate", nullable = false)
    private Double hourlyRate;

    @Column(nullable = false)
    private Double total;
}
