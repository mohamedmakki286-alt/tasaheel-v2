package com.tasaheel.service;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Year;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class BusinessNumberServiceTest {
    @Test
    void formatsAllSupportedDocumentNumbers() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.queryForObject(anyString(), eq(Long.class), any(), any())).thenReturn(1L, 2L, 3L, 4L);
        BusinessNumberService service = new BusinessNumberService(jdbc);
        int year = Year.now(ZoneId.of("Asia/Riyadh")).getValue();

        assertEquals("REQ-" + year + "-000001", service.next("request"));
        assertEquals("QUO-" + year + "-000002", service.next("quote"));
        assertEquals("RPT-" + year + "-000003", service.next("report"));
        assertEquals("INV-" + year + "-000004", service.next("invoice"));
        assertThrows(IllegalArgumentException.class, () -> service.next("unknown"));
    }
}
