package com.tasaheel.repository;

import com.tasaheel.entity.InspectionChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InspectionChecklistItemRepository extends JpaRepository<InspectionChecklistItem, Long> {
    List<InspectionChecklistItem> findByReportIdOrderBySortOrderAsc(Long reportId);
}
