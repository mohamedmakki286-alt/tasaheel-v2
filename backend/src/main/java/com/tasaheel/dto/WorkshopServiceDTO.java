package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkshopServiceDTO {
    private Long id;
    private Long workshopId;
    private String workshopName;
    private Long serviceTypeId;
    private String serviceTypeName;
    private Double price;
}
