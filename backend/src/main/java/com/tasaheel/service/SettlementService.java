package com.tasaheel.service;

import com.tasaheel.dto.*;
import com.tasaheel.entity.*;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.*;
import lombok.RequiredArgsConstructor;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final WorkshopSettlementRepository settlementRepository;
    private final InvoiceRepository invoiceRepository;
    private final WorkshopRepository workshopRepository;
    private final AccountingService accountingService;
    private final JournalEntryRepository journalEntryRepository;
    private final InvoiceService invoiceService;
    private final PlatformSettingService platformSettingService;
    private final MessageSource msg;

    public List<Map<String, Object>> getPendingSettlements() {
        List<Object[]> aggregates = invoiceRepository.aggregatePaidUnsettledByWorkshop();
        Double totalPending = invoiceRepository.sumPaidUnsettled();
        if (totalPending == null) totalPending = 0.0;

        List<Map<String, Object>> workshops = new ArrayList<>();
        for (Object[] row : aggregates) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("workshopId", row[0]);
            item.put("workshopName", row[1]);
            item.put("invoiceCount", row[2]);
            item.put("totalGross", row[3]);
            workshops.add(item);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalPending", totalPending);
        summary.put("totalWorkshops", (long) aggregates.size());

        List<Map<String, Object>> result = new ArrayList<>();
        result.add(Map.of("workshops", workshops, "summary", summary));
        return result;
    }

    public List<InvoiceDTO> getPendingInvoicesForWorkshop(Long workshopId) {
        return invoiceRepository.findPaidUnsettledByWorkshopId(workshopId).stream()
                .map(invoiceService::toInvoiceDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkshopSettlementDTO createSettlement(Long workshopId,
                                                   Map<Long, Double> invoiceCommissions,
                                                   String notes) {
        Workshop workshop = workshopRepository.findById(workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", workshopId));

        List<Invoice> invoices = invoiceRepository.findPaidUnsettledByWorkshopId(workshopId);
        if (invoices.isEmpty()) {
            throw new BadRequestException(msg.getMessage("settlement.no.invoices", null, LocaleContextHolder.getLocale()));
        }

        List<Invoice> selectedInvoices;
        if (invoiceCommissions != null && !invoiceCommissions.isEmpty()) {
            selectedInvoices = invoices.stream()
                    .filter(inv -> invoiceCommissions.containsKey(inv.getId()))
                    .collect(Collectors.toList());
        } else {
            selectedInvoices = invoices;
        }

        if (selectedInvoices.isEmpty()) {
            throw new BadRequestException(msg.getMessage("settlement.no.selected", null, LocaleContextHolder.getLocale()));
        }

        double totalGross = 0;
        double totalCommission = 0;
        double defaultPercentage = getDefaultCommissionPercentage();

        for (Invoice inv : selectedInvoices) {
            Double percentage = invoiceCommissions != null
                    ? invoiceCommissions.get(inv.getId())
                    : null;
            if (percentage == null) percentage = defaultPercentage;

            double grandTotal = inv.getGrandTotal() != null ? inv.getGrandTotal() : 0.0;
            double commissionAmount = grandTotal * percentage / 100;
            inv.setCommissionPercentage(percentage);
            inv.setCommissionAmount(commissionAmount);
            inv.setNetAmount(grandTotal - commissionAmount);
            invoiceRepository.save(inv);

            totalGross += grandTotal;
            totalCommission += commissionAmount;

            accountingService.postCommission(inv, percentage);
        }

        String settlementNumber = generateSettlementNumber();
        double totalNet = totalGross - totalCommission;

        WorkshopSettlement settlement = WorkshopSettlement.builder()
                .workshop(workshop)
                .settlementNumber(settlementNumber)
                .totalGrossAmount(totalGross)
                .totalCommission(totalCommission)
                .totalNetAmount(totalNet)
                .invoiceCount(selectedInvoices.size())
                .status("PENDING")
                .notes(notes)
                .build();
        settlement = settlementRepository.save(settlement);

        for (Invoice inv : selectedInvoices) {
            inv.setSettlement(settlement);
            invoiceRepository.save(inv);
        }

        return toDTO(settlement);
    }

    @Transactional
    public WorkshopSettlementDTO completeSettlement(Long settlementId) {
        WorkshopSettlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement", settlementId));

        if (!"PENDING".equals(settlement.getStatus())) {
            throw new BadRequestException(msg.getMessage("settlement.not.pending", null, LocaleContextHolder.getLocale()));
        }

        JournalEntryDTO entry = accountingService.postSettlement(settlement);
        settlement.setStatus("SETTLED");
        settlement.setSettledAt(LocalDateTime.now());
        settlement.setJournalEntry(journalEntryRepository.findById(entry.getId())
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", entry.getId())));
        settlement = settlementRepository.save(settlement);

        List<Invoice> invoices = invoiceRepository.findBySettlementId(settlementId);
        LocalDateTime now = LocalDateTime.now();
        for (Invoice inv : invoices) {
            inv.setSettledAt(now);
            invoiceRepository.save(inv);
        }

        return toDTO(settlement);
    }

    @Transactional
    public WorkshopSettlementDTO cancelSettlement(Long settlementId) {
        WorkshopSettlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement", settlementId));

        if ("SETTLED".equals(settlement.getStatus())) {
            throw new BadRequestException(msg.getMessage("settlement.cannot.cancel", null, LocaleContextHolder.getLocale()));
        }

        settlement.setStatus("CANCELLED");
        settlement = settlementRepository.save(settlement);

        List<Invoice> invoices = invoiceRepository.findBySettlementId(settlementId);
        for (Invoice inv : invoices) {
            inv.setSettlement(null);
            inv.setSettledAt(null);
            invoiceRepository.save(inv);
        }

        return toDTO(settlement);
    }

    public Page<WorkshopSettlementDTO> getSettlements(int page, int size, String status, Long workshopId) {
        Page<WorkshopSettlement> settlements;
        if (workshopId != null) {
            settlements = settlementRepository.findByWorkshopIdOrderByCreatedAtDesc(workshopId, PageRequest.of(page, size));
        } else if (status != null && !status.isEmpty()) {
            settlements = settlementRepository.findByStatusOrderByCreatedAtDesc(status, PageRequest.of(page, size));
        } else {
            settlements = settlementRepository.findAll(PageRequest.of(page, size));
        }
        return settlements.map(this::toDTO);
    }

    public WorkshopSettlementDTO getSettlement(Long id) {
        WorkshopSettlement settlement = settlementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement", id));
        return toDTOWithInvoices(settlement);
    }

    public List<Map<String, Object>> getSettlementReport(Long workshopId, LocalDate from, LocalDate to) {
        if (from == null) from = LocalDate.now().minusMonths(3);
        if (to == null) to = LocalDate.now().plusDays(1);

        List<Invoice> invoices;
        if (workshopId != null) {
            invoices = invoiceRepository.findByWorkshopIdAndSettlementIsNotNullAndPaidAtBetween(
                    workshopId, from.atStartOfDay(), to.atTime(23, 59, 59));
        } else {
            invoices = invoiceRepository.findBySettlementIsNotNullAndPaidAtBetween(
                    from.atStartOfDay(), to.atTime(23, 59, 59));
        }

        Map<Long, Map<String, Object>> workshopMap = new LinkedHashMap<>();
        for (Invoice inv : invoices) {
            Long wid = inv.getWorkshop().getId();
            workshopMap.computeIfAbsent(wid, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("workshopId", wid);
                m.put("workshopName", inv.getWorkshop().getName());
                m.put("invoiceCount", 0);
                m.put("totalGross", 0.0);
                m.put("totalCommission", 0.0);
                m.put("totalNet", 0.0);
                return m;
            });
            Map<String, Object> w = workshopMap.get(wid);
            w.put("invoiceCount", ((Integer) w.get("invoiceCount")) + 1);
            w.put("totalGross", ((Double) w.get("totalGross")) + inv.getGrandTotal());
            w.put("totalCommission", ((Double) w.get("totalCommission"))
                    + (inv.getCommissionAmount() != null ? inv.getCommissionAmount() : 0.0));
            w.put("totalNet", ((Double) w.get("totalNet"))
                    + (inv.getNetAmount() != null ? inv.getNetAmount() : 0.0));
        }

        return new ArrayList<>(workshopMap.values());
    }

    public FinancialDashboardDTO getDashboard() {
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastMonthStart = monthStart.minusMonths(1);
        LocalDateTime lastMonthEnd = monthStart;

        Double totalRevenue = invoiceRepository.sumByStatus("paid");
        if (totalRevenue == null) totalRevenue = 0.0;
        Double totalCommission = invoiceRepository.sumAllPaidCommission();
        if (totalCommission == null) totalCommission = 0.0;
        Double totalPendingSettlement = invoiceRepository.sumNetPaidUnsettled();
        if (totalPendingSettlement == null) totalPendingSettlement = 0.0;
        Double totalNet = totalRevenue - totalCommission;

        Double lastMonthRevenue = invoiceRepository.sumPaidBetween(lastMonthStart, lastMonthEnd);
        if (lastMonthRevenue == null) lastMonthRevenue = 0.0;
        Double thisMonthRevenue = invoiceRepository.sumPaidBetween(monthStart, now);
        if (thisMonthRevenue == null) thisMonthRevenue = 0.0;

        double revenueChange = lastMonthRevenue > 0
                ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
                : 0;

        Double lastMonthCommission = invoiceRepository.sumCommissionBetween(lastMonthStart, lastMonthEnd);
        if (lastMonthCommission == null) lastMonthCommission = 0.0;
        Double thisMonthCommission = invoiceRepository.sumCommissionBetween(monthStart, now);
        if (thisMonthCommission == null) thisMonthCommission = 0.0;
        double commissionChange = lastMonthCommission > 0
                ? ((thisMonthCommission - lastMonthCommission) / lastMonthCommission) * 100
                : 0;

        return FinancialDashboardDTO.builder()
                .summary(FinancialDashboardDTO.SummaryDTO.builder()
                        .totalRevenue(totalRevenue)
                        .totalCommission(totalCommission)
                        .totalNetToWorkshops(totalNet)
                        .totalPendingSettlement(totalPendingSettlement)
                        .revenueChange(Math.round(revenueChange * 10.0) / 10.0)
                        .commissionChange(Math.round(commissionChange * 10.0) / 10.0)
                        .pendingChange(0.0)
                        .build())
                .monthlyRevenue(getMonthlyRevenue())
                .workshopPerformance(getWorkshopPerformance())
                .recentTransactions(getRecentTransactions())
                .build();
    }

    private List<MonthlyRevenueDTO> getMonthlyRevenue() {
        LocalDateTime sixMonthsAgo = LocalDate.now().minusMonths(6).withDayOfMonth(1).atStartOfDay();
        List<Object[]> revenueData = invoiceRepository.revenuePerDaySince(sixMonthsAgo);

        Map<String, double[]> monthlyMap = new LinkedHashMap<>();
        for (Object[] row : revenueData) {
            String day = row[0].toString();
            String month = day.substring(0, 7);
            Double amount = ((Number) row[1]).doubleValue();
            monthlyMap.computeIfAbsent(month, k -> new double[4]);
            monthlyMap.get(month)[0] += amount;
            monthlyMap.get(month)[1] += amount * 0.10;
        }

        List<MonthlyRevenueDTO> result = new ArrayList<>();
        for (Map.Entry<String, double[]> entry : monthlyMap.entrySet()) {
            double gross = entry.getValue()[0];
            double commission = entry.getValue()[1];
            result.add(MonthlyRevenueDTO.builder()
                    .month(entry.getKey())
                    .gross(gross)
                    .commission(commission)
                    .net(gross - commission)
                    .tax(gross * 0.15 / 1.15)
                    .build());
        }
        return result;
    }

    private List<FinancialDashboardDTO.WorkshopPerformanceDTO> getWorkshopPerformance() {
        List<Invoice> pendingInvoices = invoiceRepository.findPaidUnsettled();
        List<Object[]> settledAggs = settlementRepository.aggregateByWorkshop();

        Map<Long, FinancialDashboardDTO.WorkshopPerformanceDTO> perfMap = new LinkedHashMap<>();

        for (Invoice inv : pendingInvoices) {
            Long wid = inv.getWorkshop().getId();
            double gross = inv.getGrandTotal() != null ? inv.getGrandTotal() : 0.0;
            double commission = inv.getCommissionAmount() != null ? inv.getCommissionAmount() : 0.0;
            double net = inv.getNetAmount() != null ? inv.getNetAmount() : gross - commission;
            FinancialDashboardDTO.WorkshopPerformanceDTO p = perfMap.computeIfAbsent(wid, k -> FinancialDashboardDTO.WorkshopPerformanceDTO.builder()
                    .workshopId(wid).workshopName(inv.getWorkshop().getName()).invoiceCount(0)
                    .totalGross(0.0).totalCommission(0.0).totalNet(0.0).averageCommissionRate(0.0)
                    .settlementStatus("pending").build());
            p.setInvoiceCount(p.getInvoiceCount() + 1);
            p.setTotalGross(p.getTotalGross() + gross);
            p.setTotalCommission(p.getTotalCommission() + commission);
            p.setTotalNet(p.getTotalNet() + net);
            p.setAverageCommissionRate(p.getTotalGross() > 0 ? Math.round(p.getTotalCommission() / p.getTotalGross() * 1000) / 10.0 : 0);
        }

        for (Object[] row : settledAggs) {
            Long wid = (Long) row[0];
            double gross = ((Number) row[3]).doubleValue();
            double commission = ((Number) row[4]).doubleValue();
            double net = ((Number) row[5]).doubleValue();

            if (perfMap.containsKey(wid)) {
                FinancialDashboardDTO.WorkshopPerformanceDTO p = perfMap.get(wid);
                p.setInvoiceCount(p.getInvoiceCount() + ((Number) row[2]).intValue());
                p.setTotalGross(p.getTotalGross() + gross);
                p.setTotalCommission(p.getTotalCommission() + commission);
                p.setTotalNet(p.getTotalNet() + net);
                p.setAverageCommissionRate(p.getTotalGross() > 0
                        ? Math.round(p.getTotalCommission() / p.getTotalGross() * 1000) / 10.0 : 0);
            } else {
                perfMap.put(wid, FinancialDashboardDTO.WorkshopPerformanceDTO.builder()
                        .workshopId(wid)
                        .workshopName((String) row[1])
                        .invoiceCount(((Number) row[2]).intValue())
                        .totalGross(gross)
                        .totalCommission(commission)
                        .averageCommissionRate(gross > 0
                                ? Math.round(commission / gross * 1000) / 10.0 : 0)
                        .totalNet(net)
                        .settlementStatus("settled")
                        .build());
            }
        }

        return new ArrayList<>(perfMap.values());
    }

    private List<TransactionDTO> getRecentTransactions() {
        List<TransactionDTO> transactions = new ArrayList<>();
        int limit = 10;

        List<WorkshopSettlement> recentSettlements = settlementRepository
                .findByStatusOrderByCreatedAtDesc("SETTLED", PageRequest.of(0, 5))
                .getContent();

        for (WorkshopSettlement s : recentSettlements) {
            if (transactions.size() >= limit) break;
            transactions.add(TransactionDTO.builder()
                    .id(s.getId())
                    .type("SETTLEMENT")
                    .description(msg.getMessage("accounting.journal.line.settleWorkshop", new Object[]{s.getWorkshop().getName()}, LocaleContextHolder.getLocale()))
                    .amount(s.getTotalNetAmount())
                    .status("completed")
                    .createdAt(s.getCreatedAt() != null ? s.getCreatedAt().toString() : "")
                    .build());
        }

        List<Invoice> recentInvoices = invoiceRepository.findPaidUnsettled();
        for (Invoice inv : recentInvoices) {
            if (transactions.size() >= limit) break;
            transactions.add(TransactionDTO.builder()
                    .id(inv.getId())
                    .type("PAYMENT")
                    .description(msg.getMessage("accounting.journal.entry.payment", new Object[]{inv.getInvoiceNumber()}, LocaleContextHolder.getLocale()))
                    .amount(inv.getGrandTotal())
                    .status("paid")
                    .createdAt(inv.getPaidAt() != null ? inv.getPaidAt().toString() : "")
                    .build());
        }

        return transactions;
    }

    private Double getDefaultCommissionPercentage() {
        return platformSettingService.getDefaultCommissionRate();
    }

    private String generateSettlementNumber() {
        LocalDate today = LocalDate.now();
        String datePart = today.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = settlementRepository.count();
        return "STL-" + datePart + "-" + String.format("%05d", count + 1);
    }

    private WorkshopSettlementDTO toDTO(WorkshopSettlement settlement) {
        return WorkshopSettlementDTO.builder()
                .id(settlement.getId())
                .workshopId(settlement.getWorkshop().getId())
                .workshopName(settlement.getWorkshop().getName())
                .settlementNumber(settlement.getSettlementNumber())
                .totalGrossAmount(settlement.getTotalGrossAmount())
                .totalCommission(settlement.getTotalCommission())
                .totalNetAmount(settlement.getTotalNetAmount())
                .invoiceCount(settlement.getInvoiceCount())
                .status(settlement.getStatus())
                .notes(settlement.getNotes())
                .settledAt(settlement.getSettledAt())
                .journalEntryId(settlement.getJournalEntry() != null ? settlement.getJournalEntry().getId() : null)
                .createdAt(settlement.getCreatedAt())
                .build();
    }

    private WorkshopSettlementDTO toDTOWithInvoices(WorkshopSettlement settlement) {
        WorkshopSettlementDTO dto = toDTO(settlement);
        List<Invoice> invoices = invoiceRepository.findBySettlementId(settlement.getId());
        dto.setInvoices(invoices.stream().map(invoiceService::toInvoiceDTO).collect(Collectors.toList()));
        return dto;
    }
}
