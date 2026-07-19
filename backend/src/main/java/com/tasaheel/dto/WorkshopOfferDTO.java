package com.tasaheel.dto;

import lombok.*;
import java.time.LocalDate;

@Data @Builder
public class WorkshopOfferDTO {
    private Long id;
    private Long workshopId;
    private String workshopName;
    private Double workshopRating;
    private String workshopCity;
    private String title;
    private String description;
    private String type;
    private String serviceNames;
    private Double originalPrice;
    private Double offerPrice;
    private Integer discountPercent;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isActive;
}
