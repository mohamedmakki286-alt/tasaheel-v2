package com.tasaheel.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    @Size(max = 2000)
    private String message;

    @Builder.Default
    @Size(max = 20)
    private List<Map<String, String>> history = new ArrayList<>();
}
