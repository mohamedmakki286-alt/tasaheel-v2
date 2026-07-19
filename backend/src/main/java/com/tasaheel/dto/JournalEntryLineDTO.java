package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntryLineDTO {
    private Long id;
    private Long entryId;
    private Long accountId;
    private String accountCode;
    private String accountName;
    private Double debit;
    private Double credit;
    private String description;
}
