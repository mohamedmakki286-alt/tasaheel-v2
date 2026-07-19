package com.tasaheel.controller;

import com.tasaheel.dto.*;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.WorkshopServiceListingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkshopServiceListingController {

    private final WorkshopServiceListingService service;

    // === PUBLIC: View workshop services ===

    @GetMapping("/workshops/{workshopId}/service-listings")
    public ResponseEntity<ApiResponse<List<WorkshopServiceListingDTO>>> getWorkshopServices(
            @PathVariable Long workshopId) {
        List<WorkshopServiceListingDTO> services = service.getWorkshopVisibleServices(workshopId);
        return ResponseEntity.ok(ApiResponse.success(services));
    }

    @GetMapping("/service-listings/{uuid}")
    public ResponseEntity<ApiResponse<WorkshopServiceListingDTO>> getServiceByUuid(@PathVariable String uuid) {
        WorkshopServiceListingDTO dto = service.getServiceByUuid(uuid);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    // === WORKSHOP: Manage own services ===

    @GetMapping("/workshops/my/service-listings")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<List<WorkshopServiceListingDTO>>> getMyServices(
            @AuthenticationPrincipal UserDetailsImpl user) {
        List<WorkshopServiceListingDTO> services = service.getWorkshopServices(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(services));
    }

    @PostMapping("/workshops/my/service-listings")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<WorkshopServiceListingDTO>> createService(
            @AuthenticationPrincipal UserDetailsImpl user,
            @Valid @RequestBody CreateWorkshopServiceRequest req) {
        WorkshopServiceListingDTO dto = service.createService(user.getUserId(), req, user.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dto));
    }

    @PutMapping("/service-listings/{id}")
    @PreAuthorize("hasRole('WORKSHOP') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<WorkshopServiceListingDTO>> updateService(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id,
            @Valid @RequestBody UpdateWorkshopServiceRequest req) {
        WorkshopServiceListingDTO dto = service.updateService(id, req, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PatchMapping("/service-listings/{id}")
    @PreAuthorize("hasRole('WORKSHOP') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<WorkshopServiceListingDTO>> patchService(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id,
            @RequestBody UpdateWorkshopServiceRequest req) {
        WorkshopServiceListingDTO dto = service.updateService(id, req, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @DeleteMapping("/service-listings/{id}")
    @PreAuthorize("hasRole('WORKSHOP') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteService(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        service.deleteService(id, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/service-listings/{id}/duplicate")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<WorkshopServiceListingDTO>> duplicateService(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        WorkshopServiceListingDTO dto = service.duplicateService(id, user.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dto));
    }

    @PostMapping("/service-listings/{id}/restore")
    @PreAuthorize("hasRole('WORKSHOP') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> restoreService(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        service.restoreService(id, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/workshops/my/service-listings/reorder")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<Void>> reorderServices(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, List<Long>> body) {
        service.reorderServices(user.getUserId(), body.get("serviceIds"), user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // === CATEGORIES ===

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<ServiceCategoryDTO>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(service.getCategories()));
    }

    @GetMapping("/admin/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ServiceCategoryDTO>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success(service.getAllCategories()));
    }

    @PostMapping("/admin/categories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ServiceCategoryDTO>> createCategory(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, Object> body) {
        ServiceCategoryDTO dto = service.createCategory(
                (String) body.get("name"),
                (String) body.get("nameEn"),
                (String) body.get("icon"),
                body.get("displayOrder") != null ? ((Number) body.get("displayOrder")).intValue() : null,
                user.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dto));
    }

    @PutMapping("/admin/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ServiceCategoryDTO>> updateCategory(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        ServiceCategoryDTO dto = service.updateCategory(id,
                (String) body.get("name"),
                (String) body.get("nameEn"),
                (String) body.get("icon"),
                body.get("displayOrder") != null ? ((Number) body.get("displayOrder")).intValue() : null,
                body.get("isActive") != null ? (Boolean) body.get("isActive") : null,
                user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    // === ADMIN ===

    @GetMapping("/admin/service-listings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<WorkshopServiceListingDTO>>> adminGetAllServices(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long workshopId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.adminGetAllServices(search, workshopId, categoryId, page, size)));
    }

    @PatchMapping("/admin/service-listings/{id}/toggle-visibility")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> adminToggleVisibility(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        service.adminToggleServiceVisibility(id, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/admin/service-listings/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> adminDeleteService(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        service.adminDeleteService(id, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/admin/service-listings/audit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<ServiceAuditLogDTO>>> adminGetAuditLog(
            @RequestParam(required = false) Long workshopId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.getAuditLog(workshopId, page, size)));
    }
}
