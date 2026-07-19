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
public class CombinationOptionDTO {
    private String label;
    private Double totalPrice;
    private Boolean isBundle;
    private List<CombinationServiceItemDTO> items;
}
