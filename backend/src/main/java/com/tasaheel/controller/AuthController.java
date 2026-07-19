package com.tasaheel.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tasaheel.dto.*;
import com.tasaheel.entity.RefreshToken;
import com.tasaheel.security.JwtService;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Locale;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final ObjectMapper objectMapper;
    private final JwtService jwtService;
    private final MessageSource msg;

    @PostMapping("/register/customer")
    public ResponseEntity<ApiResponse<AuthResponse>> registerCustomer(@Valid @RequestBody CustomerDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();
        AuthResponse response = authService.registerCustomer(dto);
        if (response.getToken() != null) {
            RefreshToken rt = jwtService.generateRefreshToken(response.getUserId(), response.getRole());
            response.setRefreshToken(rt.getToken());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(msg.getMessage("auth.register.customer.success", null, locale), response));
    }

    @PostMapping(value = "/register/workshop", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AuthResponse>> registerWorkshop(
            @RequestParam("workshop") String workshopJson,
            @RequestParam(value = "commercialRegistration", required = false) MultipartFile commercialRegFile,
            @RequestParam(value = "municipalityLicense", required = false) MultipartFile municipalityFile) {
        Locale locale = LocaleContextHolder.getLocale();
        try {
            WorkshopDTO dto = objectMapper.readValue(workshopJson, WorkshopDTO.class);
            AuthResponse response = authService.registerWorkshop(dto, commercialRegFile, municipalityFile);
            if (response.getUserId() != null) {
                RefreshToken rt = jwtService.generateRefreshToken(response.getUserId(), response.getRole());
                response.setRefreshToken(rt.getToken());
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(msg.getMessage("auth.register.workshop.success", null, locale), response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(msg.getMessage("auth.register.invalid", new Object[]{e.getMessage()}, locale)));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        AuthResponse response = authService.login(request.getEmail(), request.getPassword());
        RefreshToken rt = jwtService.generateRefreshToken(response.getUserId(), response.getRole());
        response.setRefreshToken(rt.getToken());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("auth.login.success", null, locale), response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        AuthResponse response = authService.refreshAccessToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("auth.refresh.success", null, locale), response));
    }

    @PostMapping("/email/verify")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@Valid @RequestBody EmailVerifyRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        authService.verifyEmail(request.getEmail(), request.getCode());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("auth.email.verify.success", null, locale), null));
    }

    @PostMapping("/email/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@Valid @RequestBody EmailRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        authService.sendEmailVerification(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("auth.email.resend.success", null, locale), null));
    }

    @PostMapping("/password/forgot")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody EmailRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("auth.password.forgot.success", null, locale), null));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordTokenRequest request) {
        Locale locale = LocaleContextHolder.getLocale();
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("auth.password.reset.success", null, locale), null));
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal UserDetailsImpl user) {
        Locale locale = LocaleContextHolder.getLocale();
        authService.logout(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("auth.logout.success", null, locale), null));
    }
}
