package com.tasaheel.service;

import com.tasaheel.entity.CallSession;
import com.tasaheel.repository.CallSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CallTimeoutService {

    private final CallSessionRepository callSessionRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final int RING_TIMEOUT_SECONDS = 40;

    @Scheduled(fixedDelay = 10000)
    @Transactional
    public void checkRingTimeouts() {
        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(RING_TIMEOUT_SECONDS);
        List<CallSession> ringingCalls = callSessionRepository
                .findByStatusAndRingingAtBefore("ringing", cutoff);

        for (CallSession session : ringingCalls) {
            log.info("Call ring timeout: session={}, caller={}, callee={}",
                    session.getId(), session.getCallerId(), session.getCalleeId());

            session.setStatus("missed");
            session.setEndedAt(LocalDateTime.now());
            session.setEndReason("NO_ANSWER");
            if (session.getRingingAt() != null) {
                session.setDurationSeconds(0);
            }
            callSessionRepository.save(session);

            Map<String, Object> timeoutMsg = Map.of(
                    "type", "call_timeout",
                    "callSessionId", session.getId(),
                    "endReason", "NO_ANSWER"
            );

            sendToUser(session.getCallerId(), timeoutMsg);
            sendToUser(session.getCalleeId(), timeoutMsg);
        }

        if (!ringingCalls.isEmpty()) {
            log.info("Processed {} timed-out ringing calls", ringingCalls.size());
        }
    }

    @Scheduled(fixedDelay = 30000)
    @Transactional
    public void cleanupStaleCalls() {
        LocalDateTime staleThreshold = LocalDateTime.now().minusMinutes(30);

        List<CallSession> staleActive = callSessionRepository
                .findByStatusAndUpdatedAtBefore("ringing", staleThreshold);
        staleActive.addAll(callSessionRepository
                .findByStatusAndUpdatedAtBefore("active", staleThreshold));

        for (CallSession session : staleActive) {
            log.warn("Cleaning up stale call session: id={}, status={}, lastUpdate={}",
                    session.getId(), session.getStatus(), session.getUpdatedAt());
            session.setStatus("ended");
            session.setEndedAt(LocalDateTime.now());
            session.setEndReason("SIGNALING_DISCONNECTED");
            if (session.getConnectedAt() != null) {
                session.setDurationSeconds((int) java.time.Duration.between(
                        session.getConnectedAt(), LocalDateTime.now()).getSeconds());
            }
            callSessionRepository.save(session);
        }
    }

    private void sendToUser(Long userId, Object payload) {
        messagingTemplate.convertAndSend("/user/" + userId + "/queue/calls", payload);
    }
}
