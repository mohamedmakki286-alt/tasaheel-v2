package com.tasaheel.dto;

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
public class WorkshopServiceListingDTO {
    private Long id;
    private String uuid;
    private Long workshopId;
    private String workshopName;
    private Long categoryId;
    private String categoryName;
    private Long serviceTemplateId;
    private String templateName;
    private String name;
    private String description;
    private Double price;
    private String priceType;
    private String estimatedDuration;
    private String icon;
    private List<String> images;
    private Boolean isVisible;
    private Boolean isAvailable;
    private Integer displayOrder;
    private Boolean isDeleted;
    private Long requestCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
