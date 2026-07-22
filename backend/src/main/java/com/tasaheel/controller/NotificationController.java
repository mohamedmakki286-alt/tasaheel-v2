package com.tasaheel.controller;

import com.tasaheel.dto.ApiResponse;
import com.tasaheel.dto.NotificationDTO;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'WORKSHOP', 'DRIVER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Page<NotificationDTO>>> getNotifications(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<NotificationDTO> notifications = notificationService.getByUser(
                user.getUserId(), user.getRole(), page, size);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'WORKSHOP', 'DRIVER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(
            @AuthenticationPrincipal UserDetailsImpl user) {
        long count = notificationService.getUnreadCount(user.getUserId(), user.getRole());
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", count)));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'WORKSHOP', 'DRIVER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        boolean updated = notificationService.markAsRead(id, user.getUserId());
        if (updated) {
            return ResponseEntity.ok(ApiResponse.success(null));
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/read-all")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'WORKSHOP', 'DRIVER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> markAllAsRead(
            @AuthenticationPrincipal UserDetailsImpl user) {
        int count = notificationService.markAllAsRead(user.getUserId(), user.getRole());
        return ResponseEntity.ok(ApiResponse.success(Map.of("updated", count)));
    }
}
