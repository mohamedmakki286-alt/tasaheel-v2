package com.tasaheel.repository;

import com.tasaheel.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByRequestId(Long requestId);
    Page<Invoice> findByWorkshopIdOrderByCreatedAtDesc(Long workshopId, Pageable pageable);
    @Query("SELECT i FROM Invoice i WHERE i.customer.id = ?1 ORDER BY i.createdAt DESC")
    Page<Invoice> findByCustomerId(Long customerId, Pageable pageable);
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.createdAt >= ?1 AND i.createdAt < ?2")
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    @Query("SELECT COALESCE(SUM(i.grandTotal), 0) FROM Invoice i WHERE i.workshop.id = ?1 AND i.status = ?2")
    Double sumByWorkshopIdAndStatus(Long workshopId, String status);
    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.workshop.id = ?1 AND i.status = ?2")
    long countByWorkshopIdAndStatus(Long workshopId, String status);
    @Query("SELECT COALESCE(SUM(i.grandTotal), 0) FROM Invoice i WHERE i.status = ?1 AND i.paidAt >= ?2")
    Double sumByStatusAndPaidAtAfter(String status, LocalDateTime after);
    @Query("SELECT COALESCE(SUM(i.grandTotal), 0) FROM Invoice i WHERE i.status = ?1")
    Double sumByStatus(String status);
    long countByStatus(String status);
    @Query("SELECT FUNCTION('date', i.paidAt) as day, SUM(i.grandTotal) FROM Invoice i WHERE i.status = 'paid' AND i.paidAt >= ?1 GROUP BY FUNCTION('date', i.paidAt) ORDER BY day")
    List<Object[]> revenuePerDaySince(LocalDateTime since);

    @Query("SELECT i FROM Invoice i WHERE i.status = 'paid' AND i.settlement IS NULL ORDER BY i.paidAt ASC")
    List<Invoice> findPaidUnsettled();

    @Query("SELECT i FROM Invoice i WHERE i.status = 'paid' AND i.settlement IS NULL AND i.workshop.id = ?1 ORDER BY i.paidAt ASC")
    List<Invoice> findPaidUnsettledByWorkshopId(Long workshopId);

    @Query("SELECT i.workshop.id, i.workshop.name, COUNT(i), COALESCE(SUM(i.grandTotal), 0) " +
           "FROM Invoice i WHERE i.status = 'paid' AND i.settlement IS NULL " +
           "GROUP BY i.workshop.id, i.workshop.name")
    List<Object[]> aggregatePaidUnsettledByWorkshop();

    @Query("SELECT COALESCE(SUM(i.grandTotal), 0) FROM Invoice i WHERE i.status = 'paid' AND i.settlement IS NULL")
    Double sumPaidUnsettled();

    @Query("SELECT COALESCE(SUM(COALESCE(i.netAmount, i.grandTotal)), 0) FROM Invoice i WHERE i.status = 'paid' AND i.settlement IS NULL")
    Double sumNetPaidUnsettled();

    @Query("SELECT COALESCE(SUM(i.commissionAmount), 0) FROM Invoice i WHERE i.settlement.id = ?1")
    Double sumCommissionBySettlementId(Long settlementId);

    @Query("SELECT COALESCE(SUM(i.grandTotal), 0) FROM Invoice i WHERE i.status = 'paid' AND i.paidAt >= ?1 AND i.paidAt < ?2")
    Double sumPaidBetween(LocalDateTime from, LocalDateTime to);

    @Query("SELECT COALESCE(SUM(i.commissionAmount), 0) FROM Invoice i WHERE i.settlement IS NOT NULL AND i.settledAt >= ?1 AND i.settledAt < ?2")
    Double sumCommissionBetween(LocalDateTime from, LocalDateTime to);

    List<Invoice> findBySettlementId(Long settlementId);

    @Query("SELECT i FROM Invoice i WHERE i.workshop.id = ?1 AND i.settlement IS NOT NULL AND i.paidAt BETWEEN ?2 AND ?3")
    List<Invoice> findByWorkshopIdAndSettlementIsNotNullAndPaidAtBetween(Long workshopId, LocalDateTime from, LocalDateTime to);

    @Query("SELECT i FROM Invoice i WHERE i.settlement IS NOT NULL AND i.paidAt BETWEEN ?1 AND ?2")
    List<Invoice> findBySettlementIsNotNullAndPaidAtBetween(LocalDateTime from, LocalDateTime to);

    // Workshop dashboard queries
    @Query("SELECT COALESCE(SUM(i.commissionAmount), 0) FROM Invoice i WHERE i.workshop.id = ?1 AND i.status = ?2")
    Double sumCommissionByWorkshopIdAndStatus(Long workshopId, String status);

    @Query("SELECT COALESCE(SUM(i.commissionAmount), 0) FROM Invoice i WHERE i.status = 'paid'")
    Double sumAllPaidCommission();

    @Query("SELECT COALESCE(SUM(i.netAmount), 0) FROM Invoice i WHERE i.workshop.id = ?1 AND i.status = ?2")
    Double sumNetByWorkshopIdAndStatus(Long workshopId, String status);

    @Query("SELECT COALESCE(SUM(i.netAmount), 0) FROM Invoice i WHERE i.workshop.id = ?1 AND i.settlement IS NOT NULL")
    Double sumNetSettledByWorkshopId(Long workshopId);

    @Query("SELECT COALESCE(SUM(i.netAmount), 0) FROM Invoice i WHERE i.workshop.id = ?1 AND i.status = 'paid' AND i.settlement IS NULL")
    Double sumNetPendingSettlementByWorkshopId(Long workshopId);

    @Query("SELECT i FROM Invoice i WHERE i.workshop.id = ?1 AND i.status = 'paid' AND i.paidAt >= ?2 ORDER BY i.paidAt ASC")
    List<Invoice> findPaidByWorkshopSince(Long workshopId, LocalDateTime since);

    @Query("SELECT i FROM Invoice i WHERE i.workshop.id = ?1 ORDER BY i.createdAt DESC")
    List<Invoice> findRecentByWorkshopId(Long workshopId);

    Page<Invoice> findByWorkshopIdAndStatusOrderByCreatedAtDesc(Long workshopId, String status, Pageable pageable);

    long countByWorkshopId(Long workshopId);
    long countByWorkshopIdAndStatusAndSettlementIsNull(Long workshopId, String status);

    @Query("SELECT COALESCE(SUM(i.netAmount), 0) FROM Invoice i WHERE i.settlement IS NOT NULL AND i.workshop.id = ?1 AND i.settledAt >= ?2 AND i.settledAt < ?3")
    Double sumNetSettledBetweenByWorkshopId(Long workshopId, LocalDateTime from, LocalDateTime to);

    @Query("SELECT COALESCE(SUM(i.grandTotal), 0) FROM Invoice i WHERE i.workshop.id = ?1 AND i.status = 'paid' AND i.paidAt >= ?2 AND i.paidAt < ?3")
    Double sumPaidBetweenByWorkshopId(Long workshopId, LocalDateTime from, LocalDateTime to);

    @Query("SELECT COALESCE(SUM(i.commissionAmount), 0) FROM Invoice i WHERE i.workshop.id = ?1 AND i.status = 'paid' AND i.paidAt >= ?2 AND i.paidAt < ?3")
    Double sumCommissionPaidBetweenByWorkshopId(Long workshopId, LocalDateTime from, LocalDateTime to);
}
