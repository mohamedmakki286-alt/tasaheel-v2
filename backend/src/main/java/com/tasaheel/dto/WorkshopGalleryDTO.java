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
public class WorkshopGalleryDTO {
    private Long id;
    private Long workshopId;
    private String mediaUrl;
    private String mediaType;
    private Integer displayOrder;
    private Boolean isCover;
    private LocalDateTime createdAt;
}
