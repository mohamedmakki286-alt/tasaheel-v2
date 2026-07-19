package com.tasaheel.controller;

import com.tasaheel.entity.CallSession;
import com.tasaheel.repository.CallSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
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

    @MessageMapping("/call/offer")
    public void handleOffer(Map<String, Object> payload) {
        Long callerId = toLong(payload.get("callerId"));
        Long calleeId = toLong(payload.get("calleeId"));
        String callerRole = (String) payload.getOrDefault("callerRole", "customer");
        Long requestId = toLong(payload.get("requestId"));
        String callerName = (String) payload.getOrDefault("callerName", "");
        String sdp = (String) payload.get("sdp");

        if (callerId == null || calleeId == null || sdp == null) {
            log.warn("Invalid call offer payload");
            return;
        }

        CallSession session = CallSession.builder()
                .callerId(callerId)
                .callerRole(callerRole)
                .calleeId(calleeId)
                .calleeRole("workshop".equals(callerRole) ? "customer" : "workshop")
                .requestId(requestId)
                .status("ringing")
                .build();
        session = callSessionRepository.save(session);

        Map<String, Object> offer = Map.of(
                "type", "call_offer",
                "callSessionId", session.getId(),
                "callerId", callerId,
                "callerName", callerName,
                "callerRole", callerRole,
                "calleeId", calleeId,
                "requestId", requestId != null ? requestId : 0,
                "sdp", sdp,
                "timestamp", System.currentTimeMillis()
        );

        messagingTemplate.convertAndSend("/topic/call/" + calleeId, offer);
        log.info("Call offer sent: caller={} → callee={}", callerId, calleeId);
    }

    @MessageMapping("/call/answer")
    public void handleAnswer(Map<String, Object> payload) {
        Long callSessionId = toLong(payload.get("callSessionId"));
        Long calleeId = toLong(payload.get("calleeId"));
        String sdp = (String) payload.get("sdp");

        if (callSessionId == null || sdp == null) return;

        callSessionRepository.findById(callSessionId).ifPresent(session -> {
            session.setStatus("active");
            session.setStartedAt(LocalDateTime.now());
            callSessionRepository.save(session);

            Map<String, Object> answer = Map.of(
                    "type", "call_answer",
                    "callSessionId", callSessionId,
                    "calleeId", calleeId != null ? calleeId : 0,
                    "sdp", sdp
            );

            messagingTemplate.convertAndSend("/topic/call/" + session.getCallerId(), answer);
            log.info("Call answer sent: session={}", callSessionId);
        });
    }

    @MessageMapping("/call/reject")
    public void handleReject(Map<String, Object> payload) {
        Long callSessionId = toLong(payload.get("callSessionId"));
        Long calleeId = toLong(payload.get("calleeId"));

        if (callSessionId == null) return;

        callSessionRepository.findById(callSessionId).ifPresent(session -> {
            session.setStatus("rejected");
            session.setEndedAt(LocalDateTime.now());
            callSessionRepository.save(session);

            Map<String, Object> reject = Map.of(
                    "type", "call_rejected",
                    "callSessionId", callSessionId,
                    "calleeId", calleeId != null ? calleeId : 0
            );

            messagingTemplate.convertAndSend("/topic/call/" + session.getCallerId(), reject);
            log.info("Call rejected: session={}", callSessionId);
        });
    }

    @MessageMapping("/call/hangup")
    public void handleHangup(Map<String, Object> payload) {
        Long callSessionId = toLong(payload.get("callSessionId"));
        Long userId = toLong(payload.get("userId"));

        if (callSessionId == null) return;

        callSessionRepository.findById(callSessionId).ifPresent(session -> {
            session.setStatus("ended");
            session.setEndedAt(LocalDateTime.now());
            if (session.getStartedAt() != null) {
                session.setDurationSeconds((int) java.time.Duration.between(session.getStartedAt(), session.getEndedAt()).getSeconds());
            }
            callSessionRepository.save(session);

            Long peerId = userId != null && userId.equals(session.getCallerId()) ? session.getCalleeId() : session.getCallerId();
            Map<String, Object> hangup = Map.of(
                    "type", "call_ended",
                    "callSessionId", callSessionId,
                    "duration", session.getDurationSeconds() != null ? session.getDurationSeconds() : 0
            );

            messagingTemplate.convertAndSend("/topic/call/" + peerId, hangup);
            log.info("Call ended: session={}, duration={}s", callSessionId, session.getDurationSeconds());
        });
    }

    @MessageMapping("/call/candidate")
    public void handleCandidate(Map<String, Object> payload) {
        Long targetId = toLong(payload.get("targetId"));
        String candidate = (String) payload.get("candidate");
        Long userId = toLong(payload.get("userId"));

        if (targetId == null || candidate == null) return;

        Map<String, Object> ice = Map.of(
                "type", "call_candidate",
                "userId", userId != null ? userId : 0,
                "candidate", candidate
        );

        messagingTemplate.convertAndSend("/topic/call/" + targetId, ice);
    }

    @MessageMapping("/call/cancel")
    public void handleCancel(Map<String, Object> payload) {
        Long callSessionId = toLong(payload.get("callSessionId"));
        Long callerId = toLong(payload.get("callerId"));

        if (callSessionId == null) return;

        callSessionRepository.findById(callSessionId).ifPresent(session -> {
            session.setStatus("cancelled");
            session.setEndedAt(LocalDateTime.now());
            callSessionRepository.save(session);

            Map<String, Object> cancel = Map.of(
                    "type", "call_cancelled",
                    "callSessionId", callSessionId
            );

            messagingTemplate.convertAndSend("/topic/call/" + session.getCalleeId(), cancel);
            log.info("Call cancelled: session={}", callSessionId);
        });
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
