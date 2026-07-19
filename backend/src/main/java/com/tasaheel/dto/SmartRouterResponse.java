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
public class SmartRouterResponse {
    private String suggestedMode;
    private String modeLabel;
    private String modeIcon;
    private String reasoning;
    private List<String> availableOptions;
    private List<SuggestedProviderDTO> suggestedProviders;
}
