package com.tasaheel.repository;

import com.tasaheel.entity.WorkshopService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkshopServiceRepository extends JpaRepository<WorkshopService, Long> {
    List<WorkshopService> findByWorkshopId(Long workshopId);
    List<WorkshopService> findByServiceTypeId(Long serviceTypeId);
    Optional<WorkshopService> findByWorkshopIdAndServiceTypeId(Long workshopId, Long serviceTypeId);
    void deleteByWorkshopIdAndServiceTypeId(Long workshopId, Long serviceTypeId);
}
