package com.tasaheel.entity;
import jakarta.persistence.*; import lombok.*; import org.hibernate.annotations.CreationTimestamp; import java.time.LocalDateTime;
@Entity @Table(name="support_messages") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SupportMessage {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="ticket_id") private SupportTicket ticket;
 @Column(name="sender_id",nullable=false) private Long senderId;
 @Column(name="sender_role",nullable=false) private String senderRole;
 @Column(columnDefinition="TEXT") private String body;
 @CreationTimestamp @Column(name="created_at",updatable=false) private LocalDateTime createdAt;
}
