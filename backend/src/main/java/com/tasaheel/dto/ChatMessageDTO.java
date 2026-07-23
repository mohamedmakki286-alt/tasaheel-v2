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
public class ChatMessageDTO {
    private Long id;
    private Long roomId;
    private Long senderId;
    private String senderRole;
    private String senderName;
    private String content;
    private String type;
    private String mediaUrl;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private String clientMessageId;
    private AttachmentDTO attachment;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentDTO {
        private Long id;
        private String url;
        private String mimeType;
        private Long fileSize;
        private String originalFileName;
        private Integer durationSeconds;
        private Integer width;
        private Integer height;
    }
}
