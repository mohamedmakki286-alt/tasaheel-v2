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

import org.springframework.beans.factory.annotation.Value;
import java.util.Map;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    @Value("${application.moyasar.base-url}")
    private String baseMoyasarUrl;

    private final PaymentRepository paymentRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final CustomerRepository customerRepository;
    private final InvoiceRepository invoiceRepository;
    private final MoyasarService moyasarService;
    private final TamaraService tamaraService;
    private final RequestCompletionService requestCompletionService;
    private final PlatformSettingService platformSettingService;

    @Transactional
    public PaymentDTO initiatePayment(Long requestId, Long customerId, Double amount, String method) {
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
        double invoiceAmount = invoice.getGrandTotal() != null ? invoice.getGrandTotal() : 0.0;
        if (amount == null || Math.abs(amount - invoiceAmount) > 0.001) {
            throw new BadRequestException("Payment amount must match the approved invoice");
        }

        Payment payment = Payment.builder()
                .request(request)
                .customer(customer)
                .amount(amount)
                .fee(amount * 0.028)
                .total(amount + (amount * 0.028))
                .currency("SAR")
                .method(method)
                .status("initiated")
                .build();

        payment = paymentRepository.save(payment);

        try {
            String sourceType = mapSourceType(method);
            String callbackUrl = "https://salaba.com/payment/callback";

            Map<String, Object> moyasarResponse = moyasarService.initiatePayment(
                    amount, "SAR", "Payment for request #" + requestId,
                    callbackUrl, sourceType
            );

            if (moyasarResponse != null) {
                String moyasarId = (String) moyasarResponse.get("id");
                payment.setMoyasarPaymentId(moyasarId);
                String transactionUrl = (String) moyasarResponse.get("transaction_url");
                if (transactionUrl == null) {
                    Map<String, Object> source = (Map<String, Object>) moyasarResponse.get("source");
                    if (source != null) {
                        transactionUrl = (String) source.get("transaction_url");
                    }
                }
                if (transactionUrl == null && moyasarId != null) {
                    transactionUrl = baseMoyasarUrl + "/payments/" + moyasarId;
                }
                if (transactionUrl != null) {
                    payment.setMoyasarInvoiceId(transactionUrl);
                }
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
        double invoiceAmount = invoice.getGrandTotal() != null ? invoice.getGrandTotal() : 0.0;
        if (amount == null || Math.abs(amount - invoiceAmount) > 0.001) {
            throw new BadRequestException("Payment amount must match the approved invoice");
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
                    "https://salaba.com/payment/success",
                    "https://salaba.com/payment/failure",
                    "https://salaba.com/payment/cancel"
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

    private String mapSourceType(String method) {
        return switch (method) {
            case "applepay" -> "applepay";
            case "tabby" -> "tabby";
            case "creditcard", "mada" -> "creditcard";
            default -> null;
        };
    }

    @Transactional
    public void handlePaymentWebhook(Map<String, Object> payload) {
        try {
            String paymentId = (String) payload.get("id");
            String status = (String) payload.get("status");

            Payment payment = paymentRepository.findByMoyasarPaymentId(paymentId)
                    .orElse(null);

            if (payment == null) {
                log.warn("Payment not found for Moyasar ID: {}", paymentId);
                return;
            }

            switch (status) {
                case "paid":
                    payment.setStatus("completed");
                    break;
                case "failed":
                    payment.setStatus("failed");
                    break;
                case "refunded":
                    payment.setStatus("refunded");
                    break;
                default:
                    payment.setStatus(status);
            }

            paymentRepository.save(payment);

            if ("paid".equals(status)) {
                Invoice invoice = invoiceRepository.findByRequestId(payment.getRequest().getId()).orElse(null);
                if (invoice != null) {
                    invoice.setStatus("paid");
                    invoice.setPaymentMethod(payment.getMethod());
                    invoice.setPaymentId(paymentId);
                    invoice.setPaidAt(java.time.LocalDateTime.now());
                    invoiceRepository.save(invoice);
                }
                requestCompletionService.completeAfterPayment(payment.getRequest(), paymentId);
            }
        } catch (Exception e) {
            log.error("Failed to handle payment webhook: {}", e.getMessage(), e);
        }
    }

    @Transactional
    public void handleTamaraWebhook(Map<String, Object> payload) {
        try {
            String orderId = null;
            String status = null;

            if (payload.containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) payload.get("data");
                orderId = (String) data.get("order_id");
                status = (String) data.get("status");
            } else {
                orderId = (String) payload.get("order_id");
                status = (String) payload.get("status");
            }

            if (orderId == null) return;

            Payment payment = paymentRepository.findByMoyasarPaymentId(orderId).orElse(null);
            if (payment == null) {
                log.warn("Tamara payment not found for order: {}", orderId);
                return;
            }

            if ("paid".equals(status) || "approved".equals(status)) {
                payment.setStatus("completed");
                paymentRepository.save(payment);

                Invoice invoice = invoiceRepository.findByRequestId(payment.getRequest().getId()).orElse(null);
                if (invoice != null) {
                    invoice.setStatus("paid");
                    invoice.setPaymentMethod("tamara");
                    invoice.setPaymentId(orderId);
                    invoice.setPaidAt(java.time.LocalDateTime.now());
                    invoiceRepository.save(invoice);
                }
                requestCompletionService.completeAfterPayment(payment.getRequest(), orderId);
            } else if ("cancelled".equals(status) || "declined".equals(status)) {
                payment.setStatus("failed");
                paymentRepository.save(payment);
            }
        } catch (Exception e) {
            log.error("Failed to handle Tamara webhook: {}", e.getMessage(), e);
        }
    }

    @Transactional
    public PaymentDTO refundPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));

        if (!"completed".equals(payment.getStatus())) {
            throw new BadRequestException("Payment must be completed to refund");
        }

        try {
            moyasarService.refundPayment(payment.getMoyasarPaymentId(), payment.getAmount());
            payment.setStatus("refunded");
            payment = paymentRepository.save(payment);
        } catch (Exception e) {
            log.error("Refund failed: {}", e.getMessage());
            throw new BadRequestException("Refund failed: " + e.getMessage());
        }

        return toPaymentDTO(payment);
    }

    public PaymentDTO getPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", paymentId));
        return toPaymentDTO(payment);
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
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
