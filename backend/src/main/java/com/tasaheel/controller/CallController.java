package com.tasaheel.controller;

import com.tasaheel.entity.CallSession;
import com.tasaheel.repository.CallSessionRepository;
import com.tasaheel.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
public class CallController {

    private final CallSessionRepository callSessionRepository;

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
