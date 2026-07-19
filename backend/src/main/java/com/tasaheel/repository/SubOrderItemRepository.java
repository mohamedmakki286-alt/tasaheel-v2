package com.tasaheel.repository;

import com.tasaheel.entity.SubOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubOrderItemRepository extends JpaRepository<SubOrderItem, Long> {
    List<SubOrderItem> findBySubOrderId(Long subOrderId);
}
