package com.tasaheel.repository;

import com.tasaheel.entity.JournalEntryLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface JournalEntryLineRepository extends JpaRepository<JournalEntryLine, Long> {
    List<JournalEntryLine> findByEntryId(Long entryId);

    @Query("SELECT l FROM JournalEntryLine l JOIN FETCH l.entry e WHERE l.account.id = ?1 AND e.entryDate BETWEEN ?2 AND ?3 ORDER BY e.entryDate ASC")
    List<JournalEntryLine> findByAccountIdAndDateBetween(Long accountId, LocalDate from, LocalDate to);

    @Query("SELECT SUM(l.debit) FROM JournalEntryLine l WHERE l.account.id = ?1")
    Double sumDebitByAccountId(Long accountId);

    @Query("SELECT SUM(l.credit) FROM JournalEntryLine l WHERE l.account.id = ?1")
    Double sumCreditByAccountId(Long accountId);
}
