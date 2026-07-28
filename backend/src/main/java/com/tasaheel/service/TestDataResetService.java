package com.tasaheel.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tasaheel.entity.TestDataResetAuditLog;
import com.tasaheel.integration.MediaStorageService;
import com.tasaheel.repository.TestDataResetAuditLogRepository;
import com.tasaheel.security.UserDetailsImpl;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TestDataResetService {

    @PersistenceContext
    private final EntityManager em;
    private final TestDataResetAuditLogRepository auditLogRepository;
    private final MediaStorageService storageService;

    public static final String CONFIRM_TEXT = "RESET_TASAHEEL_TEST_DATA";

    public record TableCount(String tableName, long count) {}
    public record ResetReport(
        List<Long> customerIds,
        List<Long> workshopIds,
        List<TableCount> countsBefore,
        long totalDeleted,
        List<String> filesDeleted,
        boolean dryRun
    ) {}

    public Map<String, Object> resolveIds() {
        List<Long> customerIds = em.createNativeQuery("SELECT id FROM customers ORDER BY id", Long.class).getResultList();
        List<Long> workshopIds = em.createNativeQuery("SELECT id FROM workshops ORDER BY id", Long.class).getResultList();
        List<Long> technicianIds = em.createNativeQuery("SELECT id FROM technicians ORDER BY id", Long.class).getResultList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("customerIds", customerIds);
        result.put("workshopIds", workshopIds);
        result.put("technicianIds", technicianIds);
        return result;
    }

    public Map<String, Object> resolveUsers() {
        List<Map<String, Object>> customers = new ArrayList<>();
        List<Object[]> customerRows = em.createNativeQuery(
            "SELECT id, name, email, phone FROM customers ORDER BY id")
            .getResultList();
        for (Object[] row : customerRows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", row[0]);
            m.put("name", row[1]);
            m.put("email", row[2]);
            m.put("phone", row[3]);
            customers.add(m);
        }

        List<Map<String, Object>> workshops = new ArrayList<>();
        List<Object[]> workshopRows = em.createNativeQuery(
            "SELECT id, name, email, phone FROM workshops ORDER BY id")
            .getResultList();
        for (Object[] row : workshopRows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", row[0]);
            m.put("name", row[1]);
            m.put("email", row[2]);
            m.put("phone", row[3]);
            workshops.add(m);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("customers", customers);
        result.put("workshops", workshops);
        return result;
    }

    public List<TestDataResetAuditLog> getAuditLogs() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<TableCount> countOperationalData(List<Long> customerIds, List<Long> workshopIds) {
        List<TableCount> counts = new ArrayList<>();
        String cj = joinIds(customerIds);
        String wj = joinIds(workshopIds);
        String rids = "SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")";

        counts.add(new TableCount("chat_attachments", count("SELECT COUNT(*) FROM chat_attachments WHERE message_id IN (SELECT id FROM chat_messages WHERE room_id IN (SELECT id FROM chat_rooms WHERE customer_id IN (" + cj + ") OR workshop_id IN (" + wj + ")))")));

        // NOTE: service_images, service_pricing, workshop_service_listings, workshop_services are workshop config — PRESERVED (not counted for deletion)

        counts.add(new TableCount("invoice_items", count("SELECT COUNT(*) FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_id IN (" + cj + ") OR workshop_id IN (" + wj + "))")));
        counts.add(new TableCount("sub_order_items", count("SELECT COUNT(*) FROM sub_order_items WHERE sub_order_id IN (SELECT id FROM sub_orders WHERE request_id IN (" + rids + ") OR workshop_id IN (" + wj + "))")));

        counts.add(new TableCount("chat_messages", count("SELECT COUNT(*) FROM chat_messages WHERE room_id IN (SELECT id FROM chat_rooms WHERE customer_id IN (" + cj + ") OR workshop_id IN (" + wj + "))")));
        counts.add(new TableCount("chat_rooms", count("SELECT COUNT(*) FROM chat_rooms WHERE customer_id IN (" + cj + ") OR workshop_id IN (" + wj + ")")));

        counts.add(new TableCount("inspection_checklist_items", count("SELECT COUNT(*) FROM inspection_checklist_items WHERE report_id IN (SELECT id FROM inspection_reports WHERE request_id IN (" + rids + ") OR workshop_id IN (" + wj + "))")));
        counts.add(new TableCount("inspection_part_items", count("SELECT COUNT(*) FROM inspection_part_items WHERE report_id IN (SELECT id FROM inspection_reports WHERE request_id IN (" + rids + ") OR workshop_id IN (" + wj + "))")));
        counts.add(new TableCount("inspection_labor_items", count("SELECT COUNT(*) FROM inspection_labor_items WHERE report_id IN (SELECT id FROM inspection_reports WHERE request_id IN (" + rids + ") OR workshop_id IN (" + wj + "))")));
        counts.add(new TableCount("inspection_reports", count("SELECT COUNT(*) FROM inspection_reports WHERE request_id IN (" + rids + ") OR workshop_id IN (" + wj + ")")));

        counts.add(new TableCount("request_service_types", count("SELECT COUNT(*) FROM request_service_types WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))")));
        counts.add(new TableCount("request_status_history", count("SELECT COUNT(*) FROM request_status_history WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))")));
        counts.add(new TableCount("request_workshop_dispatches", count("SELECT COUNT(*) FROM request_workshop_dispatches WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")) OR workshop_id IN (" + wj + ")")));
        counts.add(new TableCount("home_service_assignments", count("SELECT COUNT(*) FROM home_service_assignments WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")) OR workshop_id IN (" + wj + ")")));
        counts.add(new TableCount("service_items", count("SELECT COUNT(*) FROM service_items WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")) OR workshop_id IN (" + wj + ")")));
        counts.add(new TableCount("quotes", count("SELECT COUNT(*) FROM quotes WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")) OR workshop_id IN (" + wj + ")")));
        counts.add(new TableCount("sub_orders", count("SELECT COUNT(*) FROM sub_orders WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")) OR workshop_id IN (" + wj + ")")));
        counts.add(new TableCount("media", count("SELECT COUNT(*) FROM media WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))")));
        counts.add(new TableCount("transport_requests", count("SELECT COUNT(*) FROM transport_requests WHERE customer_id IN (" + cj + ") OR request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))")));
        counts.add(new TableCount("payments", count("SELECT COUNT(*) FROM payments WHERE customer_id IN (" + cj + ") OR request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))")));
        counts.add(new TableCount("payment_holds", count("SELECT COUNT(*) FROM payment_holds WHERE customer_id IN (" + cj + ") OR workshop_id IN (" + wj + ") OR request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))")));
        counts.add(new TableCount("reviews", count("SELECT COUNT(*) FROM reviews WHERE customer_id IN (" + cj + ") OR workshop_id IN (" + wj + ") OR request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))")));

        counts.add(new TableCount("workshop_settlements", count("SELECT COUNT(*) FROM workshop_settlements WHERE workshop_id IN (" + wj + ")")));
        counts.add(new TableCount("journal_entry_lines", count("SELECT COUNT(*) FROM journal_entry_lines WHERE entry_id IN (SELECT id FROM journal_entries WHERE reference_type = 'SETTLEMENT' AND reference_id IN (SELECT id FROM workshop_settlements WHERE workshop_id IN (" + wj + ")))")));
        counts.add(new TableCount("journal_entries", count("SELECT COUNT(*) FROM journal_entries WHERE reference_type = 'SETTLEMENT' AND reference_id IN (SELECT id FROM workshop_settlements WHERE workshop_id IN (" + wj + "))")));

        counts.add(new TableCount("maintenance_requests", count("SELECT COUNT(*) FROM maintenance_requests WHERE customer_id IN (" + cj + ")")));

        counts.add(new TableCount("call_sessions", count("SELECT COUNT(*) FROM call_sessions WHERE caller_id IN (" + cj + "," + wj + ") OR callee_id IN (" + cj + "," + wj + ")")));
        counts.add(new TableCount("notifications", count("SELECT COUNT(*) FROM notifications WHERE (user_role = 'customer' AND user_id IN (" + cj + ")) OR (user_role = 'workshop' AND user_id IN (" + wj + ")) OR request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))")));
        counts.add(new TableCount("service_audit_log", count("SELECT COUNT(*) FROM service_audit_log WHERE workshop_id IN (" + wj + ")")));

        return counts;
    }

    @Transactional
    public ResetReport execute(boolean dryRun, boolean resetProfileData) {
        List<Long> customerIds = em.createNativeQuery("SELECT id FROM customers ORDER BY id", Long.class).getResultList();
        List<Long> workshopIds = em.createNativeQuery("SELECT id FROM workshops ORDER BY id", Long.class).getResultList();
        List<Long> technicianIds = em.createNativeQuery("SELECT id FROM technicians ORDER BY id", Long.class).getResultList();

        log.info("TestDataReset: customers={}, workshops={}, technicians={}", customerIds, workshopIds);

        List<TableCount> countsBefore = countOperationalData(customerIds, workshopIds);
        long totalBefore = countsBefore.stream().mapToLong(TableCount::count).sum();

        if (dryRun) {
            return new ResetReport(customerIds, workshopIds, countsBefore, totalBefore, List.of(), true);
        }

        String cj = joinIds(customerIds);
        String wj = joinIds(workshopIds);
        String rids = "SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")";
        List<String> filesToDelete = new ArrayList<>();

        log.info("TestDataReset: Starting deletion of {} records", totalBefore);

        // ── Tier 1: Deepest descendants ──
        collectFileUrls("chat_attachments", "file_url", "message_id IN (SELECT id FROM chat_messages WHERE room_id IN (SELECT id FROM chat_rooms WHERE customer_id IN (" + cj + ") OR workshop_id IN (" + wj + ")))", filesToDelete);
        executeDelete("DELETE FROM chat_attachments WHERE message_id IN (SELECT id FROM chat_messages WHERE room_id IN (SELECT id FROM chat_rooms WHERE customer_id IN (" + cj + ") OR workshop_id IN (" + wj + ")))");

        // NOTE: service_images, service_pricing, workshop_service_listings, workshop_services are workshop config — PRESERVED

        executeDelete("DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE customer_id IN (" + cj + ") OR workshop_id IN (" + wj + "))");
        executeDelete("DELETE FROM sub_order_items WHERE sub_order_id IN (SELECT id FROM sub_orders WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")) OR workshop_id IN (" + wj + "))");

        // ── Tier 2: Chat ──
        executeDelete("DELETE FROM chat_messages WHERE room_id IN (SELECT id FROM chat_rooms WHERE customer_id IN (" + cj + ") OR workshop_id IN (" + wj + "))");
        executeDelete("DELETE FROM chat_rooms WHERE customer_id IN (" + cj + ") OR workshop_id IN (" + wj + ")");

        // ── Tier 2: Inspection sub-items (inspection_reports has no customer_id, uses request_id → maintenance_requests) ──
        executeDelete("DELETE FROM inspection_checklist_items WHERE report_id IN (SELECT id FROM inspection_reports WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")) OR workshop_id IN (" + wj + "))");
        executeDelete("DELETE FROM inspection_part_items WHERE report_id IN (SELECT id FROM inspection_reports WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")) OR workshop_id IN (" + wj + "))");
        executeDelete("DELETE FROM inspection_labor_items WHERE report_id IN (SELECT id FROM inspection_reports WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")) OR workshop_id IN (" + wj + "))");
        executeDelete("DELETE FROM inspection_reports WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")) OR workshop_id IN (" + wj + ")");

        // ── Tier 2: Request sub-tables ──
        executeDelete("DELETE FROM request_service_types WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))");
        executeDelete("DELETE FROM request_status_history WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))");
        executeDelete("DELETE FROM request_workshop_dispatches WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")) OR workshop_id IN (" + wj + ")");
        executeDelete("DELETE FROM home_service_assignments WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")) OR workshop_id IN (" + wj + ")");
        executeDelete("DELETE FROM service_items WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")) OR workshop_id IN (" + wj + ")");
        executeDelete("DELETE FROM quotes WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")) OR workshop_id IN (" + wj + ")");
        executeDelete("DELETE FROM sub_orders WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + ")) OR workshop_id IN (" + wj + ")");

        // ── Tier 2: Media files ──
        collectFileUrls("media", "url", "request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))", filesToDelete);
        collectThumbnailUrls("media", "thumbnail_url", "request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))", filesToDelete);
        executeDelete("DELETE FROM media WHERE request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))");

        // ── Tier 2: Transport ──
        executeDelete("DELETE FROM transport_requests WHERE customer_id IN (" + cj + ") OR request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))");

        // ── Tier 2: Payments ──
        executeDelete("DELETE FROM payments WHERE customer_id IN (" + cj + ") OR request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))");
        executeDelete("DELETE FROM payment_holds WHERE customer_id IN (" + cj + ") OR workshop_id IN (" + wj + ") OR request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))");

        // ── Tier 2: Reviews ──
        executeDelete("DELETE FROM reviews WHERE customer_id IN (" + cj + ") OR workshop_id IN (" + wj + ") OR request_id IN (SELECT id FROM maintenance_requests WHERE customer_id IN (" + cj + "))");

        // ── Tier 2: Settlements & Accounting ──
        executeDelete("DELETE FROM journal_entry_lines WHERE entry_id IN (SELECT id FROM journal_entries WHERE reference_type = 'SETTLEMENT' AND reference_id IN (SELECT id FROM workshop_settlements WHERE workshop_id IN (" + wj + ")))");
        executeDelete("DELETE FROM journal_entries WHERE reference_type = 'SETTLEMENT' AND reference_id IN (SELECT id FROM workshop_settlements WHERE workshop_id IN (" + wj + "))");
        executeDelete("DELETE FROM workshop_settlements WHERE workshop_id IN (" + wj + ")");

        // ── Tier 2: Invoices (after settlements reference is cleared) ──
        executeDelete("DELETE FROM invoices WHERE customer_id IN (" + cj + ") OR workshop_id IN (" + wj + ")");

        // ── Tier 3: Maintenance Requests ──
        executeDelete("DELETE FROM maintenance_requests WHERE customer_id IN (" + cj + ")");

        // ── Tier 4: Notifications & Calls ──
        executeDelete("DELETE FROM call_sessions WHERE caller_id IN (" + cj + "," + wj + ") OR callee_id IN (" + cj + "," + wj + ")");
        executeDelete("DELETE FROM notifications WHERE (user_role = 'customer' AND user_id IN (" + cj + ")) OR (user_role = 'workshop' AND user_id IN (" + wj + ")) OR (request_id IS NOT NULL)");
        executeDelete("DELETE FROM service_audit_log WHERE workshop_id IN (" + wj + ")");

        // ── Optionally reset customer profile data ──
        if (resetProfileData) {
            executeDelete("DELETE FROM customer_cars WHERE customer_id IN (" + cj + ")");
            log.info("TestDataReset: Deleted customer_cars for customers {}", customerIds);
        }

        // ── Clean up local files ──
        List<String> actuallyDeleted = deleteFilesFromDisk(filesToDelete);

        em.flush();

        List<TableCount> countsAfter = countOperationalData(customerIds, workshopIds);
        long totalAfter = countsAfter.stream().mapToLong(TableCount::count).sum();

        log.info("TestDataReset: Completed. Deleted {} records, {} files. Remaining operational: {}", totalBefore, actuallyDeleted.size(), totalAfter);

        return new ResetReport(customerIds, workshopIds, countsBefore, totalBefore, actuallyDeleted, false);
    }

    private long count(String sql) {
        try {
            Object result = em.createNativeQuery(sql).getSingleResult();
            return result instanceof Number ? ((Number) result).longValue() : 0L;
        } catch (Exception e) {
            log.warn("Count failed for: {} - {}", sql.substring(0, Math.min(80, sql.length())), e.getMessage());
            return 0L;
        }
    }

    private int executeDelete(String sql) {
        try {
            int deleted = em.createNativeQuery(sql).executeUpdate();
            if (deleted > 0) {
                log.debug("Deleted {} rows: {}", deleted, sql.substring(0, Math.min(80, sql.length())));
            }
            return deleted;
        } catch (Exception e) {
            log.error("Delete failed: {} - {}", sql.substring(0, Math.min(80, sql.length())), e.getMessage());
            throw e;
        }
    }

    private void collectFileUrls(String table, String column, String whereClause, List<String> urls) {
        try {
            List<String> results = em.createNativeQuery(
                "SELECT " + column + " FROM " + table + " WHERE " + whereClause + " AND " + column + " IS NOT NULL"
            ).getResultList();
            urls.addAll(results);
        } catch (Exception e) {
            log.warn("Failed to collect file URLs from {}.{}", table, column);
        }
    }

    private void collectThumbnailUrls(String table, String column, String whereClause, List<String> urls) {
        try {
            List<String> results = em.createNativeQuery(
                "SELECT " + column + " FROM " + table + " WHERE " + whereClause + " AND " + column + " IS NOT NULL"
            ).getResultList();
            urls.addAll(results);
        } catch (Exception e) {
            log.warn("Failed to collect thumbnail URLs from {}.{}", table, column);
        }
    }

    private List<String> deleteFilesFromDisk(List<String> urls) {
        List<String> deleted = new ArrayList<>();
        for (String url : urls) {
            if (url == null || url.isBlank()) continue;
            try {
                String storageKey = storageService.keyFromUrl(url);
                if (storageKey.isBlank()) continue;
                storageService.delete(storageKey);
                deleted.add(storageKey);
            } catch (RuntimeException e) {
                log.warn("Failed to delete file: {}", url);
            }
        }
        return deleted;
    }

    private String joinIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return "0";
        return ids.stream().map(String::valueOf).reduce((a, b) -> a + "," + b).orElse("0");
    }

    public TestDataResetAuditLog saveAuditLog(UserDetailsImpl admin, ResetReport report, String result) {
        List<Map<String, Object>> tablesAffected = report.countsBefore().stream()
            .filter(c -> c.count() > 0)
            .map(c -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("table", c.tableName());
                m.put("count", c.count());
                return m;
            }).toList();

        String customerIdsStr = report.customerIds() != null ? report.customerIds().toString() : "[]";
        String workshopIdsStr = report.workshopIds() != null ? report.workshopIds().toString() : "[]";
        String tablesAffectedStr = tablesAffected.toString();
        String filesDeletedStr = report.filesDeleted() != null ? report.filesDeleted().toString() : "[]";

        TestDataResetAuditLog log = TestDataResetAuditLog.builder()
            .adminUserId(admin.getUserId())
            .adminUserName(admin.getUsername())
            .customerIds(customerIdsStr)
            .workshopIds(workshopIdsStr)
            .totalRecordsDeleted(report.totalDeleted())
            .tablesAffected(tablesAffectedStr)
            .filesDeleted(filesDeletedStr)
            .result(result)
            .build();

        return auditLogRepository.save(log);
    }
}
