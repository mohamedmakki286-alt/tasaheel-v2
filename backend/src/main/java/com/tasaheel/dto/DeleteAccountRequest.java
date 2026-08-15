package com.tasaheel.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeleteAccountRequest {
    private String currentPassword;

    @NotBlank
    private String confirmation;
}
