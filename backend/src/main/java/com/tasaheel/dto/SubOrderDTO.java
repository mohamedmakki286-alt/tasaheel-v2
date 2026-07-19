package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubOrderDTO {
    private Long id;
    private Long requestId;
    private Long workshopId;
    private String workshopName;
    private String status;
    private Double totalPrice;
    private List<SubOrderItemDTO> items;
    private LocalDateTime createdAt;
}
