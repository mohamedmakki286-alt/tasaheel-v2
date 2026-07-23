package com.tasaheel.controller;

import com.tasaheel.dto.ApiResponse;
import com.tasaheel.dto.CallParticipantDTO;
import com.tasaheel.entity.CallSession;
import com.tasaheel.entity.Customer;
import com.tasaheel.entity.MaintenanceRequest;
import com.tasaheel.entity.Technician;
import com.tasaheel.entity.Workshop;
import com.tasaheel.repository.CallSessionRepository;
import com.tasaheel.repository.MaintenanceRequestRepository;
import com.tasaheel.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
public class CallController {

    private final CallSessionRepository callSessionRepository;
    private final MaintenanceRequestRepository requestRepository;

    private static final Set<String> CALLABLE_STATUSES = Set.of(
            "accepted", "customer_approved", "inspection_report", "in_progress"
    );

    @GetMapping("/request/{requestId}/participants")
    public ResponseEntity<ApiResponse<CallParticipantDTO>> getCallParticipants(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserDetailsImpl user) {

        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("الطلب غير موجود"));

        Long userId = user.getUserId();
        String role = user.getRole();

        Customer customer = request.getCustomer();
        Technician technician = request.getTechnician();

        boolean isCustomer = "customer".equals(role)
                && customer != null && customer.getId().equals(userId);
        boolean isTechnician = "technician".equals(role)
                && technician != null && technician.getId().equals(userId);
        boolean isWorkshop = "workshop".equals(role)
                && technician != null && technician.getWorkshop() != null
                && technician.getWorkshop().getId().equals(userId);

        if (!isCustomer && !isTechnician && !isWorkshop) {
            throw new RuntimeException("غير مصرح لك بعرض بيانات هذا الطلب");
        }

        String requestStatus = request.getStatus();
        boolean canCall = CALLABLE_STATUSES.contains(requestStatus);
        String denialReason = null;

        if (!canCall) {
            denialReason = "لا يمكن إجراء مكالمة في حالة الطلب الحالية: " + requestStatus;
        }

        Workshop workshop = (technician != null) ? technician.getWorkshop() : null;

        CallParticipantDTO dto = CallParticipantDTO.builder()
                .requestId(requestId)
                .customerId(customer != null ? customer.getId() : null)
                .customerName(customer != null ? customer.getName() : null)
                .customerPhone(customer != null ? customer.getPhone() : null)
                .assignedTechnicianId(technician != null ? technician.getId() : null)
                .technicianName(technician != null ? technician.getName() : null)
                .technicianPhone(technician != null ? technician.getPhone() : null)
                .workshopId(workshop != null ? workshop.getId() : null)
                .workshopName(workshop != null ? workshop.getName() : null)
                .canCall(canCall)
                .denialReason(denialReason)
                .requestStatus(requestStatus)
                .build();

        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @GetMapping("/history")
    public ResponseEntity<List<CallSession>> getCallHistory(
            @AuthenticationPrincipal UserDetailsImpl user) {
        List<CallSession> calls = callSessionRepository.findRecentCalls(user.getUserId());
        return ResponseEntity.ok(calls);
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<List<CallSession>> getCallsForRequest(
            @PathVariable Long requestId,
            @AuthenticationPrincipal UserDetailsImpl user) {
        List<CallSession> calls = callSessionRepository.findByRequestId(requestId);
        return ResponseEntity.ok(calls);
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveCall(@AuthenticationPrincipal UserDetailsImpl user) {
        return callSessionRepository.findActiveCallForUser(user.getUserId())
                .map(session -> ResponseEntity.ok((Object) session))
                .orElse(ResponseEntity.ok().build());
    }

    @GetMapping("/ice-servers")
    public ResponseEntity<Map<String, Object>> getIceServers() {
        Map<String, Object> config = Map.of(
                "iceServers", List.of(
                        Map.of("urls", List.of("stun:stun.l.google.com:19302")),
                        Map.of("urls", List.of("stun:stun1.l.google.com:19302"))
                )
        );
        return ResponseEntity.ok(config);
    }
}
