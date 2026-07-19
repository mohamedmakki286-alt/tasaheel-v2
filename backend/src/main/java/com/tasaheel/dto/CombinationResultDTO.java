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
public class CombinationResultDTO {
    private Boolean canMix;
    private CombinationOptionDTO bestPackage;
    private CombinationOptionDTO bestMix;
    private Double savings;
    private List<CoverageGroupDTO> bestCoverage;
}
