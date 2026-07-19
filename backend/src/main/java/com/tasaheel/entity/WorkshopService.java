package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "workshop_services")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkshopService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workshop_id", nullable = false)
    private Workshop workshop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_type_id", nullable = false)
    private ServiceType serviceType;

    @Column(nullable = false)
    private Double price;
}
