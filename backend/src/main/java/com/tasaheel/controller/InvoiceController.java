package com.tasaheel.controller;

import com.tasaheel.dto.*;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final MessageSource msg;

    @PostMapping
    public ResponseEntity<ApiResponse<InvoiceDTO>> createInvoice(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, Object> body) {
        Locale locale = LocaleContextHolder.getLocale();
        Long requestId = Long.valueOf(body.get("requestId").toString());
        Double partsTotal = body.containsKey("partsTotal") ? Double.valueOf(body.get("partsTotal").toString()) : null;
        Double laborTotal = body.containsKey("laborTotal") ? Double.valueOf(body.get("laborTotal").toString()) : null;
        Double totalAmount = body.containsKey("totalAmount") ? Double.valueOf(body.get("totalAmount").toString()) : null;
        Double taxAmount = body.containsKey("taxAmount") ? Double.valueOf(body.get("taxAmount").toString()) : null;
        Double taxPercent = body.containsKey("taxPercent") ? Double.valueOf(body.get("taxPercent").toString()) : null;
        Double grandTotal = body.containsKey("grandTotal") ? Double.valueOf(body.get("grandTotal").toString()) : null;

        List<InvoiceItemDTO> items = new ArrayList<>();
        if (body.containsKey("items") && body.get("items") instanceof List) {
            for (Map<String, Object> itemMap : (List<Map<String, Object>>) body.get("items")) {
                double qty = itemMap.containsKey("quantity") ? ((Number) itemMap.get("quantity")).intValue() : 1;
                double unitPrice = itemMap.containsKey("unitPrice") ? ((Number) itemMap.get("unitPrice")).doubleValue() : 0;
                InvoiceItemDTO item = InvoiceItemDTO.builder()
                        .name((String) itemMap.get("name"))
                        .quantity((int) qty)
                        .unitPrice(unitPrice)
                        .total(itemMap.containsKey("total") ? ((Number) itemMap.get("total")).doubleValue() : qty * unitPrice)
                        .build();
                items.add(item);
            }
        }

        InvoiceDTO invoice = invoiceService.createOrUpdateInvoice(requestId, user.getUserId(), partsTotal, laborTotal, totalAmount, taxAmount, taxPercent, grandTotal, items);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("invoice.created", null, locale), invoice));
    }

    @PutMapping("/{requestId}")
    public ResponseEntity<ApiResponse<InvoiceDTO>> updateInvoice(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long requestId,
            @RequestBody Map<String, Object> body) {
        Locale locale = LocaleContextHolder.getLocale();
        Double partsTotal = body.containsKey("partsTotal") ? Double.valueOf(body.get("partsTotal").toString()) : null;
        Double laborTotal = body.containsKey("laborTotal") ? Double.valueOf(body.get("laborTotal").toString()) : null;
        Double totalAmount = body.containsKey("totalAmount") ? Double.valueOf(body.get("totalAmount").toString()) : null;
        Double taxAmount = body.containsKey("taxAmount") ? Double.valueOf(body.get("taxAmount").toString()) : null;
        Double taxPercent = body.containsKey("taxPercent") ? Double.valueOf(body.get("taxPercent").toString()) : null;
        Double grandTotal = body.containsKey("grandTotal") ? Double.valueOf(body.get("grandTotal").toString()) : null;

        List<InvoiceItemDTO> items = new ArrayList<>();
        if (body.containsKey("items") && body.get("items") instanceof List) {
            for (Map<String, Object> itemMap : (List<Map<String, Object>>) body.get("items")) {
                double qty = itemMap.containsKey("quantity") ? ((Number) itemMap.get("quantity")).intValue() : 1;
                double unitPrice = itemMap.containsKey("unitPrice") ? ((Number) itemMap.get("unitPrice")).doubleValue() : 0;
                InvoiceItemDTO item = InvoiceItemDTO.builder()
                        .name((String) itemMap.get("name"))
                        .quantity((int) qty)
                        .unitPrice(unitPrice)
                        .total(itemMap.containsKey("total") ? ((Number) itemMap.get("total")).doubleValue() : qty * unitPrice)
                        .build();
                items.add(item);
            }
        }

        InvoiceDTO invoice = invoiceService.createOrUpdateInvoice(requestId, user.getUserId(), partsTotal, laborTotal, totalAmount, taxAmount, taxPercent, grandTotal, items);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("invoice.updated", null, locale), invoice));
    }

    @DeleteMapping("/{requestId}")
    public ResponseEntity<ApiResponse<Void>> deleteInvoice(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long requestId) {
        Locale locale = LocaleContextHolder.getLocale();
        invoiceService.deleteInvoice(requestId, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("invoice.deleted", null, locale), null));
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<ApiResponse<InvoiceDTO>> getInvoice(@PathVariable Long requestId) {
        InvoiceDTO invoice = invoiceService.getInvoice(requestId);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @GetMapping("/customer/{requestId}")
    public ResponseEntity<ApiResponse<InvoiceDTO>> getInvoiceCustomer(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long requestId) {
        InvoiceDTO invoice = invoiceService.getInvoice(requestId);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @GetMapping("/customer")
    public ResponseEntity<ApiResponse<Page<InvoiceDTO>>> getCustomerInvoices(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<InvoiceDTO> invoices = invoiceService.getCustomerInvoices(user.getUserId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(invoices));
    }

    @PostMapping("/{requestId}/approve")
    public ResponseEntity<ApiResponse<InvoiceDTO>> approveInvoice(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long requestId) {
        Locale locale = LocaleContextHolder.getLocale();
        InvoiceDTO invoice = invoiceService.approveInvoice(requestId, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("invoice.approved", null, locale), invoice));
    }

    @PostMapping("/{requestId}/reject")
    public ResponseEntity<ApiResponse<InvoiceDTO>> rejectInvoice(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long requestId) {
        Locale locale = LocaleContextHolder.getLocale();
        InvoiceDTO invoice = invoiceService.rejectInvoice(requestId, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("invoice.rejected", null, locale), invoice));
    }
}
