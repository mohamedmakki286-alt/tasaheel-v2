package com.tasaheel.repository;

import com.tasaheel.entity.InspectionPartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InspectionPartItemRepository extends JpaRepository<InspectionPartItem, Long> {
    List<InspectionPartItem> findByReportId(Long reportId);
    void deleteByReportId(Long reportId);
}
