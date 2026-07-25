package com.tasaheel.controller;

import com.tasaheel.dto.ApiResponse;
import com.tasaheel.entity.TestDataResetAuditLog;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.TestDataResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/test-data-reset")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class TestDataResetV2Controller {

    private final TestDataResetService resetService;

    @Value("${ALLOW_TEST_DATA_RESET:false}")
    private boolean allowReset;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUsers() {
        if (!allowReset) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ALLOW_TEST_DATA_RESET is not enabled on this environment"));
        }
        return ResponseEntity.ok(ApiResponse.success(resetService.resolveUsers()));
    }

    @PostMapping("/preview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> preview(@RequestBody Map<String, Object> body) {
        if (!allowReset) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ALLOW_TEST_DATA_RESET is not enabled on this environment"));
        }

        @SuppressWarnings("unchecked")
        List<Long> customerIds = body.get("customerIds") != null
            ? ((List<Number>) body.get("customerIds")).stream().map(Number::longValue).toList()
            : null;
        @SuppressWarnings("unchecked")
        List<Long> workshopIds = body.get("workshopIds") != null
            ? ((List<Number>) body.get("workshopIds")).stream().map(Number::longValue).toList()
            : null;

        if (customerIds == null || customerIds.isEmpty()) {
            Map<String, Object> ids = resetService.resolveIds();
            if (customerIds == null || customerIds.isEmpty()) {
                @SuppressWarnings("unchecked")
                List<Long> allCustomers = (List<Long>) ids.get("customerIds");
                customerIds = allCustomers;
            }
            if (workshopIds == null || workshopIds.isEmpty()) {
                @SuppressWarnings("unchecked")
                List<Long> allWorkshops = (List<Long>) ids.get("workshopIds");
                workshopIds = allWorkshops;
            }
        }

        var counts = resetService.countOperationalData(customerIds, workshopIds);
        long total = counts.stream().mapToLong(c -> c.count()).sum();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("customerIds", customerIds);
        result.put("workshopIds", workshopIds);
        result.put("tableCounts", counts);
        result.put("totalRecordsToDelete", total);
        result.put("confirmText", TestDataResetService.CONFIRM_TEXT);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/execute")
    public ResponseEntity<ApiResponse<TestDataResetService.ResetReport>> execute(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UserDetailsImpl admin) {
        if (!allowReset) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ALLOW_TEST_DATA_RESET is not enabled on this environment"));
        }

        String confirmText = (String) body.get("confirmText");
        if (!TestDataResetService.CONFIRM_TEXT.equals(confirmText)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid confirmText. Expected: " + TestDataResetService.CONFIRM_TEXT));
        }

        boolean dryRun = Boolean.TRUE.equals(body.get("dryRun"));

        TestDataResetService.ResetReport report = resetService.execute(dryRun, false);

        String resultStatus = dryRun ? "DRY_RUN" : "SUCCESS";
        resetService.saveAuditLog(admin, report, resultStatus);

        String msg = dryRun ? "DRY_RUN completed" : "Test data reset completed";
        return ResponseEntity.ok(ApiResponse.success(msg, report));
    }

    @GetMapping("/audit-log")
    public ResponseEntity<ApiResponse<List<TestDataResetAuditLog>>> getAuditLog() {
        if (!allowReset) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ALLOW_TEST_DATA_RESET is not enabled on this environment"));
        }
        return ResponseEntity.ok(ApiResponse.success(resetService.getAuditLogs()));
    }
}
