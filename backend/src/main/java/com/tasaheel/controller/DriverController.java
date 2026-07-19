package com.tasaheel.controller;

import com.tasaheel.dto.*;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.DriverService;
import jakarta.validation.Valid;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DriverController {

    private final DriverService driverService;
    private final MessageSource msg;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<DriverDTO>> getProfile(@AuthenticationPrincipal UserDetailsImpl user) {
        DriverDTO profile = driverService.getProfile(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<DriverDTO>> updateProfile(
            @AuthenticationPrincipal UserDetailsImpl user,
            @Valid @RequestBody DriverDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();
        DriverDTO profile = driverService.updateProfile(user.getUserId(), dto);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("driver.profile.updated", null, locale), profile));
    }

    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<List<TransportRequestDTO>>> getNearbyRequests(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng) {
        List<TransportRequestDTO> requests = driverService.getNearbyRequests(city, lat, lng);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @GetMapping("/transport/{id}")
    public ResponseEntity<ApiResponse<TransportRequestDTO>> getTransport(@PathVariable Long id) {
        TransportRequestDTO transport = driverService.getTransport(id);
        return ResponseEntity.ok(ApiResponse.success(transport));
    }

    @GetMapping("/transport/{id}/location")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDriverLocation(@PathVariable Long id) {
        Map<String, Object> location = driverService.getDriverLocation(id);
        return ResponseEntity.ok(ApiResponse.success(location));
    }

    @PostMapping("/transport/{id}/accept")
    public ResponseEntity<ApiResponse<Void>> acceptTransport(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        driverService.acceptTransport(id, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("driver.transport.accepted", null, locale), null));
    }

    @PostMapping("/transport/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectTransport(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        driverService.rejectTransport(id, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("driver.transport.rejected", null, locale), null));
    }

    @PutMapping("/transport/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateTransportStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Locale locale = LocaleContextHolder.getLocale();
        driverService.updateTransportStatus(id, body.get("status"));
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("driver.transport.status.updated", null, locale), null));
    }

    @PutMapping("/service-mode")
    public ResponseEntity<ApiResponse<Void>> updateServiceMode(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, String> body) {
        Locale locale = LocaleContextHolder.getLocale();
        driverService.updateServiceMode(user.getUserId(), body.get("serviceMode"));
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("driver.service.mode.updated", null, locale), null));
    }

    @PutMapping("/location")
    public ResponseEntity<ApiResponse<Void>> updateLocation(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, Double> body) {
        Locale locale = LocaleContextHolder.getLocale();
        driverService.updateLocation(user.getUserId(), body.get("latitude"), body.get("longitude"));
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("driver.location.updated", null, locale), null));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<TransportRequestDTO>>> getHistory(
            @AuthenticationPrincipal UserDetailsImpl user) {
        List<TransportRequestDTO> history = driverService.getTripHistory(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
