package com.tasaheel.repository;

import com.tasaheel.entity.ServiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ServiceItemRepository extends JpaRepository<ServiceItem, Long> {
    List<ServiceItem> findByRequestId(Long requestId);
    List<ServiceItem> findByRequestIdAndWorkshopId(Long requestId, Long workshopId);
    List<ServiceItem> findByWorkshopId(Long workshopId);
    long countByRequestIdAndStatus(Long requestId, String status);
}
