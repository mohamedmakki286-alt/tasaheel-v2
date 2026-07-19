package com.tasaheel.repository;

import com.tasaheel.entity.SubOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubOrderRepository extends JpaRepository<SubOrder, Long> {
    List<SubOrder> findByRequestId(Long requestId);
    List<SubOrder> findByWorkshopId(Long workshopId);
}
