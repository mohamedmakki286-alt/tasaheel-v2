package com.tasaheel.repository;

import com.tasaheel.entity.HomeServiceAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface HomeServiceAssignmentRepository extends JpaRepository<HomeServiceAssignment, Long> {
    Optional<HomeServiceAssignment> findByRequestId(Long requestId);
    List<HomeServiceAssignment> findByWorkshopIdOrderByCreatedAtDesc(Long workshopId);
    List<HomeServiceAssignment> findByWorkshopIdAndStatusOrderByCreatedAtDesc(Long workshopId, String status);
    List<HomeServiceAssignment> findByTechnicianId(Long technicianId);
    long countByWorkshopIdAndStatus(Long workshopId, String status);
}
