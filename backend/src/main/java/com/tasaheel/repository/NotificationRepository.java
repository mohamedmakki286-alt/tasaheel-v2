package com.tasaheel.repository;

import com.tasaheel.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdAndUserRoleOrderByCreatedAtDesc(Long userId, String userRole, Pageable pageable);

    long countByUserIdAndUserRoleAndIsReadFalse(Long userId, String userRole);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.id = :id AND n.userId = :userId")
    int markAsRead(Long id, Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId AND n.userRole = :userRole AND n.isRead = false")
    int markAllAsRead(Long userId, String userRole);
}
