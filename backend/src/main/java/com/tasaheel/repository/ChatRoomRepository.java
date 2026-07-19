package com.tasaheel.repository;

import com.tasaheel.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByRequestIdAndCustomerIdAndWorkshopId(Long requestId, Long customerId, Long workshopId);
    Optional<ChatRoom> findByRequestIdAndCustomerIdAndDriverId(Long requestId, Long customerId, Long driverId);
    Optional<ChatRoom> findByRequestId(Long requestId);
}
