package com.tasaheel.repository;

import com.tasaheel.entity.RequestWorkshopDispatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface RequestWorkshopDispatchRepository extends JpaRepository<RequestWorkshopDispatch, Long> {
    Optional<RequestWorkshopDispatch> findByRequestIdAndWorkshopId(Long requestId, Long workshopId);
    boolean existsByRequestIdAndWorkshopId(Long requestId, Long workshopId);
    List<RequestWorkshopDispatch> findByWorkshopIdAndStatusInAndExpiresAtAfterOrderBySentAtDesc(
            Long workshopId, Collection<String> statuses, LocalDateTime now);
    List<RequestWorkshopDispatch> findByRequestId(Long requestId);
}
