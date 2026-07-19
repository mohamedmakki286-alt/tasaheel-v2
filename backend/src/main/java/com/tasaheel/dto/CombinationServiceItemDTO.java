package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CombinationServiceItemDTO {
    private Long serviceTypeId;
    private String serviceTypeName;
    private Long workshopId;
    private String workshopName;
    private Double price;
    private Long quoteId;
}
