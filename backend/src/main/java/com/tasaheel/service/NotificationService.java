package com.tasaheel.service;

import com.tasaheel.dto.NotificationDTO;
import com.tasaheel.entity.Notification;
import com.tasaheel.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public Notification save(Long userId, String userRole, String type, String title, String body,
                             Long requestId, String eventType) {
        Notification notification = Notification.builder()
                .userId(userId)
                .userRole(userRole)
                .type(type)
                .title(title)
                .body(body)
                .requestId(requestId)
                .eventType(eventType)
                .isRead(false)
                .build();
        return notificationRepository.save(notification);
    }

    public Page<NotificationDTO> getByUser(Long userId, String userRole, int page, int size) {
        return notificationRepository
                .findByUserIdAndUserRoleOrderByCreatedAtDesc(userId, userRole, PageRequest.of(page, size))
                .map(this::toDTO);
    }

    public long getUnreadCount(Long userId, String userRole) {
        return notificationRepository.countByUserIdAndUserRoleAndIsReadFalse(userId, userRole);
    }

    @Transactional
    public boolean markAsRead(Long id, Long userId) {
        return notificationRepository.markAsRead(id, userId) > 0;
    }

    @Transactional
    public int markAllAsRead(Long userId, String userRole) {
        return notificationRepository.markAllAsRead(userId, userRole);
    }

    private NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .userRole(n.getUserRole())
                .type(n.getType())
                .title(n.getTitle())
                .body(n.getBody())
                .requestId(n.getRequestId())
                .eventType(n.getEventType())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
