package com.tasaheel.controller;

import com.tasaheel.dto.*;
import com.tasaheel.integration.GeminiService;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.AIAssistantContextService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIAssistantController {
    private final GeminiService geminiService;
    private final AIAssistantContextService contextService;
    private final ConcurrentHashMap<String, RateWindow> rateWindows = new ConcurrentHashMap<>();

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AIChatResponse>> chat(
            @Valid @RequestBody AIChatRequest request,
            @AuthenticationPrincipal UserDetailsImpl user,
            HttpServletRequest httpRequest) {
        enforceRateLimit(clientKey(user, httpRequest));
        String reply = geminiService.chat(
                request.getMessage().trim(),
                request.getHistory(),
                contextService.buildContext(user));
        return ResponseEntity.ok(ApiResponse.success(AIChatResponse.builder().reply(reply).build()));
    }

    private String clientKey(UserDetailsImpl user, HttpServletRequest request) {
        if (user != null) return "user:" + user.getRole() + ":" + user.getUserId();
        String forwarded = request.getHeader("X-Forwarded-For");
        String ip = forwarded == null || forwarded.isBlank()
                ? request.getRemoteAddr() : forwarded.split(",")[0].trim();
        return "ip:" + ip;
    }

    private void enforceRateLimit(String key) {
        long minute = System.currentTimeMillis() / 60_000;
        RateWindow window = rateWindows.compute(key, (ignored, current) -> {
            if (current == null || current.minute() != minute) {
                return new RateWindow(minute, new AtomicInteger(1));
            }
            current.count().incrementAndGet();
            return current;
        });
        if (window.count().get() > 20) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "تم تجاوز عدد الأسئلة المسموح مؤقتاً. حاول بعد دقيقة.");
        }
        if (rateWindows.size() > 10_000) {
            rateWindows.entrySet().removeIf(entry -> entry.getValue().minute() < minute - 2);
        }
    }

    private record RateWindow(long minute, AtomicInteger count) {}
}
