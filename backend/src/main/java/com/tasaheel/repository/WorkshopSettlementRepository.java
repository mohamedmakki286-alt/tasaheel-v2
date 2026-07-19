package com.tasaheel.repository;

import com.tasaheel.entity.WorkshopSettlement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkshopSettlementRepository extends JpaRepository<WorkshopSettlement, Long> {
    Page<WorkshopSettlement> findByWorkshopIdOrderByCreatedAtDesc(Long workshopId, Pageable pageable);

    Page<WorkshopSettlement> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    @Query("SELECT s.workshop.id as workshopId, s.workshop.name as workshopName, " +
           "SUM(s.invoiceCount) as invoiceCount, SUM(s.totalGrossAmount) as totalGross, " +
           "SUM(s.totalCommission) as totalCommission, SUM(s.totalNetAmount) as totalNet " +
           "FROM WorkshopSettlement s GROUP BY s.workshop.id, s.workshop.name")
    List<Object[]> aggregateByWorkshop();
}
