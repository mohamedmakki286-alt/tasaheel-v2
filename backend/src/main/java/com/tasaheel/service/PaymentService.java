package com.tasaheel.service;

import com.tasaheel.dto.PaymentDTO;
import com.tasaheel.entity.*;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.integration.MoyasarService;
import com.tasaheel.integration.TamaraService;
import com.tasaheel.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import org.springframework.beans.factory.annotation.Value;
import java.util.Map;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    @Value("${application.payment.callback-base-url:http://localhost:5175}")
    private String callbackBaseUrl;

    @Value("${application.public-url:http://localhost:8080}")
    private String publicApiUrl;

    @Value("${application.moyasar.webhook-secret:}")
    private String webhookSecret;

    private final PaymentRepository paymentRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final MoyasarService moyasarService;
    private final TamaraService tamaraService;
    private final RequestCompletionService requestCompletionService;
    private final AccountingService accountingService;
    private final EscrowService escrowService;
    private final PlatformTransactionManager transactionManager;

    public PaymentDTO initiatePayment(Long requestId, Long customerId, Double amount, String method) {
        return initiatePayment(requestId, customerId, amount, method, null);
    }

    @Transactional
    public PaymentDTO initiatePayment(Long requestId, Long customerId, Double amount, String method, String idempotencyKey) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));
        if (!request.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("You are not the customer for this request");
        }
        Invoice invoice = invoiceRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice for request", requestId));
        if (!"approved".equals(invoice.getStatus())) {
            throw new BadRequestException("Invoice must be approved before payment");
        }
        if (!"awaiting_payment".equals(request.getStatus())) {
            throw new BadRequestException("Work must be completed before payment");
        }
        if (!"moyasar".equalsIgnoreCase(method)) {
            throw new BadRequestException("Unsupported payment method");
        }
        double invoiceAmount = invoice.getGrandTotal() != null ? invoice.getGrandTotal() : 0.0;
        if (amount == null || Math.abs(amount - invoiceAmount) > 0.001) {
            throw new BadRequestException("Payment amount must match the approved invoice");
        }
        if (idempotencyKey == null || idempotencyKey.isBlank()) idempotencyKey = UUID.randomUUID().toString();
        if (idempotencyKey.length() > 100) throw new BadRequestException("Invalid idempotency key");
        if (!idempotencyKey.isBlank()) {
            var existingByKey = paymentRepository.findByIdempotencyKey(idempotencyKey);
            if (existingByKey.isPresent()) {
                Payment existing = existingByKey.get();
                if (!existing.getCustomer().getId().equals(customerId)
                        || !existing.getRequest().getId().equals(requestId)) {
                    throw new BadRequestException("Invalid idempotency key");
                }
                return toPaymentDTO(existing);
            }
        }
        var activePayment = paymentRepository.findFirstByRequestIdAndStatusInOrderByCreatedAtDesc(
                requestId, java.util.List.of("initiated", "completed"));
        if (activePayment.isPresent()) {
            return toPaymentDTO(activePayment.get());
        }

        Payment payment = Payment.builder()
                .request(request)
                .customer(customer)
                .amount(amount)
                .fee(0.0)
                .total(amount)
                .currency("SAR")
                .method(method)
                .status("initiated")
                .idempotencyKey(idempotencyKey)
                .build();

        payment = paymentRepository.save(payment);

        try {
            String customerReturnUrl = callbackBaseUrl + "/payment/callback?requestId=" + requestId
                    + "&paymentId=" + payment.getId();
            String webhookUrl = publicApiUrl + "/api/payments/webhook";
            if (webhookSecret != null && !webhookSecret.isBlank()) {
                webhookUrl += "?token=" + java.net.URLEncoder.encode(
                        webhookSecret, java.nio.charset.StandardCharsets.UTF_8);
            }
            Map<String, Object> moyasarResponse = moyasarService.createHostedInvoice(
                    amount, "SAR", "Payment for request #" + requestId,
                    webhookUrl,
                    customerReturnUrl,
                    callbackBaseUrl + "/orders/" + requestId,
                    "request-" + requestId + "-payment-" + payment.getId()
            );

            if (moyasarResponse != null) {
                Object rawProviderInvoiceId = moyasarResponse.get("id");
                if (rawProviderInvoiceId == null) {
                    throw new BadRequestException("Payment provider did not return an invoice id");
                }
                String providerInvoiceId = rawProviderInvoiceId.toString();
                String transactionUrl = (String) moyasarResponse.get("url");
                if (transactionUrl == null || transactionUrl.isBlank()) {
                    throw new BadRequestException("Payment provider did not return a checkout URL");
                }
                payment.setProviderInvoiceId(providerInvoiceId);
                payment.setMoyasarInvoiceId(transactionUrl);
                paymentRepository.save(payment);
            }
        } catch (Exception e) {
            log.error("Moyasar payment initiation failed: {}", e.getMessage());
            throw new RuntimeException("Payment initiation failed: " + e.getMessage(), e);
        }

        return toPaymentDTO(payment);
    }

    @Transactional
    public PaymentDTO initiateTamaraPayment(Long requestId, Long customerId, Double amount) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));
        if (!request.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("You are not the customer for this request");
        }
        Invoice invoice = invoiceRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice for request", requestId));
        if (!"approved".equals(invoice.getStatus())) {
            throw new BadRequestException("Invoice must be approved before payment");
        }
        if (!"awaiting_payment".equals(request.getStatus())) {
            throw new BadRequestException("Work must be completed before payment");
        }
        double invoiceAmount = invoice.getGrandTotal() != null ? invoice.getGrandTotal() : 0.0;
        if (amount == null || Math.abs(amount - invoiceAmount) > 0.001) {
            throw new BadRequestException("Payment amount must match the approved invoice");
        }
        var activePayment = paymentRepository.findFirstByRequestIdAndStatusInOrderByCreatedAtDesc(
                requestId, java.util.List.of("initiated", "completed"));
        if (activePayment.isPresent()) {
            return toPaymentDTO(activePayment.get());
        }

        Payment payment = Payment.builder()
                .request(request)
                .customer(customer)
                .amount(amount)
                .fee(0.0)
                .total(amount)
                .currency("SAR")
                .method("tamara")
                .status("initiated")
                .build();

        payment = paymentRepository.save(payment);

        try {
            String orderId = "TAM-" + payment.getId();
            Map<String, Object> tamaraResponse = tamaraService.initiateCheckout(
                    amount, "SAR", orderId,
                    customer.getName(), customer.getEmail(), customer.getPhone(),
                    callbackBaseUrl + "/payment/success",
                    callbackBaseUrl + "/payment/failure",
                    callbackBaseUrl + "/payment/cancel"
            );

            if (tamaraResponse != null) {
                String checkoutUrl = null;
                if (tamaraResponse.containsKey("data")) {
                    Map<String, Object> data = (Map<String, Object>) tamaraResponse.get("data");
                    checkoutUrl = (String) data.get("checkout_url");
                }
                if (checkoutUrl == null) {
                    checkoutUrl = (String) tamaraResponse.get("checkout_url");
                }
                if (checkoutUrl != null) {
                    payment.setMoyasarInvoiceId(checkoutUrl);
                }
                payment.setMoyasarPaymentId(orderId);
                paymentRepository.save(payment);
            }
        } catch (Exception e) {
            log.error("Tamara payment initiation failed: {}", e.getMessage());
            throw new RuntimeException("Tamara payment initiation failed: " + e.getMessage(), e);
        }

        return toPaymentDTO(payment);
    }

    @Transactional
    public void handlePaymentWebhook(Map<String, Object> payload) {
        Map<String, Object> paymentPayload = payload;
        if (payload.get("data") instanceof Map<?, ?> nested) {
            Map<String, Object> nestedPayment = new java.util.HashMap<>();
            nested.forEach((key, value) -> nestedPayment.put(String.valueOf(key), value));
            paymentPayload = nestedPayment;
        }
        String providerInvoiceId = paymentPayload.get("id") != null ? paymentPayload.get("id").toString() : null;
        if (providerInvoiceId == null || providerInvoiceId.isBlank()) {
            throw new BadRequestException("Missing provider invoice id");
        }

        Payment payment = paymentRepository.findByProviderInvoiceId(providerInvoiceId)
                .orElseThrow(() -> new BadRequestException("Unknown payment"));
        if ("completed".equals(payment.getStatus())) {
            return;
        }

        verifyAndApplyHostedInvoiceStatus(payment);
    }

    public boolean isValidWebhookToken(String token) {
        if (webhookSecret == null || webhookSecret.isBlank()) return true;
        if (token == null) return false;
        return java.security.MessageDigest.isEqual(
                webhookSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    @Transactional
    public PaymentDTO verifyPayment(Long localPaymentId, Long customerId) {
        Payment payment = paymentRepository.findById(localPaymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", localPaymentId));
        if (!payment.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("You are not allowed to verify this payment");
        }
        if (payment.getProviderInvoiceId() == null || payment.getProviderInvoiceId().isBlank()) {
            throw new BadRequestException("Provider invoice is not initialized");
        }
        verifyAndApplyHostedInvoiceStatus(payment);
        return toPaymentDTO(payment);
    }

    private void verifyAndApplyHostedInvoiceStatus(Payment payment) {
        Map<String, Object> verifiedInvoice = moyasarService.getInvoice(payment.getProviderInvoiceId());
        String status = verifiedInvoice.get("status") != null
                ? verifiedInvoice.get("status").toString() : null;
        validateProviderAmount(verifiedInvoice.get("amount"), payment.getAmount(), true);
        validateProviderCurrency(verifiedInvoice.get("currency"), payment.getCurrency());
        if (status == null || status.isBlank()) {
            throw new BadRequestException("Provider payment status is missing");
        }

        switch (status) {
            case "paid" -> {
                String providerPaymentId = extractProviderPaymentId(verifiedInvoice);
                payment.setMoyasarPaymentId(providerPaymentId);
                completePayment(payment, providerPaymentId);
            }
            case "failed", "canceled", "expired" -> {
                payment.setStatus("failed");
                paymentRepository.save(payment);
            }
            case "refunded" -> {
                payment.setStatus("refunded");
                paymentRepository.save(payment);
            }
            case "initiated", "authorized" -> {
                // Still pending at the provider; keep the local status unchanged.
            }
            default -> throw new BadRequestException("Unsupported payment status");
        }
    }

    private String extractProviderPaymentId(Map<String, Object> invoice) {
        Object payments = invoice.get("payments");
        if (payments instanceof java.util.List<?> list) {
            for (Object item : list) {
                if (!(item instanceof Map<?, ?> providerPayment)) continue;
                String status = providerPayment.get("status") != null
                        ? providerPayment.get("status").toString() : "";
                if (!java.util.Set.of("paid", "captured", "refunded").contains(status.toLowerCase())) continue;
                validateProviderAmount(providerPayment.get("amount"),
                        ((Number) invoice.get("amount")).doubleValue() / 100.0, true);
                Object id = providerPayment.get("id");
                if (id != null) return id.toString();
            }
        }
        throw new BadRequestException("Paid provider invoice has no payment reference");
    }

    private void completePayment(Payment payment, String providerReference) {
        if ("completed".equals(payment.getStatus())) return;
        Invoice invoice = invoiceRepository.findByRequestId(payment.getRequest().getId())
                .orElseThrow(() -> new BadRequestException("Invoice not found"));
        if (!"approved".equals(invoice.getStatus())) {
            throw new BadRequestException("Invoice is not approved");
        }
        payment.setStatus("completed");
        paymentRepository.save(payment);
        invoice.setStatus("paid");
        invoice.setPaymentMethod(payment.getMethod());
        invoice.setPaymentId(providerReference);
        invoice.setPaidAt(LocalDateTime.now());
        invoiceRepository.save(invoice);
        accountingService.postPayment(invoice);
        escrowService.ensureHoldForCompletedPayment(payment);
        requestCompletionService.completeAfterPayment(payment.getRequest(), providerReference);
    }

    @Transactional
    public void handleTamaraWebhook(Map<String, Object> payload) {
        String orderId = null;

        if (payload.containsKey("data") && payload.get("data") instanceof Map<?, ?> data) {
            Object rawOrderId = data.get("order_id");
            orderId = rawOrderId != null ? rawOrderId.toString() : null;
        } else if (payload.get("order_id") != null) {
            orderId = payload.get("order_id").toString();
        }

        if (orderId == null || orderId.isBlank()) {
            throw new BadRequestException("Missing Tamara order id");
        }

        Payment payment = paymentRepository.findByMoyasarPaymentId(orderId)
                .orElseThrow(() -> new BadRequestException("Unknown Tamara order"));
        if ("completed".equals(payment.getStatus())) {
            return;
        }

        Map<String, Object> verifiedOrder = tamaraService.getPaymentStatus(orderId);
        String status = extractString(verifiedOrder, "status", "order_status");
        validateProviderAmount(extractNestedAmount(verifiedOrder), payment.getAmount(), false);

        if ("paid".equalsIgnoreCase(status) || "approved".equalsIgnoreCase(status)
                || "fully_captured".equalsIgnoreCase(status)) {
            Invoice invoice = invoiceRepository.findByRequestId(payment.getRequest().getId())
                    .orElseThrow(() -> new BadRequestException("Invoice not found"));
            if (!"approved".equals(invoice.getStatus())) {
                throw new BadRequestException("Invoice is not approved");
            }
            completePayment(payment, orderId);
        } else if ("cancelled".equalsIgnoreCase(status) || "declined".equalsIgnoreCase(status)) {
            payment.setStatus("failed");
            paymentRepository.save(payment);
        } else {
            throw new BadRequestException("Unsupported Tamara payment status");
        }
    }

    public PaymentDTO refundPayment(Long paymentId) {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        boolean reconciliationOnly = paymentRepository.findById(paymentId)
                .map(payment -> "refund_pending".equals(payment.getStatus()))
                .orElse(false);
        Payment payment = tx.execute(status -> prepareRefund(paymentId));
        try {
            Map<String, Object> providerRefund = reconciliationOnly
                    ? moyasarService.getPayment(payment.getMoyasarPaymentId())
                    : moyasarService.refundPayment(payment.getMoyasarPaymentId(), payment.getAmount());
            validateRefundResult(providerRefund, payment.getAmount());
            Payment completed = tx.execute(status -> finalizeRefund(paymentId, providerRefund));
            return toPaymentDTO(completed);
        } catch (Exception e) {
            log.error("Refund failed: {}", e.getMessage());
            // Keep refund_pending: a timeout may happen after the provider accepted the refund.
            throw new BadRequestException("Refund is pending reconciliation: " + e.getMessage());
        }
    }

    private Payment prepareRefund(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));
        if ("refund_pending".equals(payment.getStatus())) return payment;
        if (!"completed".equals(payment.getStatus())) {
            throw new BadRequestException("Payment must be completed to refund");
        }
        if ("tamara".equalsIgnoreCase(payment.getMethod())) {
            throw new BadRequestException("Tamara refunds must be initiated from the Tamara settlement workflow");
        }
        Invoice invoice = invoiceRepository.findByRequestId(payment.getRequest().getId())
                .orElseThrow(() -> new BadRequestException("Invoice not found"));
        if (invoice.getSettlement() != null) {
            throw new BadRequestException("A settled or scheduled workshop payout cannot be refunded");
        }
        payment.setStatus("refund_pending");
        payment.setRefundRequestedAt(LocalDateTime.now());
        return paymentRepository.save(payment);
    }

    private Payment finalizeRefund(Long paymentId, Map<String, Object> providerRefund) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));
        if ("refunded".equals(payment.getStatus())) return payment;
        if (!"refund_pending".equals(payment.getStatus())) {
            throw new BadRequestException("Payment is not awaiting refund reconciliation");
        }
        Invoice invoice = invoiceRepository.findByRequestId(payment.getRequest().getId())
                .orElseThrow(() -> new BadRequestException("Invoice not found"));
        payment.setStatus("refunded");
        payment.setRefundedAt(LocalDateTime.now());
        Object reference = providerRefund.get("id");
        payment.setRefundReference(reference != null ? reference.toString() : payment.getMoyasarPaymentId());
        paymentRepository.save(payment);
        invoice.setStatus("refunded");
        invoiceRepository.save(invoice);
        escrowService.markRefunded(payment.getRequest().getId());
        accountingService.postPaymentRefund(invoice);
        accountingService.postInvoiceReversal(invoice);
        return payment;
    }

    private void validateRefundResult(Map<String, Object> result, Double expectedAmount) {
        if (result == null) throw new BadRequestException("Provider returned an empty refund response");
        Object refunded = result.get("refunded");
        if (refunded == null) refunded = result.get("amount");
        validateProviderAmount(refunded, expectedAmount, true);
    }

    public PaymentDTO getPayment(Long paymentId, Long userId, String role) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));
        if (!"admin".equalsIgnoreCase(role) && !payment.getCustomer().getId().equals(userId)) {
            throw new BadRequestException("You are not allowed to view this payment");
        }
        return toPaymentDTO(payment);
    }

    private void validateProviderAmount(Object rawAmount, Double expectedAmount, boolean minorUnits) {
        if (rawAmount == null) {
            throw new BadRequestException("Provider payment amount is missing");
        }
        BigDecimal providerAmount = new BigDecimal(rawAmount.toString());
        if (minorUnits) providerAmount = providerAmount.movePointLeft(2);
        BigDecimal expected = BigDecimal.valueOf(expectedAmount).setScale(2, RoundingMode.HALF_UP);
        if (providerAmount.setScale(2, RoundingMode.HALF_UP).compareTo(expected) != 0) {
            throw new BadRequestException("Provider payment amount does not match");
        }
    }

    private void validateProviderCurrency(Object rawCurrency, String expectedCurrency) {
        if (rawCurrency == null || !expectedCurrency.equalsIgnoreCase(rawCurrency.toString())) {
            throw new BadRequestException("Provider payment currency does not match");
        }
    }

    private String extractString(Map<String, Object> data, String... keys) {
        for (String key : keys) {
            Object value = data.get(key);
            if (value != null) return value.toString();
        }
        throw new BadRequestException("Provider payment status is missing");
    }

    private Object extractNestedAmount(Map<String, Object> data) {
        Object totalAmount = data.get("total_amount");
        if (totalAmount instanceof Map<?, ?> amountMap) {
            return amountMap.get("amount");
        }
        if (data.get("order") instanceof Map<?, ?> order
                && order.get("total_amount") instanceof Map<?, ?> amountMap) {
            return amountMap.get("amount");
        }
        return data.get("amount");
    }

    public Page<PaymentDTO> getPaymentHistory(Long customerId, int page, int size) {
        return paymentRepository.findByCustomerIdOrderByCreatedAtDesc(customerId, PageRequest.of(page, size))
                .map(this::toPaymentDTO);
    }

    public Page<PaymentDTO> getAllPayments(int page, int size) {
        return paymentRepository.findAll(PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending()))
                .map(this::toPaymentDTO);
    }

    private PaymentDTO toPaymentDTO(Payment payment) {
        return PaymentDTO.builder()
                .id(payment.getId())
                .requestId(payment.getRequest().getId())
                .customerId(payment.getCustomer().getId())
                .customerName(payment.getCustomer().getName())
                .amount(payment.getAmount())
                .fee(payment.getFee())
                .total(payment.getTotal())
                .currency(payment.getCurrency())
                .method(payment.getMethod())
                .status(payment.getStatus())
                .moyasarPaymentId(payment.getMoyasarPaymentId())
                .moyasarInvoiceId(payment.getMoyasarInvoiceId())
                .paymentUrl(payment.getMoyasarInvoiceId())
                .idempotencyKey(payment.getIdempotencyKey())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
