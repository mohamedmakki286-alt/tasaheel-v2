package com.tasaheel.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.time.ZoneId;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BusinessNumberService {
    private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Riyadh");
    private static final Map<String, String> PREFIXES = Map.of(
            "REQUEST", "REQ",
            "QUOTE", "QUO",
            "REPORT", "RPT",
            "INVOICE", "INV"
    );

    private final JdbcTemplate jdbcTemplate;

    public String next(String rawDocumentType) {
        String documentType = rawDocumentType.toUpperCase(Locale.ROOT);
        String prefix = PREFIXES.get(documentType);
        if (prefix == null) throw new IllegalArgumentException("Unsupported document type: " + rawDocumentType);

        int year = Year.now(BUSINESS_ZONE).getValue();
        Long value = jdbcTemplate.queryForObject("""
                INSERT INTO business_number_sequences(document_type, sequence_year, last_value)
                VALUES (?, ?, 1)
                ON CONFLICT (document_type, sequence_year)
                DO UPDATE SET last_value = business_number_sequences.last_value + 1
                RETURNING last_value
                """, Long.class, documentType, year);
        return "%s-%d-%06d".formatted(prefix, year, value);
    }
}

