package com.tasaheel.service;

import com.tasaheel.dto.InvoiceDTO;
import com.tasaheel.dto.InvoiceItemDTO;
import com.tasaheel.dto.PaymentDTO;
import com.tasaheel.entity.*;
import com.tasaheel.event.EventPublisher;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.integration.MoyasarService;
import com.tasaheel.integration.TamaraService;
import com.tasaheel.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FinancialIntegrityTest {
    @Mock PaymentRepository paymentRepository;
    @Mock MaintenanceRequestRepository requestRepository;
    @Mock CustomerRepository customerRepository;
    @Mock InvoiceRepository invoiceRepository;
    @Mock MoyasarService moyasarService;
    @Mock TamaraService tamaraService;
    @Mock RequestCompletionService requestCompletionService;
    @Mock AccountingService accountingService;
    @Mock BusinessNumberService businessNumberService;
    @Mock EscrowService escrowService;
    @Mock PlatformTransactionManager transactionManager;

    @Mock WorkshopRepository workshopRepository;
    @Mock InspectionReportRepository inspectionReportRepository;
    @Mock InvoiceItemRepository invoiceItemRepository;
    @Mock WorkshopSettlementRepository settlementRepository;
    @Mock QuoteRepository quoteRepository;
    @Mock EventPublisher eventPublisher;

    @InjectMocks PaymentService paymentService;
    @InjectMocks InvoiceService invoiceService;

    Customer customer;
    Workshop workshop;
    MaintenanceRequest request;
    Invoice invoice;

    @BeforeEach
    void setUp() {
        lenient().when(businessNumberService.next("INVOICE")).thenReturn("INV-2026-000001");
        ReflectionTestUtils.setField(paymentService, "callbackBaseUrl", "https://customer.example");
        ReflectionTestUtils.setField(paymentService, "publicApiUrl", "https://api.example");
        customer = Customer.builder().id(10L).name("Customer").build();
        workshop = Workshop.builder().id(20L).name("Workshop").build();
        request = MaintenanceRequest.builder().id(30L).customer(customer).status("awaiting_payment").build();
        invoice = Invoice.builder().id(40L).request(request).customer(customer).workshop(workshop)
                .invoiceNumber("INV-TEST").grandTotal(115.0).status("approved")
                .items(new java.util.ArrayList<>()).build();
    }

    @Test
    void paymentInitiationReturnsHostedCheckoutAndDoesNotAddUnapprovedFees() {
        when(requestRepository.findById(30L)).thenReturn(Optional.of(request));
        when(customerRepository.findById(10L)).thenReturn(Optional.of(customer));
        when(invoiceRepository.findByRequestId(30L)).thenReturn(Optional.of(invoice));
        when(paymentRepository.findByIdempotencyKey("key-1")).thenReturn(Optional.empty());
        when(paymentRepository.findFirstByRequestIdAndStatusInOrderByCreatedAtDesc(eq(30L), any()))
                .thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment saved = invocation.getArgument(0);
            if (saved.getId() == null) saved.setId(50L);
            return saved;
        });
        when(moyasarService.createHostedInvoice(anyDouble(), eq("SAR"), anyString(), anyString(),
                anyString(), anyString(), anyString()))
                .thenReturn(Map.of("id", "provider-invoice", "url", "https://checkout.example/1"));

        PaymentDTO result = paymentService.initiatePayment(30L, 10L, 115.0, "moyasar", "key-1");

        assertEquals("https://checkout.example/1", result.getPaymentUrl());
        assertEquals(0.0, result.getFee());
        assertEquals(115.0, result.getTotal());
        verify(moyasarService).createHostedInvoice(eq(115.0), eq("SAR"), anyString(),
                eq("https://api.example/api/payments/webhook"),
                eq("https://customer.example/payment/callback?requestId=30&paymentId=50"),
                eq("https://customer.example/orders/30"), anyString());
    }

    @Test
    void paymentAmountCannotDifferFromApprovedInvoice() {
        when(requestRepository.findById(30L)).thenReturn(Optional.of(request));
        when(customerRepository.findById(10L)).thenReturn(Optional.of(customer));
        when(invoiceRepository.findByRequestId(30L)).thenReturn(Optional.of(invoice));

        assertThrows(BadRequestException.class,
                () -> paymentService.initiatePayment(30L, 10L, 114.99, "moyasar", "key-2"));
        verifyNoInteractions(moyasarService);
    }

    @Test
    void invoiceTotalsAreCalculatedOnServerFromQuantityAndUnitPrice() {
        request.setStatus("awaiting_payment");
        InspectionReport report = InspectionReport.builder().id(60L).request(request).status("approved")
                .grandTotal(115.0).tax(15.0).build();
        Quote quote = Quote.builder().id(70L).request(request).workshop(workshop).status("accepted").price(100.0).build();
        when(requestRepository.findById(30L)).thenReturn(Optional.of(request));
        when(workshopRepository.findById(20L)).thenReturn(Optional.of(workshop));
        when(quoteRepository.findByRequestIdAndStatus(30L, "accepted")).thenReturn(Optional.of(quote));
        when(inspectionReportRepository.findTopByRequestIdAndStatusOrderByCreatedAtDesc(30L, "approved"))
                .thenReturn(Optional.of(report));
        when(invoiceRepository.findByRequestId(30L)).thenReturn(Optional.empty());
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InvoiceItemDTO item = InvoiceItemDTO.builder()
                .name("Part").quantity(2).unitPrice(50.0).total(1.0).build();
        InvoiceDTO result = invoiceService.createOrUpdateInvoice(
                30L, 20L, null, null, 1.0, 999.0, 15.0, 2.0, List.of(item));

        assertEquals(86.96, result.getTotalAmount());
        assertEquals(13.04, result.getTax());
        assertEquals(100.0, result.getGrandTotal());
        assertEquals(100.0, result.getItems().get(0).getTotal());
        assertNotNull(result.getZatcaQrPayload());
        byte[] qr = Base64.getDecoder().decode(result.getZatcaQrPayload());
        assertEquals(1, qr[0]);
    }

    @Test
    void refundIsRejectedWhenWorkshopPayoutWasScheduled() {
        Payment payment = Payment.builder().id(50L).request(request).customer(customer)
                .amount(115.0).currency("SAR").method("moyasar").status("completed").build();
        invoice.setSettlement(WorkshopSettlement.builder().id(90L).status("PENDING").build());
        when(paymentRepository.findById(50L)).thenReturn(Optional.of(payment));
        when(invoiceRepository.findByRequestId(30L)).thenReturn(Optional.of(invoice));

        assertThrows(BadRequestException.class,
                () -> ReflectionTestUtils.invokeMethod(paymentService, "prepareRefund", 50L));
        verifyNoInteractions(moyasarService);
        verify(paymentRepository, never()).save(any());
    }

    @Test
    void verifiedInvoiceUsesPaidAttemptAndCreatesHold() {
        Payment payment = Payment.builder().id(50L).request(request).customer(customer)
                .amount(115.0).total(115.0).fee(0.0).currency("SAR")
                .method("moyasar").status("initiated").providerInvoiceId("inv-1").build();
        when(paymentRepository.findById(50L)).thenReturn(Optional.of(payment));
        when(invoiceRepository.findByRequestId(30L)).thenReturn(Optional.of(invoice));
        when(moyasarService.getInvoice("inv-1")).thenReturn(Map.of(
                "id", "inv-1", "status", "paid", "amount", 11500, "currency", "SAR",
                "payments", List.of(
                        Map.of("id", "failed-1", "status", "failed", "amount", 11500),
                        Map.of("id", "paid-2", "status", "paid", "amount", 11500))));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(i -> i.getArgument(0));
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> i.getArgument(0));

        PaymentDTO result = paymentService.verifyPayment(50L, 10L);

        assertEquals("completed", result.getStatus());
        assertEquals("paid-2", payment.getMoyasarPaymentId());
        verify(escrowService).ensureHoldForCompletedPayment(payment);
    }

    @Test
    void verifiedInvoiceRejectsWrongCurrency() {
        Payment payment = Payment.builder().id(50L).request(request).customer(customer)
                .amount(115.0).currency("SAR").method("moyasar")
                .status("initiated").providerInvoiceId("inv-1").build();
        when(paymentRepository.findById(50L)).thenReturn(Optional.of(payment));
        when(moyasarService.getInvoice("inv-1")).thenReturn(Map.of(
                "status", "paid", "amount", 11500, "currency", "USD", "payments", List.of()));

        assertThrows(BadRequestException.class, () -> paymentService.verifyPayment(50L, 10L));
        verify(paymentRepository, never()).save(any());
    }
}
