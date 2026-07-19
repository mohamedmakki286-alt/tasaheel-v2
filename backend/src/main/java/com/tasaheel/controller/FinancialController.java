package com.tasaheel.controller;

import com.tasaheel.dto.*;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/financial")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class FinancialController {

    private final SettlementService settlementService;
    private final AccountingService accountingService;
    private final PlatformSettingService platformSettingService;
    private final MessageSource msg;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<FinancialDashboardDTO>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(settlementService.getDashboard()));
    }

    @GetMapping("/settlements/pending")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPendingSettlements() {
        return ResponseEntity.ok(ApiResponse.success(settlementService.getPendingSettlements()));
    }

    @GetMapping("/settlements/pending/{workshopId}")
    public ResponseEntity<ApiResponse<List<InvoiceDTO>>> getPendingInvoicesForWorkshop(
            @PathVariable Long workshopId) {
        return ResponseEntity.ok(ApiResponse.success(settlementService.getPendingInvoicesForWorkshop(workshopId)));
    }

    @PostMapping("/settlements")
    public ResponseEntity<ApiResponse<WorkshopSettlementDTO>> createSettlement(
            @RequestBody Map<String, Object> body) {
        Long workshopId = Long.valueOf(body.get("workshopId").toString());
        @SuppressWarnings("unchecked")
        Map<String, Object> rawCommissions = (Map<String, Object>) body.get("invoiceCommissions");
        Map<Long, Double> typedCommissions = null;
        if (rawCommissions != null) {
            typedCommissions = new java.util.LinkedHashMap<>();
            for (Map.Entry<String, Object> e : rawCommissions.entrySet()) {
                Number value = (Number) e.getValue();
                typedCommissions.put(Long.parseLong(e.getKey()), value != null ? value.doubleValue() : null);
            }
        }
        String notes = (String) body.get("notes");
        WorkshopSettlementDTO dto = settlementService.createSettlement(workshopId, typedCommissions, notes);
        Locale locale = LocaleContextHolder.getLocale();
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("financial.settlement.created", null, locale), dto));
    }

    @GetMapping("/settlements")
    public ResponseEntity<ApiResponse<Page<WorkshopSettlementDTO>>> getSettlements(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long workshopId) {
        return ResponseEntity.ok(ApiResponse.success(settlementService.getSettlements(page, size, status, workshopId)));
    }

    @GetMapping("/settlements/{id}")
    public ResponseEntity<ApiResponse<WorkshopSettlementDTO>> getSettlement(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(settlementService.getSettlement(id)));
    }

    @PutMapping("/settlements/{id}/complete")
    public ResponseEntity<ApiResponse<WorkshopSettlementDTO>> completeSettlement(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        WorkshopSettlementDTO dto = settlementService.completeSettlement(id);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("financial.settlement.confirmed", null, locale), dto));
    }

    @PutMapping("/settlements/{id}/cancel")
    public ResponseEntity<ApiResponse<WorkshopSettlementDTO>> cancelSettlement(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        WorkshopSettlementDTO dto = settlementService.cancelSettlement(id);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("financial.settlement.cancelled", null, locale), dto));
    }

    @GetMapping("/settlements/report")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSettlementReport(
            @RequestParam(required = false) Long workshopId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null ? LocalDate.parse(to) : null;
        return ResponseEntity.ok(ApiResponse.success(settlementService.getSettlementReport(workshopId, fromDate, toDate)));
    }

    @GetMapping("/accounts")
    public ResponseEntity<ApiResponse<List<AccountDTO>>> getAccounts() {
        return ResponseEntity.ok(ApiResponse.success(accountingService.getAllAccounts()));
    }

    @GetMapping("/journal-entries")
    public ResponseEntity<ApiResponse<Page<JournalEntryDTO>>> getJournalEntries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null ? LocalDate.parse(to) : null;
        return ResponseEntity.ok(ApiResponse.success(accountingService.getJournalEntries(page, size, fromDate, toDate)));
    }

    @GetMapping("/journal-entries/{id}")
    public ResponseEntity<ApiResponse<JournalEntryDTO>> getJournalEntry(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(accountingService.getJournalEntry(id)));
    }

    @GetMapping("/reports/trial-balance")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTrialBalance() {
        return ResponseEntity.ok(ApiResponse.success(accountingService.getTrialBalance()));
    }

    @GetMapping("/reports/income-statement")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getIncomeStatement(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null ? LocalDate.parse(to) : null;
        return ResponseEntity.ok(ApiResponse.success(accountingService.getIncomeStatement(fromDate, toDate)));
    }

    @GetMapping("/reports/balance-sheet")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBalanceSheet() {
        return ResponseEntity.ok(ApiResponse.success(accountingService.getBalanceSheet()));
    }

    @GetMapping("/reports/general-ledger")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getGeneralLedger(
            @RequestParam Long accountId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null ? LocalDate.parse(to) : null;
        return ResponseEntity.ok(ApiResponse.success(accountingService.getGeneralLedger(accountId, fromDate, toDate)));
    }

    @GetMapping("/earnings")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEarnings(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null ? LocalDate.parse(to) : null;
        return ResponseEntity.ok(ApiResponse.success(accountingService.getIncomeStatement(fromDate, toDate)));
    }
}
