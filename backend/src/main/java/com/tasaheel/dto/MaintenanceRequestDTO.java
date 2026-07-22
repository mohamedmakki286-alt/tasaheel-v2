package com.tasaheel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MaintenanceRequestDTO {
    private Long id;
    private Long customerId;
    private String customerName;
    private String customerPhone;
    private Long carId;
    private String carMake;
    private String carModel;
    private Integer carYear;
    private String carPlateNumber;
    private String carColor;
    private Integer carMileage;
    private Long serviceTypeId;
    private String serviceTypeName;
    private String serviceTypeNameEn;
    private String description;
    private Double locationLat;
    private Double locationLng;
    private String locationAddress;

    @NotBlank(message = "City is required")
    private String city;

    @NotNull(message = "Car ID is required")
    private Long carIdInput;

    private Long serviceTypeIdInput;
    private List<Long> serviceTypeIdsInput;
    private List<Long> serviceTypeIds;
    private List<ServiceItemDTO> serviceTypes;
    private String status;
    private Boolean hasTransportRequest;
    private String executionMethod;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<QuoteDTO> quotes;
    private List<MediaDTO> media;
    private InspectionReportDTO inspectionReport;
    private List<RequestStatusHistoryDTO> timeline;
    private List<ServiceItemResponseDTO> serviceItems;
    private Boolean allowMultiWorkshop;
    private List<SubOrderDTO> subOrders;
    private List<Long> workshopIds;
    private Long technicianId;
    private String technicianName;
    private String technicianPhone;
    private String technicianSpecialty;
}
