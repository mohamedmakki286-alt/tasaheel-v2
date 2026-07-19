package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "call_sessions")
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

    @Column(name = "caller_id", nullable = false)
    private Long callerId;

    @Column(name = "caller_role", nullable = false)
    private String callerRole;

    @Column(name = "callee_id", nullable = false)
    private Long calleeId;

    @Column(name = "callee_role", nullable = false)
    private String calleeRole;

    @Column(nullable = false)
    private String status;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
