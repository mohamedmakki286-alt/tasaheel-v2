package com.tasaheel.repository;

import com.tasaheel.entity.TestDataResetAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TestDataResetAuditLogRepository extends JpaRepository<TestDataResetAuditLog, Long> {

    List<TestDataResetAuditLog> findAllByOrderByCreatedAtDesc();
}
