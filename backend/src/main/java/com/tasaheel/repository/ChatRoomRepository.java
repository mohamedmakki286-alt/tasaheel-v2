package com.tasaheel.repository;

import com.tasaheel.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findByRequestIdAndCustomerIdAndWorkshopId(Long requestId, Long customerId, Long workshopId);
    Optional<ChatRoom> findByRequestIdAndCustomerIdAndDriverId(Long requestId, Long customerId, Long driverId);
    Optional<ChatRoom> findByRequestId(Long requestId);
    @EntityGraph(attributePaths = {"request", "customer", "workshop", "driver", "technician"})
    List<ChatRoom> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    @EntityGraph(attributePaths = {"request", "customer", "workshop", "driver", "technician"})
    List<ChatRoom> findByWorkshopIdOrderByCreatedAtDesc(Long workshopId);
    @EntityGraph(attributePaths = {"request", "customer", "workshop", "driver", "technician"})
    List<ChatRoom> findByTechnicianIdOrderByCreatedAtDesc(Long technicianId);
    @EntityGraph(attributePaths = {"request", "customer", "workshop", "driver", "technician"})
    List<ChatRoom> findByDriverIdOrderByCreatedAtDesc(Long driverId);
}
