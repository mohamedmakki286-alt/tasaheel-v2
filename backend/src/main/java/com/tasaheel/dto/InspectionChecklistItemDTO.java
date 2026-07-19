package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionChecklistItemDTO {
    private Long id;
    private Long reportId;
    private String category;
    private String itemName;
    private String status;
    private String notes;
    private String imageUrl;
    private Integer sortOrder;
}
