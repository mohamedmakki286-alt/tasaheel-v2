package com.tasaheel.controller;

import com.tasaheel.dto.*;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.TechnicianService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/workshops")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WorkshopController {

    private final com.tasaheel.service.WorkshopService workshopService;
    private final TechnicianService technicianService;
    private final com.tasaheel.service.InvoiceService invoiceService;
    private final com.tasaheel.service.SettlementService settlementService;
    private final MessageSource msg;

    // ---- Public endpoints ----

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkshopDTO>>> getPublicWorkshops(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search) {
        List<WorkshopDTO> workshops = workshopService.getPublicWorkshops(city, type, search);
        return ResponseEntity.ok(ApiResponse.success(workshops));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkshopDTO>> getPublicWorkshopById(@PathVariable Long id) {
        WorkshopDTO workshop = workshopService.getPublicWorkshopById(id);
        return ResponseEntity.ok(ApiResponse.success(workshop));
    }

    // ---- Profile endpoints ----

    @GetMapping("/profile")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<WorkshopDTO>> getProfile(@AuthenticationPrincipal UserDetailsImpl user) {
        WorkshopDTO profile = workshopService.getProfile(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<WorkshopDTO>> updateProfile(
            @AuthenticationPrincipal UserDetailsImpl user,
            @Valid @RequestBody WorkshopDTO dto) {
        WorkshopDTO profile = workshopService.updateProfile(user.getUserId(), dto);
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("workshop.profile.updated", null, locale), profile));
    }

    @GetMapping("/requests")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<List<MaintenanceRequestDTO>>> getPendingRequests(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam String city) {
        List<MaintenanceRequestDTO> requests = workshopService.getPendingRequests(user.getUserId(), city);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @PostMapping("/quotes")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<QuoteDTO>> submitQuote(
            @AuthenticationPrincipal UserDetailsImpl user,
            @Valid @RequestBody QuoteDTO dto) {
        QuoteDTO quote = workshopService.submitQuote(dto.getRequestId(), user.getUserId(), dto.getPrice(), dto.getNotes(),
                dto.getEstimatedDays(), dto.getWarrantyMonths(), dto.getServiceTypeId());
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(msg.getMessage("workshop.quote.submitted", null, locale), quote));
    }

    @GetMapping("/quotes")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<List<QuoteDTO>>> getMyQuotes(
            @AuthenticationPrincipal UserDetailsImpl user) {
        List<QuoteDTO> quotes = workshopService.getMyQuotes(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(quotes));
    }

    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<List<MaintenanceRequestDTO>>> getMyRequests(
            @AuthenticationPrincipal UserDetailsImpl user) {
        List<MaintenanceRequestDTO> requests = workshopService.getMyRequests(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @PutMapping("/requests/{id}/status")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<Void>> updateRequestStatus(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if ("accepted".equals(status)) {
            workshopService.acceptRequest(id, user.getUserId());
        } else {
            workshopService.updateRequestStatus(id, user.getUserId(), status);
        }
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("workshop.status.updated", null, locale), null));
    }

    // ---- Technician Management ----

    @GetMapping("/technicians")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<List<TechnicianDTO>>> getTechnicians(
            @AuthenticationPrincipal UserDetailsImpl user) {
        List<TechnicianDTO> list = technicianService.getWorkshopTechnicians(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/technicians/{id}")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<TechnicianDTO>> getTechnician(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        TechnicianDTO tech = technicianService.getTechnicianById(id, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(tech));
    }

    @PostMapping("/technicians")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<TechnicianDTO>> createTechnician(
            @AuthenticationPrincipal UserDetailsImpl user,
            @Valid @RequestBody TechnicianDTO dto) {
        TechnicianDTO tech = technicianService.createTechnician(dto, user.getUserId());
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(msg.getMessage("workshop.technician.added", null, locale), tech));
    }

    @PutMapping("/technicians/{id}")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<TechnicianDTO>> updateTechnician(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id,
            @Valid @RequestBody TechnicianDTO dto) {
        TechnicianDTO tech = technicianService.updateTechnician(id, user.getUserId(), dto);
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("workshop.technician.updated", null, locale), tech));
    }

    @DeleteMapping("/technicians/{id}")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<Void>> deleteTechnician(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        technicianService.deleteTechnician(id, user.getUserId());
        return ResponseEntity.noContent().build();
    }

    // ---- Home Service Assignments ----

    @GetMapping("/home-service")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<List<HomeServiceAssignmentDTO>>> getHomeServiceAssignments(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(required = false) String status) {
        List<HomeServiceAssignmentDTO> list;
        if (status != null && !status.isEmpty()) {
            list = technicianService.getWorkshopAssignmentsByStatus(user.getUserId(), status);
        } else {
            list = technicianService.getWorkshopAssignments(user.getUserId());
        }
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PutMapping("/home-service/{id}/assign/{technicianId}")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<HomeServiceAssignmentDTO>> assignTechnician(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id,
            @PathVariable Long technicianId) {
        HomeServiceAssignmentDTO assignment = technicianService.assignTechnician(id, user.getUserId(), technicianId);
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("workshop.technician.assigned", null, locale), assignment));
    }

    @PutMapping("/home-service/{id}/status")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<HomeServiceAssignmentDTO>> updateAssignmentStatus(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id,
            @RequestParam String status) {
        HomeServiceAssignmentDTO assignment = technicianService.updateAssignmentStatus(id, user.getUserId(), status);
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("workshop.status.updated", null, locale), assignment));
    }

    // ---- Service Pricing Management (for workshop portal) ----

    @GetMapping("/{id}/services")
    public ResponseEntity<ApiResponse<List<WorkshopServiceDTO>>> getWorkshopServices(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(workshopService.getWorkshopServices(id)));
    }

    @GetMapping("/my-services")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<List<WorkshopServiceDTO>>> getMyWorkshopServices(
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(ApiResponse.success(workshopService.getMyWorkshopServices(user.getUserId())));
    }

    @PutMapping("/my-services")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<List<WorkshopServiceDTO>>> updateMyWorkshopServices(
            @AuthenticationPrincipal UserDetailsImpl user,
            @Valid @RequestBody List<WorkshopServiceDTO> services) {
        List<WorkshopServiceDTO> result = workshopService.updateMyWorkshopServices(user.getUserId(), services);
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("workshop.services.updated", null, locale), result));
    }

    @GetMapping("/invoices")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<Page<InvoiceDTO>>> getWorkshopInvoices(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<InvoiceDTO> invoices = invoiceService.getWorkshopInvoices(user.getUserId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    @GetMapping("/financial-stats")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<FinancialStatsDTO>> getFinancialStats(
            @AuthenticationPrincipal UserDetailsImpl user) {
        FinancialStatsDTO stats = invoiceService.getWorkshopFinancialStats(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // ========== Financial Dashboard ==========

    @GetMapping("/financial/dashboard")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<WorkshopDashboardDTO>> getFinancialDashboard(
            @AuthenticationPrincipal UserDetailsImpl user) {
        WorkshopDashboardDTO dashboard = invoiceService.getWorkshopDashboardSummary(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }

    @GetMapping("/financial/invoices")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<Page<InvoiceDTO>>> getFinancialInvoices(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<InvoiceDTO> invoices = invoiceService.getWorkshopFilteredInvoices(user.getUserId(), status, page, size);
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    @GetMapping("/financial/settlements")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<Page<WorkshopSettlementDTO>>> getFinancialSettlements(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<WorkshopSettlementDTO> settlements = settlementService.getSettlements(page, size, null, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(settlements));
    }

    @GetMapping("/financial/transactions")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<List<TransactionDTO>>> getFinancialTransactions(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(defaultValue = "10") int limit) {
        List<TransactionDTO> transactions = invoiceService.getWorkshopRecentTransactions(user.getUserId(), limit);
        return ResponseEntity.ok(ApiResponse.success(transactions));
    }

    @GetMapping("/financial/settlement-report")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFinancialSettlementReport(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null ? LocalDate.parse(to) : null;
        List<Map<String, Object>> report = invoiceService.getWorkshopSettlementReport(user.getUserId(), fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/financial/income-statement")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFinancialIncomeStatement(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null ? LocalDate.parse(to) : null;
        List<Map<String, Object>> statement = invoiceService.getWorkshopIncomeStatement(user.getUserId(), fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.success(statement));
    }

    // ========== Gallery Management ==========

    @GetMapping("/my/gallery")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<List<WorkshopGalleryDTO>>> getMyGallery(
            @AuthenticationPrincipal UserDetailsImpl user) {
        return ResponseEntity.ok(ApiResponse.success(workshopService.getGallery(user.getUserId())));
    }

    @PostMapping("/my/gallery")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<WorkshopGalleryDTO>> addToGallery(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, Object> body) {
        String mediaUrl = (String) body.get("mediaUrl");
        String mediaType = (String) body.getOrDefault("mediaType", "image");
        Boolean isCover = body.get("isCover") != null ? (Boolean) body.get("isCover") : false;
        WorkshopGalleryDTO dto = workshopService.addToGallery(user.getUserId(), mediaUrl, mediaType, isCover);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(dto));
    }

    @PutMapping("/my/gallery/{itemId}")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<WorkshopGalleryDTO>> updateGalleryItem(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long itemId,
            @RequestBody Map<String, Object> body) {
        Integer displayOrder = body.get("displayOrder") != null ? ((Number) body.get("displayOrder")).intValue() : null;
        Boolean isCover = body.get("isCover") != null ? (Boolean) body.get("isCover") : null;
        WorkshopGalleryDTO dto = workshopService.updateGalleryItem(user.getUserId(), itemId, displayOrder, isCover);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @DeleteMapping("/my/gallery/{itemId}")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<Void>> deleteGalleryItem(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long itemId) {
        workshopService.deleteGalleryItem(user.getUserId(), itemId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // ========== Public Gallery ==========

    @GetMapping("/{id}/gallery")
    public ResponseEntity<ApiResponse<List<WorkshopGalleryDTO>>> getWorkshopGallery(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(workshopService.getGallery(id)));
    }
}
