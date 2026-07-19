package com.tasaheel.controller;

import com.tasaheel.dto.ApiResponse;
import com.tasaheel.dto.SmartRouterRequest;
import com.tasaheel.dto.SmartRouterResponse;
import com.tasaheel.service.SmartRouterService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;

@RestController
@RequestMapping("/api/router")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SmartRouterController {

    private final SmartRouterService smartRouterService;
    private final MessageSource msg;

    @PostMapping("/suggest")
    public ResponseEntity<ApiResponse<SmartRouterResponse>> suggestRoute(
            @RequestBody SmartRouterRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        SmartRouterResponse response = smartRouterService.route(request);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("smartrouter.analyzed", null, locale), response));
    }
}
