package com.tasaheel.repository;

import com.tasaheel.entity.CallSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CallSessionRepository extends JpaRepository<CallSession, Long> {

    Optional<CallSession> findByStatusAndCallerIdOrCalleeId(String status, Long id1, Long id2);

    @Query("SELECT c FROM CallSession c WHERE c.status = 'active' AND (c.callerId = :userId OR c.calleeId = :userId)")
    Optional<CallSession> findActiveCallForUser(@Param("userId") Long userId);

    @Query("SELECT c FROM CallSession c WHERE (c.callerId = :userId OR c.calleeId = :userId) ORDER BY c.createdAt DESC")
    List<CallSession> findRecentCalls(@Param("userId") Long userId);

    @Query("SELECT c FROM CallSession c WHERE c.requestId = :requestId ORDER BY c.createdAt DESC")
    List<CallSession> findByRequestId(@Param("requestId") Long requestId);

    @Query("SELECT c FROM CallSession c WHERE c.status = 'ringing' AND c.calleeId = :calleeId")
    List<CallSession> findIncomingCallsForUser(@Param("calleeId") Long calleeId);
}
