package com.tasaheel.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity @Table(name = "admin_users")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AdminUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String name;
    @Column(nullable=false, unique=true) private String email;
    private String phone;
    @Column(nullable=false) private String password;
    @Column(nullable=false) @Builder.Default private String role = "support_agent";
    @Column(name="is_active", nullable=false) @Builder.Default private Boolean isActive = true;
    @Column(name="password_setup_completed", nullable=false) @Builder.Default private Boolean passwordSetupCompleted = false;
    @Column(name="last_invitation_sent_at") private LocalDateTime lastInvitationSentAt;
    @CreationTimestamp @Column(name="created_at", updatable=false) private LocalDateTime createdAt;
    @UpdateTimestamp @Column(name="updated_at") private LocalDateTime updatedAt;
}
