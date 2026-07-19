package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "workshop_offers")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WorkshopOffer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "workshop_id", nullable = false)
    private Workshop workshop;
    @Column(nullable = false) private String title;
    @Column(columnDefinition = "TEXT") private String description;
    @Column(nullable = false) @Builder.Default private String type = "package";
    @Column(name = "service_names", columnDefinition = "TEXT") private String serviceNames;
    @Column(name = "original_price") private Double originalPrice;
    @Column(name = "offer_price", nullable = false) private Double offerPrice;
    @Column(name = "start_date") private LocalDate startDate;
    @Column(name = "end_date") private LocalDate endDate;
    @Column(name = "is_active") @Builder.Default private Boolean isActive = true;
    @Column(name = "created_at") @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();
}
