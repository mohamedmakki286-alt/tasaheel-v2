package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountDTO {
    private Long id;
    private String code;
    private String name;
    private String nameEn;
    private String type;
    private Long parentId;
    private String parentName;
    private Integer level;
    private Boolean isSystem;
    private Double balance;
    private Boolean isActive;
}
