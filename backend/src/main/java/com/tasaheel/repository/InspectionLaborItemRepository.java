package com.tasaheel.repository;

import com.tasaheel.entity.InspectionLaborItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InspectionLaborItemRepository extends JpaRepository<InspectionLaborItem, Long> {
    List<InspectionLaborItem> findByReportId(Long reportId);
    void deleteByReportId(Long reportId);
}
