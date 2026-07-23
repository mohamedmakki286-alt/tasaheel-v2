package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionReportDTO {
    private Long id;
    private Long requestId;
    private Long workshopId;
    private String workshopName;
    private String notes;
    private Double totalParts;
    private Double totalLabor;
    private Double tax;
    private Double grandTotal;
    private String overallCondition;
    private String recommendations;
    private String priority;
    private Integer mileage;
    private LocalDate nextServiceDate;
    private Integer nextServiceMileage;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<InspectionPartItemDTO> parts;
    private List<InspectionLaborItemDTO> laborItems;
    private List<InspectionChecklistItemDTO> checklist;
}
