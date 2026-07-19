package com.tasaheel.service;

import com.tasaheel.dto.*;
import com.tasaheel.entity.*;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.*;
import lombok.RequiredArgsConstructor;
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
public class AccountingService {

    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final JournalEntryLineRepository journalEntryLineRepository;
    private final InvoiceRepository invoiceRepository;
    private final WorkshopSettlementRepository settlementRepository;
    private final MessageSource msg;
    private final PlatformSettingService platformSettingService;

    @Transactional
    public JournalEntryDTO createJournalEntry(LocalDate entryDate, String description,
                                               String referenceType, Long referenceId,
                                               List<JournalEntryLineDTO> lines) {
        String entryNumber = generateEntryNumber(entryDate);

        JournalEntry entry = JournalEntry.builder()
                .entryNumber(entryNumber)
                .entryDate(entryDate)
                .description(description)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .status("POSTED")
                .build();
        entry = journalEntryRepository.save(entry);

        double totalDebit = 0;
        double totalCredit = 0;
        for (JournalEntryLineDTO lineDTO : lines) {
            Account account = accountRepository.findById(lineDTO.getAccountId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account", lineDTO.getAccountId()));

            JournalEntryLine line = JournalEntryLine.builder()
                    .entry(entry)
                    .account(account)
                    .debit(lineDTO.getDebit() != null ? lineDTO.getDebit() : 0.0)
                    .credit(lineDTO.getCredit() != null ? lineDTO.getCredit() : 0.0)
                    .description(lineDTO.getDescription())
                    .build();
            journalEntryLineRepository.save(line);
            totalDebit += line.getDebit();
            totalCredit += line.getCredit();

            account.setBalance(account.getBalance() + line.getDebit() - line.getCredit());
            accountRepository.save(account);
        }

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new IllegalStateException(msg.getMessage("accounting.entry.not.balanced", new Object[]{totalDebit, totalCredit}, LocaleContextHolder.getLocale()));
        }

        return toJournalEntryDTO(entry);
    }

    @Transactional
    public JournalEntryDTO postInvoiceApproval(Invoice invoice) {
        Account receivables = accountRepository.findByCode("1.3.1")
                .orElseThrow(() -> new ResourceNotFoundException("Account", "code", "1.3.1"));
        Account payables = accountRepository.findByCode("2.1.1")
                .orElseThrow(() -> new ResourceNotFoundException("Account", "code", "2.1.1"));

        var locale = LocaleContextHolder.getLocale();
        return createJournalEntry(
                LocalDate.now(),
                msg.getMessage("accounting.journal.entry.invoiceApproval", new Object[]{invoice.getInvoiceNumber()}, locale),
                "INVOICE_APPROVAL", invoice.getId(),
                List.of(
                        JournalEntryLineDTO.builder()
                                .accountId(receivables.getId())
                                .debit(invoice.getGrandTotal())
                                .description(msg.getMessage("accounting.journal.line.receivables", new Object[]{invoice.getInvoiceNumber()}, locale))
                                .build(),
                        JournalEntryLineDTO.builder()
                                .accountId(payables.getId())
                                .credit(invoice.getGrandTotal())
                                .description(msg.getMessage("accounting.journal.line.workshopPayables", new Object[]{invoice.getInvoiceNumber()}, locale))
                                .build()
                )
        );
    }

    @Transactional
    public JournalEntryDTO postInvoiceReversal(Invoice invoice) {
        List<JournalEntry> entries = journalEntryRepository.findByReference("INVOICE_APPROVAL", invoice.getId());
        for (JournalEntry entry : entries) {
            entry.setStatus("REVERSED");
            journalEntryRepository.save(entry);

            List<JournalEntryLine> lines = journalEntryLineRepository.findByEntryId(entry.getId());
            for (JournalEntryLine line : lines) {
                Account account = line.getAccount();
                account.setBalance(account.getBalance() - line.getDebit() + line.getCredit());
                accountRepository.save(account);
            }
        }

        Account receivables = accountRepository.findByCode("1.3.1")
                .orElseThrow(() -> new ResourceNotFoundException("Account", "code", "1.3.1"));
        Account payables = accountRepository.findByCode("2.1.1")
                .orElseThrow(() -> new ResourceNotFoundException("Account", "code", "2.1.1"));

        var locale = LocaleContextHolder.getLocale();
        return createJournalEntry(
                LocalDate.now(),
                msg.getMessage("accounting.journal.entry.invoiceReversal", new Object[]{invoice.getInvoiceNumber()}, locale),
                "INVOICE_REVERSAL", invoice.getId(),
                List.of(
                        JournalEntryLineDTO.builder()
                                .accountId(payables.getId())
                                .debit(invoice.getGrandTotal())
                                .description(msg.getMessage("accounting.journal.line.reverseWorkshopPayables", new Object[]{invoice.getInvoiceNumber()}, locale))
                                .build(),
                        JournalEntryLineDTO.builder()
                                .accountId(receivables.getId())
                                .credit(invoice.getGrandTotal())
                                .description(msg.getMessage("accounting.journal.line.reverseReceivables", new Object[]{invoice.getInvoiceNumber()}, locale))
                                .build()
                )
        );
    }

    @Transactional
    public JournalEntryDTO postPayment(Invoice invoice) {
        Account holdingWallet = accountRepository.findByCode("1.2.1")
                .orElseThrow(() -> new ResourceNotFoundException("Account", "code", "1.2.1"));
        Account receivables = accountRepository.findByCode("1.3.1")
                .orElseThrow(() -> new ResourceNotFoundException("Account", "code", "1.3.1"));

        var locale = LocaleContextHolder.getLocale();
        return createJournalEntry(
                LocalDate.now(),
                msg.getMessage("accounting.journal.entry.payment", new Object[]{invoice.getInvoiceNumber()}, locale),
                "PAYMENT", invoice.getId(),
                List.of(
                        JournalEntryLineDTO.builder()
                                .accountId(holdingWallet.getId())
                                .debit(invoice.getGrandTotal())
                                .description(msg.getMessage("accounting.journal.line.paymentWallet", new Object[]{invoice.getInvoiceNumber()}, locale))
                                .build(),
                        JournalEntryLineDTO.builder()
                                .accountId(receivables.getId())
                                .credit(invoice.getGrandTotal())
                                .description(msg.getMessage("accounting.journal.line.settleReceivables", new Object[]{invoice.getInvoiceNumber()}, locale))
                                .build()
                )
        );
    }

    @Transactional
    public JournalEntryDTO postCommission(Invoice invoice, Double commissionPercentage) {
        Account workshopPayables = accountRepository.findByCode("2.1.1")
                .orElseThrow(() -> new ResourceNotFoundException("Account", "code", "2.1.1"));
        Account commissionRevenue = accountRepository.findByCode("3.1.1")
                .orElseThrow(() -> new ResourceNotFoundException("Account", "code", "3.1.1"));

        Double commissionAmount = invoice.getGrandTotal() * commissionPercentage / 100;

        var locale = LocaleContextHolder.getLocale();
        return createJournalEntry(
                LocalDate.now(),
                msg.getMessage("accounting.journal.entry.commission", new Object[]{invoice.getInvoiceNumber(), commissionPercentage}, locale),
                "COMMISSION", invoice.getId(),
                List.of(
                        JournalEntryLineDTO.builder()
                                .accountId(workshopPayables.getId())
                                .debit(commissionAmount)
                                .description(msg.getMessage("accounting.journal.line.reduceCommission", new Object[]{commissionPercentage}, locale))
                                .build(),
                        JournalEntryLineDTO.builder()
                                .accountId(commissionRevenue.getId())
                                .credit(commissionAmount)
                                .description(msg.getMessage("accounting.journal.line.commissionRevenue", new Object[]{invoice.getInvoiceNumber()}, locale))
                                .build()
                )
        );
    }

    @Transactional
    public JournalEntryDTO postSettlement(WorkshopSettlement settlement) {
        Account workshopPayables = accountRepository.findByCode("2.1.1")
                .orElseThrow(() -> new ResourceNotFoundException("Account", "code", "2.1.1"));
        Account bankAccount = accountRepository.findByCode("1.1.2")
                .orElseThrow(() -> new ResourceNotFoundException("Account", "code", "1.1.2"));

        var locale = LocaleContextHolder.getLocale();
        return createJournalEntry(
                LocalDate.now(),
                msg.getMessage("accounting.journal.entry.settlement", new Object[]{settlement.getSettlementNumber()}, locale),
                "SETTLEMENT", settlement.getId(),
                List.of(
                        JournalEntryLineDTO.builder()
                                .accountId(workshopPayables.getId())
                                .debit(settlement.getTotalNetAmount())
                                .description(msg.getMessage("accounting.journal.line.settleWorkshop", new Object[]{settlement.getSettlementNumber()}, locale))
                                .build(),
                        JournalEntryLineDTO.builder()
                                .accountId(bankAccount.getId())
                                .credit(settlement.getTotalNetAmount())
                                .description(msg.getMessage("accounting.journal.line.payWorkshop", new Object[]{settlement.getSettlementNumber()}, locale))
                                .build()
                )
        );
    }

    public List<AccountDTO> getAllAccounts() {
        return accountRepository.findByIsActiveTrueOrderByCode().stream()
                .map(this::toAccountDTO)
                .collect(Collectors.toList());
    }

    public Page<JournalEntryDTO> getJournalEntries(int page, int size, LocalDate from, LocalDate to) {
        if (from == null) from = LocalDate.now().minusMonths(3);
        if (to == null) to = LocalDate.now().plusDays(1);
        return journalEntryRepository
                .findByEntryDateBetweenOrderByEntryDateDesc(from, to, PageRequest.of(page, size))
                .map(this::toJournalEntryDTO);
    }

    public JournalEntryDTO getJournalEntry(Long id) {
        JournalEntry entry = journalEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("JournalEntry", id));
        return toJournalEntryDTO(entry);
    }

    public List<Map<String, Object>> getTrialBalance() {
        List<Account> accounts = accountRepository.findByIsActiveTrueOrderByCode();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Account account : accounts) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("accountId", account.getId());
            row.put("code", account.getCode());
            row.put("name", account.getName());
            row.put("type", account.getType());
            row.put("level", account.getLevel());

            Double debit = Math.max(0, account.getBalance());
            Double credit = Math.max(0, -account.getBalance());
            row.put("debit", debit);
            row.put("credit", credit);
            result.add(row);
        }
        return result;
    }

    public Map<String, Object> getIncomeStatement(LocalDate from, LocalDate to) {
        if (from == null) from = LocalDate.now().withDayOfMonth(1);
        if (to == null) to = LocalDate.now();

        List<Account> revenueAccounts = accountRepository.findByType("REVENUE");
        List<Account> expenseAccounts = accountRepository.findByType("EXPENSE");

        double totalRevenue = 0;
        double totalExpenses = 0;

        List<Map<String, Object>> revenues = new ArrayList<>();
        for (Account acc : revenueAccounts) {
            double balance = getAccountBalanceBetween(acc.getId(), from, to);
            if (balance != 0) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("accountId", acc.getId());
                item.put("code", acc.getCode());
                item.put("name", acc.getName());
                item.put("amount", balance);
                revenues.add(item);
                totalRevenue += balance;
            }
        }

        List<Map<String, Object>> expenses = new ArrayList<>();
        for (Account acc : expenseAccounts) {
            double balance = getAccountBalanceBetween(acc.getId(), from, to);
            if (balance != 0) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("accountId", acc.getId());
                item.put("code", acc.getCode());
                item.put("name", acc.getName());
                item.put("amount", balance);
                expenses.add(item);
                totalExpenses += balance;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("from", from.toString());
        result.put("to", to.toString());
        result.put("revenues", revenues);
        result.put("totalRevenue", totalRevenue);
        result.put("expenses", expenses);
        result.put("totalExpenses", totalExpenses);
        result.put("netIncome", totalRevenue - totalExpenses);
        return result;
    }

    public Map<String, Object> getBalanceSheet() {
        List<Account> assetAccounts = accountRepository.findByType("ASSET");
        List<Account> liabilityAccounts = accountRepository.findByType("LIABILITY");

        double totalAssets = 0;
        double totalLiabilities = 0;

        List<Map<String, Object>> assets = new ArrayList<>();
        for (Account acc : assetAccounts) {
            if (acc.getBalance() > 0.01 || acc.getBalance() < -0.01) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("accountId", acc.getId());
                item.put("code", acc.getCode());
                item.put("name", acc.getName());
                item.put("balance", Math.max(0, acc.getBalance()));
                assets.add(item);
                totalAssets += Math.max(0, acc.getBalance());
            }
        }

        List<Map<String, Object>> liabilities = new ArrayList<>();
        for (Account acc : liabilityAccounts) {
            double balance = Math.max(0, -acc.getBalance());
            if (balance > 0.01) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("accountId", acc.getId());
                item.put("code", acc.getCode());
                item.put("name", acc.getName());
                item.put("balance", balance);
                liabilities.add(item);
                totalLiabilities += balance;
            }
        }

        List<Account> revenueAccounts = accountRepository.findByType("REVENUE");
        double totalEquity = 0;
        List<Map<String, Object>> equity = new ArrayList<>();
        for (Account acc : revenueAccounts) {
            if (acc.getBalance() > 0.01) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("accountId", acc.getId());
                item.put("code", acc.getCode());
                item.put("name", acc.getName());
                item.put("balance", acc.getBalance());
                equity.add(item);
                totalEquity += acc.getBalance();
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("assets", assets);
        result.put("totalAssets", totalAssets);
        result.put("liabilities", liabilities);
        result.put("totalLiabilities", totalLiabilities);
        result.put("equity", equity);
        result.put("totalEquity", totalEquity);
        result.put("totalLiabilitiesEquity", totalLiabilities + totalEquity);
        return result;
    }

    public List<Map<String, Object>> getGeneralLedger(Long accountId, LocalDate from, LocalDate to) {
        if (from == null) from = LocalDate.now().minusMonths(3);
        if (to == null) to = LocalDate.now().plusDays(1);

        List<JournalEntryLine> lines = journalEntryLineRepository
                .findByAccountIdAndDateBetween(accountId, from, to);

        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account", accountId));

        List<Map<String, Object>> result = new ArrayList<>();
        double runningBalance = 0;
        for (JournalEntryLine line : lines) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("date", line.getEntry().getEntryDate().toString());
            row.put("entryNumber", line.getEntry().getEntryNumber());
            row.put("description", line.getDescription() != null ? line.getDescription() : line.getEntry().getDescription());
            row.put("debit", line.getDebit());
            row.put("credit", line.getCredit());
            runningBalance += line.getDebit() - line.getCredit();
            row.put("balance", runningBalance);
            result.add(row);
        }

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("accountId", account.getId());
        header.put("accountCode", account.getCode());
        header.put("accountName", account.getName());
        header.put("from", from.toString());
        header.put("to", to.toString());
        header.put("openingBalance", account.getBalance() - runningBalance);
        header.put("closingBalance", account.getBalance());
        header.put("lines", result);

        return Collections.singletonList(header);
    }

    private double getAccountBalanceBetween(Long accountId, LocalDate from, LocalDate to) {
        List<JournalEntryLine> lines = journalEntryLineRepository
                .findByAccountIdAndDateBetween(accountId, from, to.atTime(23, 59, 59).toLocalDate());
        return lines.stream().mapToDouble(l -> l.getDebit() - l.getCredit()).sum();
    }

    private String generateEntryNumber(LocalDate date) {
        String datePart = date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = journalEntryRepository.countByEntryDate(date);
        return "JE-" + datePart + "-" + String.format("%05d", count + 1);
    }

    private JournalEntryDTO toJournalEntryDTO(JournalEntry entry) {
        List<JournalEntryLine> lines = journalEntryLineRepository.findByEntryId(entry.getId());
        return JournalEntryDTO.builder()
                .id(entry.getId())
                .entryNumber(entry.getEntryNumber())
                .entryDate(entry.getEntryDate())
                .description(entry.getDescription())
                .referenceType(entry.getReferenceType())
                .referenceId(entry.getReferenceId())
                .status(entry.getStatus())
                .createdAt(entry.getCreatedAt())
                .lines(lines.stream().map(this::toLineDTO).collect(Collectors.toList()))
                .build();
    }

    private JournalEntryLineDTO toLineDTO(JournalEntryLine line) {
        return JournalEntryLineDTO.builder()
                .id(line.getId())
                .entryId(line.getEntry().getId())
                .accountId(line.getAccount().getId())
                .accountCode(line.getAccount().getCode())
                .accountName(line.getAccount().getName())
                .debit(line.getDebit())
                .credit(line.getCredit())
                .description(line.getDescription())
                .build();
    }

    private AccountDTO toAccountDTO(Account account) {
        return AccountDTO.builder()
                .id(account.getId())
                .code(account.getCode())
                .name(account.getName())
                .nameEn(account.getNameEn())
                .type(account.getType())
                .parentId(account.getParent() != null ? account.getParent().getId() : null)
                .parentName(account.getParent() != null ? account.getParent().getName() : null)
                .level(account.getLevel())
                .isSystem(account.getIsSystem())
                .balance(account.getBalance())
                .isActive(account.getIsActive())
                .build();
    }
}
