package com.tasaheel.controller;

import com.tasaheel.dto.ApiResponse;
import com.tasaheel.service.TestDataResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/test-data")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class TestDataResetController {

    private final TestDataResetService resetService;

    @Value("${ALLOW_TEST_DATA_RESET:false}")
    private boolean allowReset;

    @GetMapping("/resolve-ids")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resolveIds() {
        return ResponseEntity.ok(ApiResponse.success(resetService.resolveIds()));
    }

    @GetMapping("/dry-run")
    public ResponseEntity<ApiResponse<Map<String, Object>>> dryRun() {
        if (!allowReset) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ALLOW_TEST_DATA_RESET is not enabled on this environment"));
        }
        Map<String, Object> ids = resetService.resolveIds();
        @SuppressWarnings("unchecked")
        List<Long> customerIds = (List<Long>) ids.get("customerIds");
        @SuppressWarnings("unchecked")
        List<Long> workshopIds = (List<Long>) ids.get("workshopIds");

        var counts = resetService.countOperationalData(customerIds, workshopIds);
        long total = counts.stream().mapToLong(c -> c.count()).sum();

        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("customerIds", customerIds);
        result.put("workshopIds", workshopIds);
        result.put("tableCounts", counts);
        result.put("totalRecordsToDelete", total);
        result.put("confirmText", TestDataResetService.CONFIRM_TEXT);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/execute")
    public ResponseEntity<ApiResponse<TestDataResetService.ResetReport>> execute(
            @RequestBody Map<String, Object> body) {
        if (!allowReset) {
            return ResponseEntity.badRequest().body(ApiResponse.error("ALLOW_TEST_DATA_RESET is not enabled on this environment"));
        }

        String confirmText = (String) body.get("confirmText");
        if (!TestDataResetService.CONFIRM_TEXT.equals(confirmText)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid confirmText. Expected: " + TestDataResetService.CONFIRM_TEXT));
        }

        boolean dryRun = Boolean.TRUE.equals(body.get("dryRun"));
        boolean resetProfileData = Boolean.TRUE.equals(body.get("resetCustomerProfileData"));

        TestDataResetService.ResetReport report = resetService.execute(dryRun, resetProfileData);
        String msg = dryRun ? "DRY_RUN completed" : "Test data reset completed";
        return ResponseEntity.ok(ApiResponse.success(msg, report));
    }
}
