package com.tasaheel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntryDTO {
    private Long id;
    private String entryNumber;
    private LocalDate entryDate;
    private String description;
    private String referenceType;
    private Long referenceId;
    private String status;
    private LocalDateTime createdAt;
    private List<JournalEntryLineDTO> lines;
}
