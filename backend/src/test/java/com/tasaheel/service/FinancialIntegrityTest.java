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
                eq("https://customer.example/payment/callback?requestId=30"),
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
}
