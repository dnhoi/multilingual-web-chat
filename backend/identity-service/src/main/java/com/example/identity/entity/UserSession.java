package com.example.identity.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_session")
public class UserSession {

    @Id
    @Column(name = "session_id", nullable = false, length = 100)
    private String sessionId;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Column(name = "refresh_token", length = 500)
    private String refreshToken;

    @Column(name = "last_active")
    private Instant lastActive;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.lastActive = Instant.now();
    }
}
