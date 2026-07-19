package com.tasaheel.controller;

import com.tasaheel.dto.*;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.CustomerService;
import com.tasaheel.service.MaintenanceRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CustomerController {

    private final CustomerService customerService;
    private final MaintenanceRequestService requestService;
    private final MessageSource msg;

    @GetMapping("/profile")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerDTO>> getProfile(@AuthenticationPrincipal UserDetailsImpl user) {
        CustomerDTO profile = customerService.getProfile(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerDTO>> updateProfile(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody CustomerDTO dto) {
        CustomerDTO profile = customerService.updateProfile(user.getUserId(), dto);
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("customer.profile.updated", null, locale), profile));
    }

    @GetMapping("/cars")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<CustomerCarDTO>>> getCars(@AuthenticationPrincipal UserDetailsImpl user) {
        List<CustomerCarDTO> cars = customerService.getCars(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(cars));
    }

    @PostMapping("/cars")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerCarDTO>> addCar(
            @AuthenticationPrincipal UserDetailsImpl user,
            @Valid @RequestBody CustomerCarDTO dto) {
        CustomerCarDTO car = customerService.addCar(user.getUserId(), dto);
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(msg.getMessage("customer.car.added", null, locale), car));
    }

    @PutMapping("/cars/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<CustomerCarDTO>> updateCar(
            @PathVariable Long id,
            @Valid @RequestBody CustomerCarDTO dto) {
        CustomerCarDTO car = customerService.updateCar(id, dto);
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("customer.car.updated", null, locale), car));
    }

    @DeleteMapping("/cars/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Void> deleteCar(@PathVariable Long id) {
        customerService.deleteCar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/cars/{carId}/history")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<CarHistoryDTO>>> getCarHistory(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long carId) {
        List<CarHistoryDTO> history = requestService.getCarMaintenanceHistory(carId, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
