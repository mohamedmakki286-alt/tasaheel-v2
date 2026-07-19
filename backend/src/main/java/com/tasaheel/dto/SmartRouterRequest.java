package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmartRouterRequest {
    private String description;
    private Long serviceTypeId;
    private String serviceTypeName;
    private String carMake;
    private String carModel;
    private Integer carYear;
    private String city;
}
