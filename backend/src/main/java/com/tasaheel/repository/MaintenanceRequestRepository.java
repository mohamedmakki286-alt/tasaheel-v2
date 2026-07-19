package com.tasaheel.repository;

import com.tasaheel.entity.MaintenanceRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequest, Long> {
    List<MaintenanceRequest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<MaintenanceRequest> findByCityAndStatus(String city, String status);
    Page<MaintenanceRequest> findByStatus(String status, Pageable pageable);
    List<MaintenanceRequest> findByCityAndStatusIn(String city, List<String> statuses);
    Page<MaintenanceRequest> findByCustomerId(Long customerId, Pageable pageable);
    long countByStatus(String status);
    List<MaintenanceRequest> findTop10ByOrderByCreatedAtDesc();
    @Query("SELECT CAST(r.createdAt AS date) as day, COUNT(r) FROM MaintenanceRequest r WHERE r.createdAt >= ?1 GROUP BY CAST(r.createdAt AS date) ORDER BY day")
    List<Object[]> countRequestsPerDaySince(LocalDateTime since);
    @Query("SELECT q.workshop.id, w.name, COUNT(DISTINCT q.request.id) FROM Quote q JOIN Workshop w ON q.workshop.id = w.id GROUP BY q.workshop.id, w.name ORDER BY COUNT(DISTINCT q.request.id) DESC")
    List<Object[]> countRequestsByWorkshop();
    @Query("SELECT COUNT(r) FROM MaintenanceRequest r JOIN Quote q ON q.request.id = r.id WHERE r.status = ?1 AND q.workshop.id = ?2")
    long countByStatusAndWorkshopId(String status, Long workshopId);
    List<MaintenanceRequest> findByCustomerIdAndStatusOrderByCreatedAtDesc(Long customerId, String status);
    List<MaintenanceRequest> findByCarIdOrderByCreatedAtDesc(Long carId);
    List<MaintenanceRequest> findByPreferredWorkshopIdAndStatus(Long preferredWorkshopId, String status);
    List<MaintenanceRequest> findByPreferredWorkshopIdAndStatusIn(Long preferredWorkshopId, List<String> statuses);

    @Query("SELECT DISTINCT mr FROM MaintenanceRequest mr " +
           "LEFT JOIN FETCH mr.customer " +
           "LEFT JOIN FETCH mr.car " +
           "LEFT JOIN FETCH mr.serviceTypes " +
           "WHERE mr.id IN :ids")
    List<MaintenanceRequest> findByIdsWithDetails(@Param("ids") List<Long> ids);

    @Query("SELECT DISTINCT mr FROM MaintenanceRequest mr " +
           "LEFT JOIN FETCH mr.customer " +
           "LEFT JOIN FETCH mr.car " +
           "LEFT JOIN FETCH mr.serviceTypes " +
           "WHERE mr.id = :id")
    Optional<MaintenanceRequest> findByIdWithDetails(@Param("id") Long id);

    @Query("SELECT r.status, COUNT(r) FROM MaintenanceRequest r GROUP BY r.status")
    List<Object[]> countByStatusGrouped();
}
