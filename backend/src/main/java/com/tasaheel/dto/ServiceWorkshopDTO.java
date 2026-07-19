package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceWorkshopDTO {
    private Long workshopId;
    private String workshopName;
    private String workshopAddress;
    private String workshopCity;
    private Double workshopLat;
    private Double workshopLng;
    private String workshopPhone;
    private Double workshopRating;
    private Long reviewCount;
    private String workingHours;
    private Double price;
    private Double distanceKm;
    private Long averageResponseTimeMinutes;
    private Long completedJobs;
}
