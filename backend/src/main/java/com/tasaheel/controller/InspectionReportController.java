package com.tasaheel.controller;

import com.tasaheel.dto.*;
import com.tasaheel.security.UserDetailsImpl;
import com.tasaheel.service.InspectionReportService;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inspection-reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InspectionReportController {

    private final InspectionReportService inspectionReportService;
    private final MessageSource msg;

    @PostMapping
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<InspectionReportDTO>> createReport(
            @AuthenticationPrincipal UserDetailsImpl user,
            @RequestBody Map<String, Object> body) {
        Long requestId = Long.valueOf(body.get("requestId").toString());
        String notes = (String) body.get("notes");
        String overallCondition = (String) body.get("overallCondition");
        String recommendations = (String) body.get("recommendations");
        String priority = (String) body.get("priority");
        Integer mileage = body.get("mileage") != null ? ((Number) body.get("mileage")).intValue() : null;
        LocalDate nextServiceDate = body.get("nextServiceDate") != null ? LocalDate.parse((String) body.get("nextServiceDate")) : null;
        Integer nextServiceMileage = body.get("nextServiceMileage") != null ? ((Number) body.get("nextServiceMileage")).intValue() : null;
        String status = (String) body.get("status");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> partsData = (List<Map<String, Object>>) body.get("parts");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> laborData = (List<Map<String, Object>>) body.get("laborItems");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> checklistData = (List<Map<String, Object>>) body.get("checklist");

        List<InspectionPartItemDTO> parts = partsData != null ? partsData.stream().map(p ->
                InspectionPartItemDTO.builder()
                        .partName((String) p.get("partName"))
                        .quantity((Integer) p.get("quantity"))
                        .unitPrice(((Number) p.get("unitPrice")).doubleValue())
                        .build()
        ).collect(Collectors.toList()) : List.of();

        List<InspectionLaborItemDTO> laborItems = laborData != null ? laborData.stream().map(l ->
                InspectionLaborItemDTO.builder()
                        .description((String) l.get("description"))
                        .hours(((Number) l.get("hours")).doubleValue())
                        .hourlyRate(((Number) l.get("hourlyRate")).doubleValue())
                        .build()
        ).collect(Collectors.toList()) : List.of();

        List<InspectionChecklistItemDTO> checklist = checklistData != null ? checklistData.stream().map(c ->
                InspectionChecklistItemDTO.builder()
                        .category((String) c.get("category"))
                        .itemName((String) c.get("itemName"))
                        .status((String) c.get("status"))
                        .notes((String) c.get("notes"))
                        .imageUrl((String) c.get("imageUrl"))
                        .sortOrder(c.get("sortOrder") != null ? (Integer) c.get("sortOrder") : null)
                        .build()
        ).collect(Collectors.toList()) : List.of();

        Locale locale = LocaleContextHolder.getLocale();
        InspectionReportDTO report = inspectionReportService.createReport(
                requestId, user.getUserId(), parts, laborItems, checklist,
                notes, overallCondition, recommendations, priority, mileage, nextServiceDate, nextServiceMileage, status);
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("inspection.created", null, locale), report));
    }

    @GetMapping("/{requestId}")
    public ResponseEntity<ApiResponse<InspectionReportDTO>> getReport(
            @AuthenticationPrincipal UserDetailsImpl user, @PathVariable Long requestId) {
        InspectionReportDTO report = inspectionReportService.getReportByRequest(requestId, user);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Void>> approveReport(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id) {
        Locale locale = LocaleContextHolder.getLocale();
        inspectionReportService.approveReport(id, user.getUserId());
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("inspection.approved", null, locale), null));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('WORKSHOP')")
    public ResponseEntity<ApiResponse<InspectionReportDTO>> updateReport(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        String notes = (String) body.get("notes");
        String priority = (String) body.get("priority");
        String status = (String) body.get("status");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> partsData = (List<Map<String, Object>>) body.get("parts");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> laborData = (List<Map<String, Object>>) body.get("laborItems");

        List<InspectionPartItemDTO> parts = partsData != null ? partsData.stream().map(p ->
                InspectionPartItemDTO.builder()
                        .partName((String) p.get("partName"))
                        .quantity((Integer) p.get("quantity"))
                        .unitPrice(((Number) p.get("unitPrice")).doubleValue())
                        .build()
        ).collect(Collectors.toList()) : List.of();

        List<InspectionLaborItemDTO> laborItems = laborData != null ? laborData.stream().map(l ->
                InspectionLaborItemDTO.builder()
                        .description((String) l.get("description"))
                        .hours(((Number) l.get("hours")).doubleValue())
                        .hourlyRate(((Number) l.get("hourlyRate")).doubleValue())
                        .build()
        ).collect(Collectors.toList()) : List.of();

        InspectionReportDTO report = inspectionReportService.updateReport(
                id, user.getUserId(), parts, laborItems, notes, priority, status);
        return ResponseEntity.ok(ApiResponse.success("Report updated", report));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<Void>> rejectReport(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Locale locale = LocaleContextHolder.getLocale();
        inspectionReportService.rejectReport(id, user.getUserId(), body.get("reason"));
        return ResponseEntity.ok(ApiResponse.success(msg.getMessage("inspection.rejected", null, locale), null));
    }
}
