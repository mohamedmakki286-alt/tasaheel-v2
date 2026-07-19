package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoverageGroupDTO {
    private Long workshopId;
    private String workshopName;
    private List<ServiceItemDTO> serviceTypes;
}
