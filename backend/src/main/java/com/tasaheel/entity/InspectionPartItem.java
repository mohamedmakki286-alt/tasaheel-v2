package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "inspection_part_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InspectionPartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private InspectionReport report;

    @Column(name = "part_name", nullable = false)
    private String partName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false)
    private Double unitPrice;

    @Column(nullable = false)
    private Double total;
}
