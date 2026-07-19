package com.tasaheel.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverDTO {
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^05\\d{8}$", message = "Phone must be a valid Saudi number")
    private String phone;

    @Email(message = "Email must be valid")
    private String email;

    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private String city;

    @NotBlank(message = "Vehicle type is required")
    private String vehicleType;

    private String serviceMode;

    private String plateNumber;
    private Boolean isActive;
    private Boolean isApproved;
    private Double latitude;
    private Double longitude;
    private Boolean isOnline;
    private String fcmToken;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
