package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name="support_tickets")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SupportTicket {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="ticket_number", unique=true) private String ticketNumber;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="customer_id") private Customer customer;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="assigned_agent_id") private AdminUser assignedAgent;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="request_id") private MaintenanceRequest request;
    @Column(nullable=false) private String subject;
    @Column(nullable=false) @Builder.Default private String category="general";
    @Column(nullable=false) @Builder.Default private String priority="normal";
    @Column(nullable=false) @Builder.Default private String status="new";
    @Column(name="last_message_at", nullable=false) private LocalDateTime lastMessageAt;
    @Column(name="customer_unread_count", nullable=false) @Builder.Default private Integer customerUnreadCount=0;
    @Column(name="agent_unread_count", nullable=false) @Builder.Default private Integer agentUnreadCount=0;
    @CreationTimestamp @Column(name="created_at", updatable=false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name="updated_at") private LocalDateTime updatedAt;
    @Column(name="closed_at") private LocalDateTime closedAt;
}
