package com.tasaheel.service;

import com.tasaheel.dto.InspectionChecklistItemDTO;
import com.tasaheel.dto.InspectionLaborItemDTO;
import com.tasaheel.dto.InspectionPartItemDTO;
import com.tasaheel.dto.InspectionReportDTO;
import com.tasaheel.entity.*;
import com.tasaheel.event.EventPublisher;
import com.tasaheel.event.EventType;
import com.tasaheel.exception.BadRequestException;
import com.tasaheel.exception.ResourceNotFoundException;
import com.tasaheel.repository.*;
import com.tasaheel.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InspectionReportService {

    private final InspectionReportRepository inspectionReportRepository;
    private final InspectionPartItemRepository inspectionPartItemRepository;
    private final InspectionLaborItemRepository inspectionLaborItemRepository;
    private final InspectionChecklistItemRepository inspectionChecklistItemRepository;
    private final MaintenanceRequestRepository requestRepository;
    private final WorkshopRepository workshopRepository;
    private final QuoteRepository quoteRepository;
    private final EventPublisher eventPublisher;

    @Transactional
    public InspectionReportDTO createReport(Long requestId, Long workshopId,
                                             List<InspectionPartItemDTO> parts,
                                             List<InspectionLaborItemDTO> laborItems,
                                             List<InspectionChecklistItemDTO> checklist,
                                             String notes,
                                             String overallCondition,
                                             String recommendations,
                                             String priority,
                                             Integer mileage,
                                             LocalDate nextServiceDate,
                                             Integer nextServiceMileage,
                                             String status) {
        MaintenanceRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request", requestId));
        Workshop workshop = workshopRepository.findById(workshopId)
                .orElseThrow(() -> new ResourceNotFoundException("Workshop", workshopId));

        boolean workshopHasAcceptedQuote = quoteRepository.findByRequestIdAndStatus(requestId, "accepted")
                .map(quote -> quote.getWorkshop().getId().equals(workshopId))
                .orElse(false);
        if (!workshopHasAcceptedQuote) {
            throw new BadRequestException("Only the selected workshop can create the inspection report");
        }

        if (!request.getStatus().equals("accepted") && !request.getStatus().equals("customer_approved") && !request.getStatus().equals("in_progress") && !request.getStatus().equals("inspection_report")) {
            throw new BadRequestException("Request must be in accepted/customer_approved/in_progress/inspection_report status to create inspection report");
        }

        double totalParts = parts != null ? parts.stream()
                .mapToDouble(p -> p.getQuantity() * p.getUnitPrice()).sum() : 0.0;
        double totalLabor = laborItems != null ? laborItems.stream()
                .mapToDouble(l -> l.getHours() * l.getHourlyRate()).sum() : 0.0;
        double subtotal = totalParts + totalLabor;
        double tax = subtotal * 0.15;
        double grandTotal = subtotal + tax;

        InspectionReport report = InspectionReport.builder()
                .request(request)
                .workshop(workshop)
                .notes(notes)
                .totalParts(totalParts)
                .totalLabor(totalLabor)
                .tax(tax)
                .grandTotal(grandTotal)
                .overallCondition(overallCondition)
                .recommendations(recommendations)
                .priority(priority)
                .mileage(mileage)
                .nextServiceDate(nextServiceDate)
                .nextServiceMileage(nextServiceMileage)
                .status(status != null ? status : "pending_approval")
                .build();

        report = inspectionReportRepository.save(report);

        InspectionReport finalReport = report;

        if (parts != null) {
            for (InspectionPartItemDTO p : parts) {
                double partTotal = p.getQuantity() * p.getUnitPrice();
                InspectionPartItem partItem = InspectionPartItem.builder()
                        .report(finalReport)
                        .partName(p.getPartName())
                        .quantity(p.getQuantity())
                        .unitPrice(p.getUnitPrice())
                        .total(partTotal)
                        .build();
                inspectionPartItemRepository.save(partItem);
            }
        }

        if (laborItems != null) {
            for (InspectionLaborItemDTO l : laborItems) {
                double laborTotal = l.getHours() * l.getHourlyRate();
                InspectionLaborItem laborItem = InspectionLaborItem.builder()
                        .report(finalReport)
                        .description(l.getDescription())
                        .hours(l.getHours())
                        .hourlyRate(l.getHourlyRate())
                        .total(laborTotal)
                        .build();
                inspectionLaborItemRepository.save(laborItem);
            }
        }

        if (checklist != null) {
            for (int i = 0; i < checklist.size(); i++) {
                InspectionChecklistItemDTO c = checklist.get(i);
                InspectionChecklistItem item = InspectionChecklistItem.builder()
                        .report(finalReport)
                        .category(c.getCategory())
                        .itemName(c.getItemName())
                        .status(c.getStatus())
                        .notes(c.getNotes())
                        .imageUrl(c.getImageUrl())
                        .sortOrder(c.getSortOrder() != null ? c.getSortOrder() : i)
                        .build();
                inspectionChecklistItemRepository.save(item);
            }
        }

        if (status == null || !"draft".equals(status)) {
            request.setStatus("inspection_report");
            requestRepository.save(request);
            eventPublisher.publish(this, EventType.REPORT_SUBMITTED, requestId, "workshop", workshopId);
        }

        return getReport(report.getId());
    }

    public InspectionReportDTO getReport(Long reportId) {
        InspectionReport report = inspectionReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("InspectionReport", reportId));

        return toReportDTO(report);
    }

    public InspectionReportDTO getReportByRequest(Long requestId, UserDetailsImpl user) {
        InspectionReport report = inspectionReportRepository.findTopByRequestIdOrderByCreatedAtDesc(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("InspectionReport for request", requestId));
        String role = user.getRole().toLowerCase();
        boolean permitted = "admin".equals(role)
                || ("customer".equals(role) && report.getRequest().getCustomer().getId().equals(user.getUserId()))
                || ("workshop".equals(role) && report.getWorkshop().getId().equals(user.getUserId()));
        if (!permitted) throw new BadRequestException("You are not allowed to view this report");
        return toReportDTO(report);
    }

    @Transactional
    public InspectionReportDTO updateReport(Long reportId, Long workshopId,
                                             List<InspectionPartItemDTO> parts,
                                             List<InspectionLaborItemDTO> laborItems,
                                             String notes,
                                             String priority,
                                             String status) {
        InspectionReport report = inspectionReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("InspectionReport", reportId));

        if (!report.getWorkshop().getId().equals(workshopId)) {
            throw new BadRequestException("You can only update your own reports");
        }

        if ("approved".equals(report.getStatus()) || "rejected".equals(report.getStatus())) {
            throw new BadRequestException("Cannot edit approved or rejected reports");
        }

        double totalParts = parts != null ? parts.stream()
                .mapToDouble(p -> p.getQuantity() * p.getUnitPrice()).sum() : 0.0;
        double totalLabor = laborItems != null ? laborItems.stream()
                .mapToDouble(l -> l.getHours() * l.getHourlyRate()).sum() : 0.0;
        double subtotal = totalParts + totalLabor;
        double tax = subtotal * 0.15;
        double grandTotal = subtotal + tax;

        report.setNotes(notes);
        report.setPriority(priority);
        report.setTotalParts(totalParts);
        report.setTotalLabor(totalLabor);
        report.setTax(tax);
        report.setGrandTotal(grandTotal);

        if (status != null && ("draft".equals(status) || "pending_approval".equals(status))) {
            report.setStatus(status);
        }

        report = inspectionReportRepository.save(report);

        InspectionReport finalReport = report;

        inspectionPartItemRepository.deleteByReportId(reportId);
        inspectionLaborItemRepository.deleteByReportId(reportId);

        if (parts != null) {
            for (InspectionPartItemDTO p : parts) {
                double partTotal = p.getQuantity() * p.getUnitPrice();
                InspectionPartItem partItem = InspectionPartItem.builder()
                        .report(finalReport)
                        .partName(p.getPartName())
                        .quantity(p.getQuantity())
                        .unitPrice(p.getUnitPrice())
                        .total(partTotal)
                        .build();
                inspectionPartItemRepository.save(partItem);
            }
        }

        if (laborItems != null) {
            for (InspectionLaborItemDTO l : laborItems) {
                double laborTotal = l.getHours() * l.getHourlyRate();
                InspectionLaborItem laborItem = InspectionLaborItem.builder()
                        .report(finalReport)
                        .description(l.getDescription())
                        .hours(l.getHours())
                        .hourlyRate(l.getHourlyRate())
                        .total(laborTotal)
                        .build();
                inspectionLaborItemRepository.save(laborItem);
            }
        }

        if (status != null && !"draft".equals(status)) {
            MaintenanceRequest request = report.getRequest();
            request.setStatus("inspection_report");
            requestRepository.save(request);
            eventPublisher.publish(this, EventType.REPORT_SUBMITTED, request.getId(), "workshop", workshopId);
        }

        return getReport(report.getId());
    }

    @Transactional
    public void approveReport(Long reportId, Long customerId) {
        InspectionReport report = inspectionReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("InspectionReport", reportId));

        if (!report.getRequest().getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("You are not the customer for this report");
        }

        if (!report.getStatus().equals("pending_approval")) {
            throw new BadRequestException("Report is not pending approval");
        }

        report.setStatus("approved");
        inspectionReportRepository.save(report);

        MaintenanceRequest request = report.getRequest();
        request.setStatus("customer_approved");
        requestRepository.save(request);
    }

    @Transactional
    public void rejectReport(Long reportId, Long customerId, String reason) {
        InspectionReport report = inspectionReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("InspectionReport", reportId));

        if (!report.getStatus().equals("pending_approval")) {
            throw new BadRequestException("Report is not pending approval");
        }

        report.setStatus("rejected");
        report.setNotes(reason);
        inspectionReportRepository.save(report);

        eventPublisher.publish(this, EventType.REPORT_REJECTED, report.getRequest().getId(), "customer", customerId);
    }

    private InspectionReportDTO toReportDTO(InspectionReport report) {
        List<InspectionPartItemDTO> parts = inspectionPartItemRepository.findByReportId(report.getId()).stream()
                .map(p -> InspectionPartItemDTO.builder()
                        .id(p.getId())
                        .reportId(p.getReport().getId())
                        .partName(p.getPartName())
                        .quantity(p.getQuantity())
                        .unitPrice(p.getUnitPrice())
                        .total(p.getTotal())
                        .build())
                .collect(Collectors.toList());

        List<InspectionLaborItemDTO> labor = inspectionLaborItemRepository.findByReportId(report.getId()).stream()
                .map(l -> InspectionLaborItemDTO.builder()
                        .id(l.getId())
                        .reportId(l.getReport().getId())
                        .description(l.getDescription())
                        .hours(l.getHours())
                        .hourlyRate(l.getHourlyRate())
                        .total(l.getTotal())
                        .build())
                .collect(Collectors.toList());

        List<InspectionChecklistItemDTO> checklist = inspectionChecklistItemRepository
                .findByReportIdOrderBySortOrderAsc(report.getId()).stream()
                .map(c -> InspectionChecklistItemDTO.builder()
                        .id(c.getId())
                        .reportId(c.getReport().getId())
                        .category(c.getCategory())
                        .itemName(c.getItemName())
                        .status(c.getStatus())
                        .notes(c.getNotes())
                        .imageUrl(c.getImageUrl())
                        .sortOrder(c.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        return InspectionReportDTO.builder()
                .id(report.getId())
                .requestId(report.getRequest().getId())
                .workshopId(report.getWorkshop().getId())
                .workshopName(report.getWorkshop().getName())
                .notes(report.getNotes())
                .totalParts(report.getTotalParts())
                .totalLabor(report.getTotalLabor())
                .tax(report.getTax())
                .grandTotal(report.getGrandTotal())
                .overallCondition(report.getOverallCondition())
                .recommendations(report.getRecommendations())
                .priority(report.getPriority())
                .mileage(report.getMileage())
                .nextServiceDate(report.getNextServiceDate())
                .nextServiceMileage(report.getNextServiceMileage())
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .parts(parts)
                .laborItems(labor)
                .checklist(checklist)
                .build();
    }
}
