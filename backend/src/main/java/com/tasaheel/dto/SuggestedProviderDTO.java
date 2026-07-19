package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuggestedProviderDTO {
    private Long id;
    private String name;
    private String type;
    private String city;
    private Double rating;
    private Double distance;
    private String workshopType;
}
