package com.tasaheel.controller;

import com.tasaheel.config.StompUserHolder;
import com.tasaheel.entity.CallSession;
import com.tasaheel.entity.MaintenanceRequest;
import com.tasaheel.repository.CallSessionRepository;
import com.tasaheel.repository.CustomerRepository;
import com.tasaheel.repository.MaintenanceRequestRepository;
import com.tasaheel.repository.TechnicianRepository;
import com.tasaheel.repository.WorkshopRepository;
import com.tasaheel.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Map;

@Controller
@RequiredArgsConstructor
@Slf4j
public class CallSignalingController {

    private final SimpMessagingTemplate messagingTemplate;
    private final CallSessionRepository callSessionRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final CustomerRepository customerRepository;
    private final TechnicianRepository technicianRepository;
    private final WorkshopRepository workshopRepository;

    @MessageMapping("/call/offer")
    public void handleOffer(Map<String, Object> payload) {
        UserDetailsImpl principal = extractPrincipal();
        if (principal == null) return;

        Long callerId = principal.getUserId();
        String callerRole = principal.getRole();
        Long calleeId = toLong(payload.get("calleeId"));
        Long requestId = toLong(payload.get("requestId"));
        String sdp = (String) payload.get("sdp");
        String callerName = (String) payload.getOrDefault("callerName", "");

        if (calleeId == null || sdp == null) {
            log.warn("Invalid call offer payload from userId={}", callerId);
            return;
        }

        if (callerId.equals(calleeId)) {
            log.warn("SECURITY: User {} attempted to call themselves", callerId);
            sendError(callerId, "CALL_SELF_NOT_ALLOWED");
            return;
        }

        if (callSessionRepository.hasActiveCallForUser(callerId)) {
            log.warn("User {} already has an active call", callerId);
            sendError(callerId, "CALL_BUSY");
            return;
        }

        if (requestId != null) {
            String calleeRole = resolveCalleeRole(callerRole, requestId, callerId, calleeId);
            if (calleeRole == null) {
                log.warn("SECURITY: User {} not authorized to call regarding request {}", callerId, requestId);
                sendError(callerId, "CALL_PERMISSION_DENIED");
                return;
            }

            String callerNameSnapshot = callerName;
            String calleeNameSnapshot = resolveUserName(calleeId, calleeRole);

            CallSession session = CallSession.builder()
                    .callerId(callerId)
                    .callerRole(callerRole)
                    .callerNameSnapshot(callerNameSnapshot)
                    .calleeId(calleeId)
                    .calleeRole(calleeRole)
                    .calleeNameSnapshot(calleeNameSnapshot)
                    .requestId(requestId)
                    .status("ringing")
                    .initiatedAt(LocalDateTime.now())
                    .ringingAt(LocalDateTime.now())
                    .build();
            session = callSessionRepository.save(session);

            Map<String, Object> offer = Map.of(
                    "type", "call_offer",
                    "callSessionId", session.getId(),
                    "callerId", callerId,
                    "callerName", callerNameSnapshot,
                    "callerRole", callerRole,
                    "calleeId", calleeId,
                    "calleeRole", calleeRole,
                    "requestId", requestId,
                    "sdp", sdp,
                    "timestamp", System.currentTimeMillis()
            );

            sendToUser(calleeId, offer);
            log.info("Call offer: caller={} ({}) → callee={} ({}) session={}",
                    callerId, callerRole, calleeId, calleeRole, session.getId());
        } else {
            log.warn("Call offer without requestId from userId={}", callerId);
            sendError(callerId, "CALL_REQUEST_REQUIRED");
        }
    }

    @MessageMapping("/call/answer")
    public void handleAnswer(Map<String, Object> payload) {
        UserDetailsImpl principal = extractPrincipal();
        if (principal == null) return;

        Long calleeId = principal.getUserId();
        Long callSessionId = toLong(payload.get("callSessionId"));
        String sdp = (String) payload.get("sdp");

        if (callSessionId == null || sdp == null) return;

        callSessionRepository.findById(callSessionId).ifPresent(session -> {
            if (!session.getCalleeId().equals(calleeId)) {
                log.warn("SECURITY: User {} attempted to answer call not addressed to them (session={})",
                        calleeId, callSessionId);
                return;
            }

            if (!"ringing".equals(session.getStatus())) {
                log.warn("Call answer rejected: session={} status={}", callSessionId, session.getStatus());
                return;
            }

            session.setStatus("active");
            session.setConnectedAt(LocalDateTime.now());
            session.setStartedAt(LocalDateTime.now());
            callSessionRepository.save(session);

            Map<String, Object> answer = Map.of(
                    "type", "call_answer",
                    "callSessionId", callSessionId,
                    "calleeId", calleeId,
                    "sdp", sdp
            );

            sendToUser(session.getCallerId(), answer);
            log.info("Call answered: session={}, callee={}", callSessionId, calleeId);
        });
    }

    @MessageMapping("/call/reject")
    public void handleReject(Map<String, Object> payload) {
        UserDetailsImpl principal = extractPrincipal();
        if (principal == null) return;

        Long userId = principal.getUserId();
        Long callSessionId = toLong(payload.get("callSessionId"));

        if (callSessionId == null) return;

        callSessionRepository.findById(callSessionId).ifPresent(session -> {
            if (!session.getCalleeId().equals(userId)) {
                log.warn("SECURITY: User {} attempted to reject call not addressed to them (session={})",
                        userId, callSessionId);
                return;
            }

            if (!"ringing".equals(session.getStatus())) {
                log.warn("Call reject rejected: session={} status={}", callSessionId, session.getStatus());
                return;
            }

            session.setStatus("rejected");
            session.setEndedAt(LocalDateTime.now());
            session.setEndedByUserId(userId);
            session.setEndReason("CALLEE_REJECTED");
            callSessionRepository.save(session);

            Map<String, Object> reject = Map.of(
                    "type", "call_rejected",
                    "callSessionId", callSessionId
            );

            sendToUser(session.getCallerId(), reject);
            log.info("Call rejected: session={}, by={}", callSessionId, userId);
        });
    }

    @MessageMapping("/call/hangup")
    public void handleHangup(Map<String, Object> payload) {
        UserDetailsImpl principal = extractPrincipal();
        if (principal == null) return;

        Long userId = principal.getUserId();
        Long callSessionId = toLong(payload.get("callSessionId"));

        if (callSessionId == null) return;

        callSessionRepository.findById(callSessionId).ifPresent(session -> {
            boolean isCaller = session.getCallerId().equals(userId);
            boolean isCallee = session.getCalleeId().equals(userId);

            if (!isCaller && !isCallee) {
                log.warn("SECURITY: User {} attempted to hangup call they are not part of (session={})",
                        userId, callSessionId);
                return;
            }

            if ("ended".equals(session.getStatus()) || "rejected".equals(session.getStatus())
                    || "cancelled".equals(session.getStatus())) {
                return;
            }

            session.setStatus("ended");
            session.setEndedAt(LocalDateTime.now());
            session.setEndedByUserId(userId);
            session.setEndReason("COMPLETED");

            if (session.getConnectedAt() != null) {
                session.setDurationSeconds((int) java.time.Duration.between(
                        session.getConnectedAt(), session.getEndedAt()).getSeconds());
            }

            callSessionRepository.save(session);

            Long peerId = isCaller ? session.getCalleeId() : session.getCallerId();
            Map<String, Object> hangup = Map.of(
                    "type", "call_ended",
                    "callSessionId", callSessionId,
                    "duration", session.getDurationSeconds() != null ? session.getDurationSeconds() : 0,
                    "endReason", "COMPLETED"
            );

            sendToUser(peerId, hangup);
            log.info("Call ended: session={}, by={}, duration={}s",
                    callSessionId, userId, session.getDurationSeconds());
        });
    }

    @MessageMapping("/call/candidate")
    public void handleCandidate(Map<String, Object> payload) {
        UserDetailsImpl principal = extractPrincipal();
        if (principal == null) return;

        Long userId = principal.getUserId();
        Long callSessionId = toLong(payload.get("callSessionId"));
        String candidate = (String) payload.get("candidate");

        if (callSessionId == null || candidate == null) return;

        callSessionRepository.findById(callSessionId).ifPresent(session -> {
            boolean isCaller = session.getCallerId().equals(userId);
            boolean isCallee = session.getCalleeId().equals(userId);

            if (!isCaller && !isCallee) {
                log.warn("SECURITY: User {} attempted to send ICE candidate for call they are not part of (session={})",
                        userId, callSessionId);
                return;
            }

            Long targetId = isCaller ? session.getCalleeId() : session.getCallerId();

            Map<String, Object> ice = Map.of(
                    "type", "call_candidate",
                    "callSessionId", callSessionId,
                    "userId", userId,
                    "candidate", candidate
            );

            sendToUser(targetId, ice);
        });
    }

    @MessageMapping("/call/cancel")
    public void handleCancel(Map<String, Object> payload) {
        UserDetailsImpl principal = extractPrincipal();
        if (principal == null) return;

        Long userId = principal.getUserId();
        Long callSessionId = toLong(payload.get("callSessionId"));

        if (callSessionId == null) return;

        callSessionRepository.findById(callSessionId).ifPresent(session -> {
            if (!session.getCallerId().equals(userId)) {
                log.warn("SECURITY: User {} attempted to cancel call they did not initiate (session={})",
                        userId, callSessionId);
                return;
            }

            if (!"ringing".equals(session.getStatus())) {
                log.warn("Call cancel rejected: session={} status={}", callSessionId, session.getStatus());
                return;
            }

            session.setStatus("cancelled");
            session.setEndedAt(LocalDateTime.now());
            session.setEndedByUserId(userId);
            session.setEndReason("CALLER_CANCELLED");
            callSessionRepository.save(session);

            Map<String, Object> cancel = Map.of(
                    "type", "call_cancelled",
                    "callSessionId", callSessionId
            );

            sendToUser(session.getCalleeId(), cancel);
            log.info("Call cancelled: session={}, by={}", callSessionId, userId);
        });
    }

    private UserDetailsImpl extractPrincipal() {
        Long userId = StompUserHolder.getUserId();
        String role = StompUserHolder.getRole();
        if (userId != null && role != null) {
            return new UserDetailsImpl(userId, role);
        }
        log.warn("No authenticated principal in STOMP context");
        return null;
    }

    private String resolveCalleeRole(String callerRole, Long requestId, Long callerId, Long calleeId) {
        MaintenanceRequest request = requestRepository.findById(requestId).orElse(null);
        if (request == null) return null;

        boolean isCustomer = request.getCustomer().getId().equals(callerId);
        boolean isAssignedTechnician = request.getTechnician() != null
                && request.getTechnician().getId().equals(callerId);

        if ("customer".equals(callerRole)) {
            if (!isCustomer) return null;
            if (request.getTechnician() != null && request.getTechnician().getId().equals(calleeId)) {
                return "technician";
            }
            return null;
        } else if ("technician".equals(callerRole)) {
            if (!isAssignedTechnician) return null;
            if (request.getCustomer().getId().equals(calleeId)) {
                return "customer";
            }
            return null;
        } else if ("workshop".equals(callerRole)) {
            if (request.getTechnician() != null && request.getTechnician().getId().equals(calleeId)) {
                if (request.getTechnician().getWorkshop() != null
                        && request.getTechnician().getWorkshop().getId().equals(callerId)) {
                    return "technician";
                }
            }
            if (request.getCustomer().getId().equals(calleeId)) {
                return "customer";
            }
            return null;
        }

        return null;
    }

    private String resolveUserName(Long userId, String role) {
        try {
            if ("customer".equals(role)) {
                return customerRepository.findById(userId).map(c -> c.getName()).orElse("عميل");
            } else if ("technician".equals(role)) {
                return technicianRepository.findById(userId).map(t -> t.getName()).orElse("فني");
            } else if ("workshop".equals(role)) {
                return workshopRepository.findById(userId).map(w -> w.getName()).orElse("ورشة");
            }
        } catch (Exception e) {
            log.warn("Failed to resolve user name for userId={} role={}", userId, role);
        }
        return "مستخدم";
    }

    private void sendToUser(Long userId, Object payload) {
        messagingTemplate.convertAndSend("/user/" + userId + "/queue/calls", payload);
    }

    private void sendError(Long userId, String errorCode) {
        sendToUser(userId, Map.of("type", "call_error", "error", errorCode));
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).longValue();
        try {
            return Long.parseLong(value.toString());
        } catch (Exception e) {
            return null;
        }
    }
}
