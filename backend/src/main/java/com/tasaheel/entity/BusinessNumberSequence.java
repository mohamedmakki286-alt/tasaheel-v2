package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "business_number_sequences",
        uniqueConstraints = @UniqueConstraint(name = "ux_business_number_sequences_type_year",
                columnNames = {"document_type", "sequence_year"}))
@Getter
@Setter
@NoArgsConstructor
public class BusinessNumberSequence {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_type", nullable = false, length = 20)
    private String documentType;

    @Column(name = "sequence_year", nullable = false)
    private Integer sequenceYear;

    @Column(name = "last_value", nullable = false)
    private Long lastValue;
}

