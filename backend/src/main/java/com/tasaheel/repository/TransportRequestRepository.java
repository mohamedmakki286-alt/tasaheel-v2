package com.tasaheel.repository;

import com.tasaheel.entity.TransportRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransportRequestRepository extends JpaRepository<TransportRequest, Long> {
    List<TransportRequest> findByDriverIdAndStatusOrderByCreatedAtDesc(Long driverId, String status);
    List<TransportRequest> findByStatusOrderByCreatedAtDesc(String status);
    List<TransportRequest> findByDriverIdOrderByCreatedAtDesc(Long driverId);
    List<TransportRequest> findByRequestId(Long requestId);
}
