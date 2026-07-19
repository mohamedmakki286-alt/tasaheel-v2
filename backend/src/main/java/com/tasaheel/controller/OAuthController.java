package com.tasaheel.controller;

import com.tasaheel.dto.ApiResponse;
import com.tasaheel.dto.AuthResponse;
import com.tasaheel.entity.RefreshToken;
import com.tasaheel.security.JwtService;
import com.tasaheel.service.OAuthService;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/oauth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OAuthController {

    private final OAuthService oauthService;
    private final JwtService jwtService;
    private final MessageSource msg;

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@RequestBody Map<String, String> body) {
        Locale locale = LocaleContextHolder.getLocale();
        String idToken = body.get("idToken");
        String email = body.get("email");
        String name = body.get("name");
        String sub = body.get("sub");
        AuthResponse response = oauthService.handleGoogleToken(idToken, email, name, sub);
        if (response.getToken() != null && response.getUserId() != null) {
            RefreshToken rt = jwtService.generateRefreshToken(response.getUserId(), response.getRole());
            response.setRefreshToken(rt.getToken());
        }
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("auth.oauth.google.success", null, locale), response));
    }

    @PostMapping("/apple")
    public ResponseEntity<ApiResponse<AuthResponse>> appleLogin(@RequestBody Map<String, String> body) {
        Locale locale = LocaleContextHolder.getLocale();
        String identityToken = body.get("identityToken");
        String email = body.get("email");
        String name = body.get("name");
        String sub = body.get("sub");
        AuthResponse response = oauthService.handleAppleToken(identityToken, email, name, sub);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("auth.oauth.apple.success", null, locale), response));
    }
}
