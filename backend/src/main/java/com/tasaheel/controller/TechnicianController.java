package com.tasaheel.controller;

import com.tasaheel.dto.*;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.TechnicianService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/technician")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TechnicianController {

    private final TechnicianService technicianService;

    @GetMapping("/profile")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<ApiResponse<TechnicianDTO>> getProfile(@AuthenticationPrincipal UserDetailsImpl user) {
        TechnicianDTO profile = technicianService.getTechnicianProfile(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<ApiResponse<TechnicianDTO>> updateProfile(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, Object> body) {
        TechnicianDTO profile = technicianService.updateTechnicianProfile(user.getUserId(), body);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", profile));
    }

    @PutMapping("/availability")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<ApiResponse<TechnicianDTO>> updateAvailability(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        TechnicianDTO profile = technicianService.updateAvailability(user.getUserId(), status);
        return ResponseEntity.ok(ApiResponse.success("Availability updated", profile));
    }

    @GetMapping("/requests")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<ApiResponse<List<MaintenanceRequestDTO>>> getMyRequests(
            @AuthenticationPrincipal UserDetailsImpl user) {
        List<MaintenanceRequestDTO> requests = technicianService.getTechnicianAssignedRequests(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @PutMapping("/requests/{requestId}/status")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<ApiResponse<MaintenanceRequestDTO>> updateRequestStatus(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long requestId,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        MaintenanceRequestDTO request = technicianService.updateTechnicianRequestStatus(
                requestId, user.getUserId(), status);
        return ResponseEntity.ok(ApiResponse.success("Status updated", request));
    }

    @PatchMapping("/me/email")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<ApiResponse<Object>> changeEmail(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, String> body) {
        String newEmail = body.get("newEmail");
        String currentPassword = body.get("currentPassword");
        technicianService.changeEmail(user.getUserId(), newEmail, currentPassword);
        return ResponseEntity.ok(ApiResponse.success("Email changed successfully"));
    }

    @PostMapping("/me/change-password")
    @PreAuthorize("hasRole('TECHNICIAN')")
    public ResponseEntity<ApiResponse<Object>> changePassword(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, String> body) {
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        technicianService.changePassword(user.getUserId(), currentPassword, newPassword);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }
}
