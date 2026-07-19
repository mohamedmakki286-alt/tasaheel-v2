package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCategoryDTO {
    private Long id;
    private String name;
    private String nameEn;
    private String icon;
    private Integer displayOrder;
    private Boolean isActive;
    private Long serviceCount;
    private LocalDateTime createdAt;
}
