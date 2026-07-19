package com.tasaheel.repository;

import com.tasaheel.entity.InspectionReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface InspectionReportRepository extends JpaRepository<InspectionReport, Long> {
    Optional<InspectionReport> findByRequestId(Long requestId);
    Optional<InspectionReport> findTopByRequestIdOrderByCreatedAtDesc(Long requestId);
}
