package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "oauth_accounts")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class OAuthAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String provider;

    @Column(name = "provider_id", nullable = false, length = 255)
    private String providerId;

    @Column(name = "user_type", nullable = false, length = 20)
    private String userType;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(length = 255)
    private String email;

    @Column(length = 255)
    private String name;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
