package com.tasaheel.repository;

import com.tasaheel.entity.ServiceAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceAuditLogRepository extends JpaRepository<ServiceAuditLog, Long> {
    List<ServiceAuditLog> findByServiceIdOrderByPerformedAtDesc(Long serviceId);
    List<ServiceAuditLog> findByWorkshopIdOrderByPerformedAtDesc(Long workshopId);

    @Query("SELECT a FROM ServiceAuditLog a WHERE a.workshopId = :workshopId ORDER BY a.performedAt DESC")
    Page<ServiceAuditLog> findByWorkshopIdPaged(@Param("workshopId") Long workshopId, Pageable pageable);

    @Query("SELECT a FROM ServiceAuditLog a ORDER BY a.performedAt DESC")
    Page<ServiceAuditLog> findAllPaged(Pageable pageable);

    @Query("SELECT a FROM ServiceAuditLog a WHERE a.action = :action ORDER BY a.performedAt DESC")
    Page<ServiceAuditLog> findByAction(@Param("action") String action, Pageable pageable);
}
