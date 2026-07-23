package com.tasaheel.controller;

import com.tasaheel.dto.*;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.MaintenanceRequestService;
import com.tasaheel.service.SplitRequestService;
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
import java.util.Map;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('CUSTOMER')")
public class MaintenanceRequestController {

    private final MaintenanceRequestService requestService;
    private final SplitRequestService splitRequestService;
    private final MessageSource msg;

    @PostMapping
    public ResponseEntity<ApiResponse<MaintenanceRequestDTO>> createRequest(
            @AuthenticationPrincipal UserDetailsImpl user,
            @Valid @RequestBody MaintenanceRequestDTO dto,
            @RequestParam(defaultValue = "false") boolean draft) {
        MaintenanceRequestDTO request = requestService.createRequest(user.getUserId(), dto, draft);
        String msg = draft ? "Draft saved successfully" : "Request created successfully";
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(msg, request));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MaintenanceRequestDTO>>> getRequests(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<MaintenanceRequestDTO> requests = requestService.getCustomerRequests(user.getUserId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(requests));
    }

    @GetMapping("/drafts")
    public ResponseEntity<ApiResponse<List<MaintenanceRequestDTO>>> getDrafts(
            @AuthenticationPrincipal UserDetailsImpl user) {
        List<MaintenanceRequestDTO> drafts = requestService.getCustomerDrafts(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(drafts));
    }

    @PutMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<MaintenanceRequestDTO>> submitDraft(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        MaintenanceRequestDTO request = requestService.submitDraft(id, user.getUserId());
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("request.draft.submitted", null, locale), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MaintenanceRequestDTO>> getRequest(
            @AuthenticationPrincipal UserDetailsImpl user, @PathVariable Long id) {
        requestService.requireCustomerOwnership(id, user.getUserId());
        MaintenanceRequestDTO request = requestService.getRequest(id);
        return ResponseEntity.ok(ApiResponse.success(request));
    }

    @GetMapping("/{id}/quotes")
    public ResponseEntity<ApiResponse<List<QuoteDTO>>> getRequestQuotes(
            @AuthenticationPrincipal UserDetailsImpl user, @PathVariable Long id) {
        requestService.requireCustomerOwnership(id, user.getUserId());
        MaintenanceRequestDTO request = requestService.getRequest(id);
        return ResponseEntity.ok(ApiResponse.success(request.getQuotes()));
    }

    @GetMapping("/{id}/quotes/comparison")
    public ResponseEntity<ApiResponse<QuoteComparisonDTO>> getQuoteComparison(
            @AuthenticationPrincipal UserDetailsImpl user, @PathVariable Long id) {
        requestService.requireCustomerOwnership(id, user.getUserId());
        MaintenanceRequestDTO request = requestService.getRequest(id);
        List<QuoteDTO> quotes = request.getQuotes();

        double lowest = quotes.stream().mapToDouble(QuoteDTO::getPrice).min().orElse(0);
        double highest = quotes.stream().mapToDouble(QuoteDTO::getPrice).max().orElse(0);
        double avg = quotes.stream().mapToDouble(QuoteDTO::getPrice).average().orElse(0);
        int fastest = quotes.stream().filter(q -> q.getEstimatedDays() != null && q.getEstimatedDays() > 0)
                .mapToInt(QuoteDTO::getEstimatedDays).min().orElse(0);

        List<CompareItemDTO> compareItems = quotes.stream().map(q -> {
            boolean isBestPrice = q.getPrice().equals(lowest);
            boolean isFastest = q.getEstimatedDays() != null && q.getEstimatedDays() > 0 && q.getEstimatedDays() == fastest;
            boolean isHighestRated = false;

            return CompareItemDTO.builder()
                    .id(q.getId())
                    .workshopId(q.getWorkshopId())
                    .workshopName(q.getWorkshopName())
                    .price(q.getPrice())
                    .estimatedDays(q.getEstimatedDays())
                    .warrantyMonths(q.getWarrantyMonths())
                    .notes(q.getNotes())
                    .status(q.getStatus())
                    .createdAt(q.getCreatedAt())
                    .isBestPrice(isBestPrice)
                    .isFastest(isFastest)
                    .isHighestRated(isHighestRated)
                    .build();
        }).toList();

        QuoteComparisonDTO comparison = QuoteComparisonDTO.builder()
                .quotes(compareItems)
                .summary(ComparisonSummaryDTO.builder()
                        .lowestPrice(lowest)
                        .highestPrice(highest)
                        .averagePrice(avg)
                        .quoteCount(quotes.size())
                        .fastestDays(fastest)
                        .build())
                .build();

        return ResponseEntity.ok(ApiResponse.success(comparison));
    }

    @PostMapping("/{id}/quotes/{quoteId}/accept")
    public ResponseEntity<ApiResponse<Void>> acceptQuote(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id,
            @PathVariable Long quoteId) {
        requestService.acceptQuote(id, quoteId, user.getUserId());
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("request.quote.accepted", null, locale), null));
    }

    @PostMapping("/{id}/quotes/{quoteId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectQuote(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id,
            @PathVariable Long quoteId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        requestService.rejectQuote(id, quoteId, user.getUserId(), reason);
        return ResponseEntity.ok(ApiResponse.success("تم رفض عرض السعر", null));
    }

    @PostMapping("/{id}/approve-report")
    public ResponseEntity<ApiResponse<Void>> approveReport(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        requestService.approveReport(id, user.getUserId());
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("request.report.approved", null, locale), null));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<ApiResponse<List<RequestStatusHistoryDTO>>> getTimeline(
            @AuthenticationPrincipal UserDetailsImpl user, @PathVariable Long id) {
        requestService.requireCustomerOwnership(id, user.getUserId());
        List<RequestStatusHistoryDTO> timeline = requestService.getTimeline(id);
        return ResponseEntity.ok(ApiResponse.success(timeline));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelRequest(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        requestService.cancelRequest(id, user.getUserId());
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("request.cancelled", null, locale), null));
    }

    @PostMapping("/{id}/reject-report")
    public ResponseEntity<ApiResponse<Void>> rejectReport(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        requestService.rejectReportByRequest(id, user.getUserId(), body.getOrDefault("comment", ""));
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("request.report.rejected", null, locale), null));
    }

    @PostMapping("/{id}/transport-request")
    public ResponseEntity<ApiResponse<MaintenanceRequestDTO>> createTransportRequest(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id,
            @Valid @RequestBody TransportRequestDTO transportDTO) {
        MaintenanceRequestDTO request = requestService.createTransportRequest(id, user.getUserId(), transportDTO);
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("request.transport.created", null, locale), request));
    }

    @GetMapping("/{id}/technician")
    public ResponseEntity<ApiResponse<HomeServiceAssignmentDTO>> getAssignedTechnician(
            @AuthenticationPrincipal UserDetailsImpl user, @PathVariable Long id) {
        requestService.requireCustomerOwnership(id, user.getUserId());
        HomeServiceAssignmentDTO assignment = requestService.getTechnicianForRequest(id);
        return ResponseEntity.ok(ApiResponse.success(assignment));
    }

    @GetMapping("/{id}/sub-orders")
    public ResponseEntity<ApiResponse<List<SubOrderDTO>>> getSubOrders(
            @AuthenticationPrincipal UserDetailsImpl user, @PathVariable Long id) {
        requestService.requireCustomerOwnership(id, user.getUserId());
        List<SubOrderDTO> subOrders = splitRequestService.getSubOrders(id);
        return ResponseEntity.ok(ApiResponse.success(subOrders));
    }
}
