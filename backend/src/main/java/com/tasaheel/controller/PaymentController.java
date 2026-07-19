package com.tasaheel.controller;

import com.tasaheel.dto.*;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PaymentService paymentService;
    private final MessageSource msg;

    @PostMapping("/demo/{requestId}")
    public ResponseEntity<ApiResponse<PaymentDTO>> completeDemoPayment(
            @AuthenticationPrincipal UserDetailsImpl user, @PathVariable Long requestId) {
        return ResponseEntity.ok(ApiResponse.success(paymentService.completeDemoPayment(requestId, user.getUserId())));
    }

    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<PaymentDTO>> initiatePayment(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, Object> body) {
        Long requestId = Long.valueOf(body.get("requestId").toString());
        Double amount = Double.valueOf(body.get("amount").toString());
        String method = (String) body.getOrDefault("method", "moyasar");

        Locale locale = LocaleContextHolder.getLocale();
        PaymentDTO payment = paymentService.initiatePayment(requestId, user.getUserId(), amount, method);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(msg.getMessage("payment.initiated", null, locale), payment));
    }

    @PostMapping("/tamara/initiate")
    public ResponseEntity<ApiResponse<PaymentDTO>> initiateTamaraPayment(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, Object> body) {
        Long requestId = Long.valueOf(body.get("requestId").toString());
        Double amount = Double.valueOf(body.get("amount").toString());

        Locale locale = LocaleContextHolder.getLocale();
        PaymentDTO payment = paymentService.initiateTamaraPayment(requestId, user.getUserId(), amount);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(msg.getMessage("payment.tamara.initiated", null, locale), payment));
    }

    @PostMapping("/tamara/webhook")
    // TODO: Add webhook signature verification for security
    public ResponseEntity<ApiResponse<Void>> handleTamaraWebhook(@RequestBody Map<String, Object> payload) {
        Locale locale = LocaleContextHolder.getLocale();
        paymentService.handleTamaraWebhook(payload);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("payment.tamara.webhook", null, locale), null));
    }

    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse<Void>> handleWebhook(@RequestBody Map<String, Object> payload) {
        Locale locale = LocaleContextHolder.getLocale();
        paymentService.handlePaymentWebhook(payload);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("payment.webhook", null, locale), null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentDTO>> getPayment(@PathVariable Long id) {
        PaymentDTO payment = paymentService.getPayment(id);
        return ResponseEntity.ok(ApiResponse.success(payment));
    }

    @PostMapping("/{id}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PaymentDTO>> refundPayment(@PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        PaymentDTO payment = paymentService.refundPayment(id);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("payment.refunded", null, locale), payment));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Page<PaymentDTO>>> getPaymentHistory(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<PaymentDTO> payments = paymentService.getPaymentHistory(user.getUserId(), page, size);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<PaymentDTO>>> getAllPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<PaymentDTO> payments = paymentService.getAllPayments(page, size);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }
}
