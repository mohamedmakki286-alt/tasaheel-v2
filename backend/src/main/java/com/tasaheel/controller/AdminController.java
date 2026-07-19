package com.tasaheel.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tasaheel.dto.*;
import com.tasaheel.entity.PaymentHold;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;
    private final AuthService authService;
    private final ObjectMapper objectMapper;
    private final EscrowService escrowService;
    private final ServiceItemService serviceItemService;
    private final PlatformSettingService platformSettingService;
    private final MessageSource msg;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStats() {
        Map<String, Object> stats = adminService.getStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(@AuthenticationPrincipal UserDetailsImpl user) {
        Map<String, Object> profile = authService.getProfile(user.getUserId(), "admin");
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, String> body) {
        Map<String, Object> profile = authService.updateProfile(user.getUserId(), "admin", body);
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PostMapping("/password/change")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, String> body) {
        Locale locale = LocaleContextHolder.getLocale();
        authService.changePassword(user.getUserId(), "admin",
                body.get("currentPassword"), body.get("newPassword"));
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("auth.password.reset.success", null, locale), null));
    }

    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<Page<CustomerDTO>>> getCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        Page<CustomerDTO> customers = adminService.getCustomers(page, size, search);
        return ResponseEntity.ok(ApiResponse.success(customers));
    }

    @GetMapping("/customers/{id}")
    public ResponseEntity<ApiResponse<CustomerDTO>> getCustomer(@PathVariable Long id) {
        CustomerDTO customer = adminService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.success(customer));
    }

    @GetMapping("/workshops")
    public ResponseEntity<ApiResponse<Page<WorkshopDTO>>> getWorkshops(
            @RequestParam(defaultValue = "0") int page,
              @RequestParam(defaultValue = "20") int size,
              @RequestParam(required = false) String search,
              @RequestParam(required = false) String status,
              @RequestParam(required = false) String workshopType) {
        Page<WorkshopDTO> workshops = adminService.getWorkshops(page, size, search, status, workshopType);
        return ResponseEntity.ok(ApiResponse.success(workshops));
    }

    @GetMapping("/drivers")
    public ResponseEntity<ApiResponse<Page<DriverDTO>>> getDrivers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        Page<DriverDTO> drivers = adminService.getDrivers(page, size, search);
        return ResponseEntity.ok(ApiResponse.success(drivers));
    }

    @GetMapping("/drivers/{id}")
    public ResponseEntity<ApiResponse<DriverDTO>> getDriver(@PathVariable Long id) {
        DriverDTO driver = adminService.getDriverById(id);
        return ResponseEntity.ok(ApiResponse.success(driver));
    }

    @GetMapping("/technicians")
    public ResponseEntity<ApiResponse<Page<TechnicianDTO>>> getTechnicians(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long workshopId) {
        Page<TechnicianDTO> technicians = adminService.getTechnicians(page, size, workshopId);
        return ResponseEntity.ok(ApiResponse.success(technicians));
    }

    @GetMapping("/workshops/{id}")
    public ResponseEntity<ApiResponse<WorkshopDTO>> getWorkshop(@PathVariable Long id) {
        WorkshopDTO workshop = adminService.getWorkshopById(id);
        return ResponseEntity.ok(ApiResponse.success(workshop));
    }

    @PostMapping(value = "/workshops", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<WorkshopDTO>> createWorkshop(
            @RequestParam("workshop") String workshopJson,
            @RequestParam(value = "commercialRegistration", required = false) MultipartFile commercialRegFile,
            @RequestParam(value = "municipalityLicense", required = false) MultipartFile municipalityFile,
            @RequestParam(value = "contract", required = false) MultipartFile contractFile) {
        Locale locale = LocaleContextHolder.getLocale();
        try {
            WorkshopDTO dto = objectMapper.readValue(workshopJson, WorkshopDTO.class);
            WorkshopDTO workshop = adminService.createWorkshop(dto, commercialRegFile, municipalityFile, contractFile);
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(msg.getMessage("admin.workshop.created", null, locale), workshop));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(msg.getMessage("auth.register.invalid", new Object[]{e.getMessage()}, locale)));
        }
    }

    @PutMapping(value = "/workshops/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<WorkshopDTO>> updateWorkshop(
            @PathVariable Long id, @RequestParam("workshop") String workshopJson,
            @RequestParam(value = "contract", required = false) MultipartFile contractFile) throws Exception {
        WorkshopDTO dto = objectMapper.readValue(workshopJson, WorkshopDTO.class);
        return ResponseEntity.ok(ApiResponse.success(adminService.updateWorkshopAdmin(id, dto, contractFile)));
    }

    @PostMapping("/workshops/{id}/invitation")
    public ResponseEntity<ApiResponse<Map<String, Object>>> sendWorkshopInvitation(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(authService.createWorkshopInvitation(id)));
    }

    @PutMapping("/workshops/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approveWorkshop(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        adminService.approveWorkshop(id);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("admin.workshop.approved", null, locale), null));
    }

    @PutMapping("/workshops/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectWorkshop(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Locale locale = LocaleContextHolder.getLocale();
        adminService.rejectWorkshop(id, body.getOrDefault("reason", "No reason provided"));
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("admin.workshop.rejected", null, locale), null));
    }

    @PostMapping("/drivers")
    public ResponseEntity<ApiResponse<DriverDTO>> createDriver(@Valid @RequestBody DriverDTO dto) {
        Locale locale = LocaleContextHolder.getLocale();
        DriverDTO driver = adminService.createDriver(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(msg.getMessage("admin.driver.created", null, locale), driver));
    }

    @PutMapping("/drivers/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approveDriver(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        adminService.approveDriver(id);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("admin.driver.approved", null, locale), null));
    }

    @PutMapping("/users/{type}/{id}/toggle-status")
    public ResponseEntity<ApiResponse<Void>> toggleUserStatus(
            @PathVariable String type,
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        Locale locale = LocaleContextHolder.getLocale();
        adminService.toggleUserStatus(type, id, body.getOrDefault("isActive", true));
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("admin.user.status.updated", null, locale), null));
    }

    @DeleteMapping("/users/{type}/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable String type,
            @PathVariable Long id) {
        adminService.deleteUser(type, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/requests")
    public ResponseEntity<ApiResponse<Page<MaintenanceRequestDTO>>> getAllRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        Page<MaintenanceRequestDTO> requests = adminService.getAllRequests(page, size, search, status);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @DeleteMapping("/requests/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRequest(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        adminService.deleteRequest(id);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("admin.request.deleted", null, locale), null));
    }

    @GetMapping("/payments")
    public ResponseEntity<ApiResponse<Page<PaymentDTO>>> getAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {
        Page<PaymentDTO> payments = adminService.getAllPayments(page, size, search, status);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @PostMapping("/requests/{id}/reassign")
    public ResponseEntity<ApiResponse<Void>> reassignServiceItem(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        Locale locale = LocaleContextHolder.getLocale();
        Long serviceTypeId = body.get("serviceTypeId");
        Long newWorkshopId = body.get("newWorkshopId");
        serviceItemService.assignServiceTypeToWorkshop(id, serviceTypeId, newWorkshopId);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("admin.service.reassigned", null, locale), null));
    }

    @PostMapping("/requests/{id}/override-status")
    public ResponseEntity<ApiResponse<Void>> overrideStatus(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Locale locale = LocaleContextHolder.getLocale();
        String newStatus = body.get("status");
        adminService.overrideRequestStatus(id, newStatus, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("admin.status.overridden", new Object[]{newStatus}, locale), null));
    }

    @PostMapping("/payments/{id}/release")
    public ResponseEntity<ApiResponse<PaymentHold>> releasePayment(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        Locale locale = LocaleContextHolder.getLocale();
        Long workshopId = body.get("workshopId");
        PaymentHold hold = escrowService.releasePayment(id, workshopId, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("admin.payment.released", null, locale), hold));
    }

    @PostMapping("/payments/{id}/refund")
    public ResponseEntity<ApiResponse<PaymentHold>> refundPayment(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        PaymentHold hold = escrowService.refundPayment(id, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("admin.payment.refunded", null, locale), hold));
    }

    @GetMapping("/payments/holds")
    public ResponseEntity<ApiResponse<java.util.List<PaymentHold>>> getAllHolds() {
        return ResponseEntity.ok(ApiResponse.success(escrowService.getAllHolds()));
    }

    @GetMapping("/settings/platform")
    public ResponseEntity<ApiResponse<List<PlatformSettingDTO>>> getPlatformSettings() {
        return ResponseEntity.ok(ApiResponse.success(platformSettingService.getAllSettings()));
    }

    @PutMapping("/settings/platform")
    public ResponseEntity<ApiResponse<PlatformSettingDTO>> updatePlatformSetting(
            @RequestBody Map<String, String> body) {
        String key = body.get("key");
        String value = body.get("value");
        String description = body.get("description");
        PlatformSettingDTO dto = platformSettingService.setSetting(key, value, description);
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("admin.setting.updated", null, locale), dto));
    }
}
