package com.tasaheel.controller;

import com.tasaheel.dto.AIChatRequest;
import com.tasaheel.dto.AIChatResponse;
import com.tasaheel.dto.ApiResponse;
import com.tasaheel.integration.GeminiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AIAssistantController {

    private final GeminiService geminiService;

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<AIChatResponse>> chat(
            @Valid @RequestBody AIChatRequest request) {
        String reply = geminiService.chat(request.getMessage(), request.getHistory());
        return ResponseEntity.ok(ApiResponse.success(
                AIChatResponse.builder()
                        .reply(reply)
                        .build()));
    }
}
