package com.tasaheel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordTokenRequest {
    @NotBlank
    private String token;
    @NotBlank @Size(min = 6)
    private String newPassword;
}
