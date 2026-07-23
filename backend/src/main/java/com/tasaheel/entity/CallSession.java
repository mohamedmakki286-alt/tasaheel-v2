package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "call_sessions", indexes = {
    @Index(name = "idx_call_sessions_request_id", columnList = "requestId"),
    @Index(name = "idx_call_sessions_caller_id", columnList = "callerId"),
    @Index(name = "idx_call_sessions_callee_id", columnList = "calleeId"),
    @Index(name = "idx_call_sessions_status", columnList = "status"),
    @Index(name = "idx_call_sessions_created_at", columnList = "createdAt")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id")
    private Long requestId;

    @Column(name = "conversation_id")
    private String conversationId;

    @Column(name = "caller_id", nullable = false)
    private Long callerId;

    @Column(name = "caller_role", nullable = false, length = 50)
    private String callerRole;

    @Column(name = "caller_name_snapshot")
    private String callerNameSnapshot;

    @Column(name = "callee_id", nullable = false)
    private Long calleeId;

    @Column(name = "callee_role", nullable = false, length = 50)
    private String calleeRole;

    @Column(name = "callee_name_snapshot")
    private String calleeNameSnapshot;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "initiated_at")
    private LocalDateTime initiatedAt;

    @Column(name = "ringing_at")
    private LocalDateTime ringingAt;

    @Column(name = "connected_at")
    private LocalDateTime connectedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "ended_by_user_id")
    private Long endedByUserId;

    @Column(name = "end_reason", length = 50)
    private String endReason;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
