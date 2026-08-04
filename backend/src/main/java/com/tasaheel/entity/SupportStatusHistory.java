package com.tasaheel.entity;
import jakarta.persistence.*; import lombok.*; import org.hibernate.annotations.CreationTimestamp; import java.time.LocalDateTime;
@Entity @Table(name="support_status_history") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SupportStatusHistory {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="ticket_id") private SupportTicket ticket;
 @Column(name="old_status") private String oldStatus; @Column(name="new_status",nullable=false) private String newStatus;
 @Column(name="changed_by_id",nullable=false) private Long changedById; @Column(name="changed_by_role",nullable=false) private String changedByRole;
 @Column(columnDefinition="TEXT") private String note;
 @CreationTimestamp @Column(name="created_at",updatable=false) private LocalDateTime createdAt;
}
