package com.tasaheel.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIChatRequest {
    @NotBlank
    private String message;

    @Builder.Default
    private List<Map<String, String>> history = new ArrayList<>();
}
