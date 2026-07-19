package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubOrderItemDTO {
    private Long id;
    private Long subOrderId;
    private Long serviceTypeId;
    private String serviceTypeName;
    private Long quoteId;
    private String status;
    private Double itemPrice;
}
