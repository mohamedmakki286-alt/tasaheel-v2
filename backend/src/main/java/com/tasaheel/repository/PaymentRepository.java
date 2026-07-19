package com.tasaheel.repository;

import com.tasaheel.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Page<Payment> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);
    Optional<Payment> findByMoyasarPaymentId(String moyasarPaymentId);
    Optional<Payment> findFirstByRequestIdAndStatusOrderByCreatedAtDesc(Long requestId, String status);
    Page<Payment> findByStatus(String status, Pageable pageable);
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = ?1 AND p.createdAt >= ?2")
    Double sumByStatusAndCreatedAtAfter(String status, LocalDateTime after);
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = ?1")
    Double sumByStatus(String status);
    long countByStatus(String status);
}
