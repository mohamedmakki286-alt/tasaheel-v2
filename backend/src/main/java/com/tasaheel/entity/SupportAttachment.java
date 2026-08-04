package com.tasaheel.entity;
import jakarta.persistence.*; import lombok.*; import org.hibernate.annotations.CreationTimestamp; import java.time.LocalDateTime;
@Entity @Table(name="support_attachments") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SupportAttachment {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="message_id") private SupportMessage message;
 @Column(name="file_url",nullable=false,columnDefinition="TEXT") private String fileUrl;
 @Column(name="file_name",nullable=false,columnDefinition="TEXT") private String fileName;
 @Column(name="mime_type",nullable=false) private String mimeType;
 @Column(name="file_size",nullable=false) private Long fileSize;
 @CreationTimestamp @Column(name="created_at",updatable=false) private LocalDateTime createdAt;
}
