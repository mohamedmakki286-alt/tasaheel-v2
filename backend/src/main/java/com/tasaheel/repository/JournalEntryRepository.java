package com.tasaheel.repository;

import com.tasaheel.entity.JournalEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {
    @Query("SELECT COUNT(e) FROM JournalEntry e WHERE e.entryDate = ?1")
    long countByEntryDate(LocalDate date);

    Page<JournalEntry> findByEntryDateBetweenOrderByEntryDateDesc(LocalDate from, LocalDate to, Pageable pageable);

    @Query("SELECT e FROM JournalEntry e WHERE e.referenceType = ?1 AND e.referenceId = ?2")
    java.util.List<JournalEntry> findByReference(String referenceType, Long referenceId);
}
