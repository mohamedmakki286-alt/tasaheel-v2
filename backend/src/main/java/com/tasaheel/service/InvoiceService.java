package com.tasaheel.service;

import com.tasaheel.dto.*;
import com.tasaheel.entity.*;
import com.tasaheel.event.EventPublisher;
import com.tasaheel.event.EventType;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final CustomerRepository customerRepository;
    private final WorkshopRepository workshopRepository;
    private final InspectionReportRepository inspectionReportRepository;
    private final InvoiceItemRepository invoiceItemRepository;
    private final WorkshopSettlementRepository settlementRepository;
    private final RequestCompletionService requestCompletionService;
    private final QuoteRepository quoteRepository;
    private final EventPublisher eventPublisher;
    private final AccountingService accountingService;

    @Transactional
    public InvoiceDTO createOrUpdateInvoice(Long requestId, Long workshopId, Double partsTotal, Double laborTotal, Double totalAmount, Double tax, Double taxPercent, Double grandTotal, List<InvoiceItemDTO> items) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
        Customer customer = request.getCustomer();
        Workshop workshop = workshopRepository.findById(workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", workshopId));
        boolean workshopHasAcceptedQuote = quoteRepository.findByRequestIdAndStatus(requestId, "accepted")
                .map(quote -> quote.getWorkshop().getId().equals(workshopId))
                .orElse(false);
        if (!workshopHasAcceptedQuote) {
            throw new BadRequestException("Only the selected workshop can create an invoice");
        }
        if (!List.of("awaiting_payment", "completed").contains(request.getStatus())) {
            throw new BadRequestException("Work must be completed before creating an invoice");
        }
        InspectionReport approvedReport = inspectionReportRepository
                .findTopByRequestIdAndStatusOrderByCreatedAtDesc(requestId, "approved")
                .orElseThrow(() -> new BadRequestException("The inspection report must be approved before creating an invoice"));

        double finalTaxPercent = taxPercent != null ? taxPercent : 15.0;
        if (finalTaxPercent < 0 || finalTaxPercent > 100) {
            throw new BadRequestException("Tax percentage must be between 0 and 100");
        }

        double safeParts = money(partsTotal);
        double safeLabor = money(laborTotal);
        double safeTotalAmount;
        double safeTax;
        double safeGrandTotal;

        if (items != null && !items.isEmpty()) {
            BigDecimal itemsTotal = BigDecimal.ZERO;
            for (InvoiceItemDTO item : items) {
                if (item.getName() == null || item.getName().isBlank()) {
                    throw new BadRequestException("Invoice item name is required");
                }
                if (item.getQuantity() == null || item.getQuantity() <= 0) {
                    throw new BadRequestException("Invoice item quantity must be greater than zero");
                }
                if (item.getUnitPrice() == null || item.getUnitPrice() < 0) {
                    throw new BadRequestException("Invoice item unit price cannot be negative");
                }
                BigDecimal calculated = BigDecimal.valueOf(item.getUnitPrice())
                        .multiply(BigDecimal.valueOf(item.getQuantity()))
                        .setScale(2, RoundingMode.HALF_UP);
                item.setTotal(calculated.doubleValue());
                itemsTotal = itemsTotal.add(calculated);
            }
            // Unit prices entered by the workshop are VAT-inclusive.  The customer
            // therefore pays exactly the sum of the invoice lines; VAT is extracted
            // from that amount instead of being added on top of it.
            safeGrandTotal = itemsTotal.setScale(2, RoundingMode.HALF_UP).doubleValue();
            if (partsTotal == null && laborTotal == null) {
                safeParts = safeGrandTotal;
                safeLabor = 0.0;
            } else if (Math.abs((safeParts + safeLabor) - safeGrandTotal) > 0.01) {
                throw new BadRequestException("Parts and labor totals must match invoice items total");
            }
            boolean hasLabor = safeLabor > 0;
            safeTotalAmount = extractPreTaxAmount(safeGrandTotal, finalTaxPercent);
            safeTax = money(safeGrandTotal - safeTotalAmount);
            // Keep category totals aligned with the pre-tax subtotal stored on the invoice.
            safeParts = extractPreTaxAmount(safeParts, finalTaxPercent);
            safeLabor = hasLabor ? money(safeTotalAmount - safeParts) : 0.0;
        } else {
            safeGrandTotal = money(approvedReport.getGrandTotal());
            safeTax = money(approvedReport.getTax());
            safeTotalAmount = money(safeGrandTotal - safeTax);
            safeParts = safeTotalAmount;
            safeLabor = 0.0;
        }

        if (safeTotalAmount < 0 || safeTax < 0 || safeGrandTotal <= 0) {
            throw new BadRequestException("Invoice amounts must be valid positive values");
        }
        if (Math.abs(safeGrandTotal - money(safeTotalAmount + safeTax)) > 0.01) {
            throw new BadRequestException("Invoice total does not match subtotal and tax");
        }

        // Check if invoice exists and can be modified
        var existingOpt = invoiceRepository.findByRequestId(requestId);
        if (existingOpt.isPresent()) {
            Invoice existing = existingOpt.get();
            String existingStatus = existing.getStatus();
            if (!"pending_approval".equals(existingStatus) && !"rejected".equals(existingStatus)) {
                throw new BadRequestException("Cannot modify invoice in " + existingStatus + " status");
            }
            // Update existing invoice
            existing.setPartsTotal(safeParts);
            existing.setLaborTotal(safeLabor);
            existing.setTotalAmount(safeTotalAmount);
            existing.setTax(safeTax);
            existing.setTaxPercent(finalTaxPercent);
            existing.setGrandTotal(safeGrandTotal);
            applyTaxSnapshot(existing, workshop, safeGrandTotal, safeTax, existing.getCreatedAt() != null ? existing.getCreatedAt() : LocalDateTime.now());
            existing.setStatus("pending_approval");
            // Remove old items and add new ones
            existing.getItems().clear();
            if (items != null) {
                for (InvoiceItemDTO itemDTO : items) {
                    InvoiceItem item = InvoiceItem.builder()
                            .invoice(existing)
                            .name(itemDTO.getName())
                            .quantity(itemDTO.getQuantity())
                            .unitPrice(itemDTO.getUnitPrice())
                            .total(itemDTO.getTotal())
                            .build();
                    existing.getItems().add(item);
                }
            }
            existing = invoiceRepository.save(existing);
            eventPublisher.publish(this, EventType.INVOICE_CREATED, requestId, "workshop", workshopId);
            return toInvoiceDTO(existing);
        }

        String invoiceNumber = generateInvoiceNumber();

        Invoice invoice = Invoice.builder()
                .request(request)
                .customer(customer)
                .workshop(workshop)
                .invoiceNumber(invoiceNumber)
                .supplierLegalName(workshop.getName())
                .supplierAddress(workshop.getAddress())
                .supplierTaxNumber(workshop.getTaxNumber())
                .supplierCommercialRegistration(workshop.getCommercialRegistration())
                .zatcaQrPayload(buildZatcaQrPayload(workshop.getName(), workshop.getTaxNumber(), LocalDateTime.now(), safeGrandTotal, safeTax))
                .partsTotal(safeParts)
                .laborTotal(safeLabor)
                .totalAmount(safeTotalAmount)
                .tax(safeTax)
                .taxPercent(finalTaxPercent)
                .grandTotal(safeGrandTotal)
                .status("pending_approval")
                .items(new java.util.ArrayList<>())
                .build();

        if (items != null) {
            for (InvoiceItemDTO itemDTO : items) {
                InvoiceItem item = InvoiceItem.builder()
                        .invoice(invoice)
                        .name(itemDTO.getName())
                        .quantity(itemDTO.getQuantity())
                        .unitPrice(itemDTO.getUnitPrice())
                        .total(itemDTO.getTotal())
                        .build();
                invoice.getItems().add(item);
            }
        }

        invoice = invoiceRepository.save(invoice);
        eventPublisher.publish(this, EventType.INVOICE_CREATED, requestId, "workshop", workshopId);
        return toInvoiceDTO(invoice);
    }

    public InvoiceDTO getInvoice(Long requestId) {
        Invoice invoice = invoiceRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice for request", requestId));
        return toInvoiceDTO(invoice);
    }

    private double extractPreTaxAmount(double taxInclusiveAmount, double taxPercent) {
        if (taxPercent <= 0) {
            return money(taxInclusiveAmount);
        }
        return BigDecimal.valueOf(taxInclusiveAmount)
                .divide(BigDecimal.ONE.add(BigDecimal.valueOf(taxPercent).movePointLeft(2)), 2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private void applyTaxSnapshot(Invoice invoice, Workshop workshop, double total, double tax, LocalDateTime issuedAt) {
        if (invoice.getSupplierLegalName() == null) invoice.setSupplierLegalName(workshop.getName());
        if (invoice.getSupplierAddress() == null) invoice.setSupplierAddress(workshop.getAddress());
        if (invoice.getSupplierTaxNumber() == null) invoice.setSupplierTaxNumber(workshop.getTaxNumber());
        if (invoice.getSupplierCommercialRegistration() == null) invoice.setSupplierCommercialRegistration(workshop.getCommercialRegistration());
        invoice.setZatcaQrPayload(buildZatcaQrPayload(invoice.getSupplierLegalName(), invoice.getSupplierTaxNumber(), issuedAt, total, tax));
    }

    private String buildZatcaQrPayload(String supplierName, String taxNumber, LocalDateTime timestamp, double total, double tax) {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        writeTlv(output, 1, supplierName);
        writeTlv(output, 2, taxNumber);
        writeTlv(output, 3, timestamp.toString());
        writeTlv(output, 4, String.format(Locale.ROOT, "%.2f", total));
        writeTlv(output, 5, String.format(Locale.ROOT, "%.2f", tax));
        return Base64.getEncoder().encodeToString(output.toByteArray());
    }

    private void writeTlv(ByteArrayOutputStream output, int tag, String value) {
        byte[] bytes = Objects.toString(value, "").getBytes(StandardCharsets.UTF_8);
        if (bytes.length > 255) throw new BadRequestException("Tax invoice field is too long for QR encoding");
        output.write(tag);
        output.write(bytes.length);
        output.writeBytes(bytes);
    }

    public InvoiceDTO getInvoiceForUser(Long requestId, Long userId, String role) {
        Invoice invoice = invoiceRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice for request", requestId));
        boolean permitted = "admin".equalsIgnoreCase(role)
                || ("customer".equalsIgnoreCase(role) && invoice.getCustomer().getId().equals(userId))
                || ("workshop".equalsIgnoreCase(role) && invoice.getWorkshop().getId().equals(userId))
                || ("technician".equalsIgnoreCase(role)
                    && invoice.getRequest().getTechnician() != null
                    && invoice.getRequest().getTechnician().getId().equals(userId));
        if (!permitted) {
            throw new BadRequestException("You are not allowed to view this invoice");
        }
        return toInvoiceDTO(invoice);
    }

    @Transactional
    public void deleteInvoice(Long requestId, Long workshopId) {
        Invoice invoice = invoiceRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice for request", requestId));
        if (!invoice.getWorkshop().getId().equals(workshopId)) {
            throw new BadRequestException("Not your invoice");
        }
        String status = invoice.getStatus();
        if (!"pending_approval".equals(status) && !"rejected".equals(status)) {
            throw new BadRequestException("Cannot delete invoice in " + status + " status");
        }
        invoiceRepository.delete(invoice);
    }

    @Transactional
    public void updatePaymentStatus(Long invoiceId, String paymentStatus) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", invoiceId));

        invoice.setStatus(paymentStatus);
        if ("paid".equals(paymentStatus)) {
            invoice.setPaidAt(LocalDateTime.now());
        }
        invoiceRepository.save(invoice);
        if ("paid".equals(paymentStatus)) {
            requestCompletionService.completeAfterPayment(invoice.getRequest(), invoice.getPaymentId());
        }
    }

    @Transactional
    public InvoiceDTO approveInvoice(Long requestId, Long customerId) {
        Invoice invoice = invoiceRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice for request", requestId));

        if (!"pending_approval".equals(invoice.getStatus())) {
            throw new BadRequestException("Invoice is not pending approval");
        }

        MaintenanceRequest request = invoice.getRequest();
        if (!request.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("You are not the customer for this request");
        }

        invoice.setStatus("approved");
        invoice = invoiceRepository.save(invoice);
        accountingService.postInvoiceApproval(invoice);
        return toInvoiceDTO(invoice);
    }

    @Transactional
    public InvoiceDTO rejectInvoice(Long requestId, Long customerId) {
        Invoice invoice = invoiceRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice for request", requestId));

        if (!"pending_approval".equals(invoice.getStatus())) {
            throw new BadRequestException("Invoice is not pending approval");
        }

        MaintenanceRequest request = invoice.getRequest();
        if (!request.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("You are not the customer for this request");
        }

        invoice.setStatus("rejected");
        invoice = invoiceRepository.save(invoice);
        return toInvoiceDTO(invoice);
    }

    private double money(Double value) {
        if (value == null) return 0.0;
        if (!Double.isFinite(value)) throw new BadRequestException("Invalid monetary amount");
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private double calculateTax(double subtotal, double percentage) {
        return BigDecimal.valueOf(subtotal)
                .multiply(BigDecimal.valueOf(percentage))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    public InvoiceDTO toInvoiceDTO(Invoice invoice) {
        List<InvoiceItemDTO> itemDTOs = invoice.getItems() != null
                ? invoice.getItems().stream().map(this::toInvoiceItemDTO).collect(Collectors.toList())
                : Collections.emptyList();

        return InvoiceDTO.builder()
                .id(invoice.getId())
                .requestId(invoice.getRequest().getId())
                .customerId(invoice.getCustomer().getId())
                .customerName(invoice.getCustomer().getName())
                .workshopId(invoice.getWorkshop().getId())
                .workshopName(invoice.getWorkshop().getName())
                .invoiceNumber(invoice.getInvoiceNumber())
                .supplierLegalName(invoice.getSupplierLegalName())
                .supplierAddress(invoice.getSupplierAddress())
                .supplierTaxNumber(invoice.getSupplierTaxNumber())
                .supplierCommercialRegistration(invoice.getSupplierCommercialRegistration())
                .zatcaQrPayload(invoice.getZatcaQrPayload())
                .partsTotal(invoice.getPartsTotal())
                .laborTotal(invoice.getLaborTotal())
                .totalAmount(invoice.getTotalAmount())
                .tax(invoice.getTax())
                .taxPercent(invoice.getTaxPercent())
                .grandTotal(invoice.getGrandTotal())
                .status(invoice.getStatus())
                .paymentMethod(invoice.getPaymentMethod())
                .paymentId(invoice.getPaymentId())
                .paidAt(invoice.getPaidAt())
                .commissionPercentage(invoice.getCommissionPercentage())
                .commissionAmount(invoice.getCommissionAmount())
                .netAmount(invoice.getNetAmount())
                .settlementId(invoice.getSettlement() != null ? invoice.getSettlement().getId() : null)
                .settledAt(invoice.getSettledAt())
                .createdAt(invoice.getCreatedAt())
                .items(itemDTOs)
                .build();
    }

    private InvoiceItemDTO toInvoiceItemDTO(InvoiceItem item) {
        return InvoiceItemDTO.builder()
                .id(item.getId())
                .invoiceId(item.getInvoice().getId())
                .name(item.getName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .total(item.getTotal())
                .build();
    }

    private String generateInvoiceNumber() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        String suffix = UUID.randomUUID().toString().substring(0, 6).toUpperCase(Locale.ROOT);
        return "INV-" + timestamp + "-" + suffix;
    }

    public Page<InvoiceDTO> getWorkshopInvoices(Long workshopId, int page, int size) {
        return invoiceRepository.findByWorkshopIdOrderByCreatedAtDesc(workshopId, PageRequest.of(page, size))
                .map(this::toInvoiceDTO);
    }

    public Page<InvoiceDTO> getCustomerInvoices(Long customerId, int page, int size) {
        return invoiceRepository.findByCustomerId(customerId, PageRequest.of(page, size))
                .map(this::toInvoiceDTO);
    }

    public FinancialStatsDTO getWorkshopFinancialStats(Long workshopId) {
        Double totalRevenue = invoiceRepository.sumByWorkshopIdAndStatus(workshopId, "paid");
        long totalInvoices = invoiceRepository.countByWorkshopIdAndStatus(workshopId, "paid")
                + invoiceRepository.countByWorkshopIdAndStatus(workshopId, "pending_approval")
                + invoiceRepository.countByWorkshopIdAndStatus(workshopId, "approved");
        long paidCount = invoiceRepository.countByWorkshopIdAndStatus(workshopId, "paid");
        long pendingCount = invoiceRepository.countByWorkshopIdAndStatus(workshopId, "pending_approval")
                + invoiceRepository.countByWorkshopIdAndStatus(workshopId, "approved");
        Double pendingAmount = invoiceRepository.sumByWorkshopIdAndStatus(workshopId, "pending_approval");
        if (pendingAmount == null) pendingAmount = 0.0;
        Double approvedAmount = invoiceRepository.sumByWorkshopIdAndStatus(workshopId, "approved");
        if (approvedAmount == null) approvedAmount = 0.0;

        return FinancialStatsDTO.builder()
                .totalRevenue(totalRevenue != null ? totalRevenue : 0.0)
                .totalInvoices(totalInvoices)
                .paidCount(paidCount)
                .pendingCount(pendingCount)
                .pendingAmount(pendingAmount + approvedAmount)
                .build();
    }

    // ========== Workshop Financial Dashboard ==========

    public WorkshopDashboardDTO getWorkshopDashboardSummary(Long workshopId) {
        Double totalRevenue = invoiceRepository.sumByWorkshopIdAndStatus(workshopId, "paid");
        Double pendingApprovalAmount = invoiceRepository.sumByWorkshopIdAndStatus(workshopId, "pending_approval");
        Double approvedAmount = invoiceRepository.sumByWorkshopIdAndStatus(workshopId, "approved");
        Double totalCommission = invoiceRepository.sumCommissionByWorkshopIdAndStatus(workshopId, "paid");
        Double totalNet = invoiceRepository.sumNetByWorkshopIdAndStatus(workshopId, "paid");
        Double totalSettled = invoiceRepository.sumNetSettledByWorkshopId(workshopId);
        Double pendingSettlement = invoiceRepository.sumNetPendingSettlementByWorkshopId(workshopId);

        long invoiceCount = invoiceRepository.countByWorkshopId(workshopId);
        long paidCount = invoiceRepository.countByWorkshopIdAndStatus(workshopId, "paid");
        long pendingCount = invoiceRepository.countByWorkshopIdAndStatus(workshopId, "pending_approval")
                + invoiceRepository.countByWorkshopIdAndStatus(workshopId, "approved");
        long rejectedCount = invoiceRepository.countByWorkshopIdAndStatus(workshopId, "rejected");
        long settledCount = invoiceRepository.countByWorkshopIdAndStatus(workshopId, "paid")
                - invoiceRepository.countByWorkshopIdAndStatusAndSettlementIsNull(workshopId, "paid");

        List<MonthlyRevenueDTO> monthlyRevenue = getWorkshopMonthlyRevenue(workshopId);
        List<TransactionDTO> recentTransactions = getWorkshopRecentTransactions(workshopId, 10);

        return WorkshopDashboardDTO.builder()
                .totalRevenue(nullToZero(totalRevenue))
                .totalPending(nullToZero(pendingApprovalAmount) + nullToZero(approvedAmount))
                .totalCommission(nullToZero(totalCommission))
                .totalNet(nullToZero(totalNet))
                .totalSettled(nullToZero(totalSettled))
                .pendingSettlement(nullToZero(pendingSettlement))
                .invoiceCount(invoiceCount)
                .paidCount(paidCount)
                .pendingCount(pendingCount)
                .rejectedCount(rejectedCount)
                .settledCount(settledCount)
                .monthlyRevenue(monthlyRevenue)
                .recentTransactions(recentTransactions)
                .build();
    }

    private List<MonthlyRevenueDTO> getWorkshopMonthlyRevenue(Long workshopId) {
        LocalDateTime twelveMonthsAgo = LocalDate.now().minusMonths(12).withDayOfMonth(1).atStartOfDay();
        List<Invoice> paidInvoices = invoiceRepository.findPaidByWorkshopSince(workshopId, twelveMonthsAgo);

        Map<YearMonth, double[]> monthlyMap = new LinkedHashMap<>();
        for (Invoice inv : paidInvoices) {
            LocalDateTime paidAt = inv.getPaidAt();
            if (paidAt == null) continue;
            YearMonth ym = YearMonth.from(paidAt);
            monthlyMap.computeIfAbsent(ym, k -> new double[4]);
            double[] vals = monthlyMap.get(ym);
            vals[0] += nullToZero(inv.getGrandTotal());
            vals[1] += nullToZero(inv.getCommissionAmount());
            vals[2] += nullToZero(inv.getNetAmount());
            vals[3] += nullToZero(inv.getTax());
        }

        List<YearMonth> sorted = new ArrayList<>(monthlyMap.keySet());
        Collections.sort(sorted);

        List<MonthlyRevenueDTO> result = new ArrayList<>();
        for (YearMonth ym : sorted) {
            double[] vals = monthlyMap.get(ym);
            result.add(MonthlyRevenueDTO.builder()
                    .month(ym.toString())
                    .gross(vals[0])
                    .commission(vals[1])
                    .net(vals[2])
                    .tax(vals[3])
                    .build());
        }
        return result;
    }

    public List<TransactionDTO> getWorkshopRecentTransactions(Long workshopId, int limit) {
        List<TransactionDTO> transactions = new ArrayList<>();

        List<WorkshopSettlement> recentSettlements = settlementRepository
                .findByWorkshopIdOrderByCreatedAtDesc(workshopId, PageRequest.of(0, 5))
                .getContent();
        for (WorkshopSettlement s : recentSettlements) {
            if (transactions.size() >= limit) break;
            transactions.add(TransactionDTO.builder()
                    .id(s.getId())
                    .type("settlement")
                    .description("طھط³ظˆظٹط©: " + s.getSettlementNumber())
                    .amount(s.getTotalNetAmount())
                    .status(s.getStatus().toLowerCase())
                    .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().toString() : "")
                    .build());
        }

        Page<Invoice> recentPaidInvoices = invoiceRepository
                .findByWorkshopIdAndStatusOrderByCreatedAtDesc(workshopId, "paid", PageRequest.of(0, limit));
        for (Invoice inv : recentPaidInvoices) {
            if (transactions.size() >= limit) break;
            transactions.add(TransactionDTO.builder()
                    .id(inv.getId())
                    .type("payment")
                    .description("ط¯ظپط¹ ظپط§طھظˆط±ط©: " + inv.getInvoiceNumber())
                    .amount(inv.getGrandTotal())
                    .status("completed")
                    .createdAt(inv.getPaidAt() != null ? inv.getPaidAt().toString() : "")
                    .build());
        }

        transactions.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        if (transactions.size() > limit) {
            return transactions.subList(0, limit);
        }
        return transactions;
    }

    public Page<InvoiceDTO> getWorkshopFilteredInvoices(Long workshopId, String status, int page, int size) {
        Page<Invoice> invoices;
        if (status == null || status.isEmpty() || "all".equals(status)) {
            invoices = invoiceRepository.findByWorkshopIdOrderByCreatedAtDesc(workshopId, PageRequest.of(page, size));
        } else {
            invoices = invoiceRepository.findByWorkshopIdAndStatusOrderByCreatedAtDesc(workshopId, status, PageRequest.of(page, size));
        }
        return invoices.map(this::toInvoiceDTO);
    }

    public List<Map<String, Object>> getWorkshopSettlementReport(Long workshopId, LocalDate from, LocalDate to) {
        if (from == null) from = LocalDate.now().minusMonths(3);
        if (to == null) to = LocalDate.now().plusDays(1);

        List<Invoice> invoices = invoiceRepository.findByWorkshopIdAndSettlementIsNotNullAndPaidAtBetween(
                workshopId, from.atStartOfDay(), to.atTime(23, 59, 59));

        List<Map<String, Object>> items = new ArrayList<>();
        double totalGross = 0, totalCommission = 0, totalNet = 0;
        for (Invoice inv : invoices) {
            Map<String, Object> item = new LinkedHashMap<>();
            double gross = nullToZero(inv.getGrandTotal());
            double comm = nullToZero(inv.getCommissionAmount());
            double net = nullToZero(inv.getNetAmount());
            item.put("invoiceNumber", inv.getInvoiceNumber());
            item.put("customerName", inv.getCustomer().getName());
            item.put("grandTotal", gross);
            item.put("commissionAmount", comm);
            item.put("netAmount", net);
            item.put("paidAt", inv.getPaidAt() != null ? inv.getPaidAt().toString() : "");
            items.add(item);
            totalGross += gross;
            totalCommission += comm;
            totalNet += net;
        }

        List<Map<String, Object>> result = new ArrayList<>();
        result.add(Map.of(
                "workshopName", invoices.isEmpty() ? "" : invoices.get(0).getWorkshop().getName(),
                "period", from + " - " + to,
                "items", items,
                "totalGross", totalGross,
                "totalCommission", totalCommission,
                "totalNet", totalNet
        ));
        return result;
    }

    public List<Map<String, Object>> getWorkshopIncomeStatement(Long workshopId, LocalDate from, LocalDate to) {
        if (from == null) from = LocalDate.now().minusMonths(3);
        if (to == null) to = LocalDate.now().plusDays(1);

        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.atTime(23, 59, 59);

        Double revenue = invoiceRepository.sumPaidBetweenByWorkshopId(workshopId, fromDt, toDt);
        Double commissions = invoiceRepository.sumCommissionPaidBetweenByWorkshopId(workshopId, fromDt, toDt);
        Double netIncome = nullToZero(revenue) - nullToZero(commissions);

        List<Map<String, Object>> lines = new ArrayList<>();
        lines.add(Map.of("item", "ط§ظ„ط¥ظٹط±ط§ط¯ط§طھ", "amount", nullToZero(revenue), "type", "revenue"));
        lines.add(Map.of("item", "ط§ظ„ط¹ظ…ظˆظ„ط§طھ", "amount", nullToZero(commissions), "type", "expense"));
        lines.add(Map.of("item", "طµط§ظپظٹ ط§ظ„ط¯ط®ظ„", "amount", netIncome, "type", "net"));

        return lines;
    }

    private Double nullToZero(Double val) {
        return val != null ? val : 0.0;
    }
}
