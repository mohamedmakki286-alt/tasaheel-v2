package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "customer_cars")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerCar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(nullable = false)
    private String make;

    @Column(nullable = false)
    private String model;

    @Column(name = "car_year", nullable = false)
    private Integer year;

    @Column(name = "plate_number")
    private String plateNumber;

    @Column
    private String color;

    @Column
    private Integer mileage;

    @Column(name = "next_oil_change_date")
    private java.time.LocalDate nextOilChangeDate;

    @Column(name = "next_oil_change_mileage")
    private Integer nextOilChangeMileage;

    @Column(name = "next_appointment_date")
    private java.time.LocalDate nextAppointmentDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
