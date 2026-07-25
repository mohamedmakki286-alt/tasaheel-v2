package com.tasaheel.repository;

import com.tasaheel.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByRequestIdAndCustomerIdAndWorkshopId(Long requestId, Long customerId, Long workshopId);
    Optional<ChatRoom> findByRequestIdAndCustomerIdAndDriverId(Long requestId, Long customerId, Long driverId);
    Optional<ChatRoom> findByRequestId(Long requestId);
    List<ChatRoom> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<ChatRoom> findByWorkshopIdOrderByCreatedAtDesc(Long workshopId);
    List<ChatRoom> findByTechnicianIdOrderByCreatedAtDesc(Long technicianId);
    List<ChatRoom> findByDriverIdOrderByCreatedAtDesc(Long driverId);
}
