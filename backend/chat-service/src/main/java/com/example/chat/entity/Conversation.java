package com.example.chat.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "conversation")
public class Conversation {

    @Id
    @Size(max = 50)
    @Column(name = "conversation_id", nullable = false, length = 50)
    private String conversationId;

    @Size(max = 100)
    @Column(name = "conversation_name", length = 100)
    private String conversationName;

    @Size(max = 20)
    @Column(name = "locale", length = 20)
    private String locale;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Size(max = 20)
    @Column(name = "type", length = 20)
    @Builder.Default
    private String type = "DIRECT"; // DIRECT, GROUP, SECRET, AI

    @Column(name = "is_archived")
    @Builder.Default
    private Boolean isArchived = false;

    @Column(name = "is_pinned")
    @Builder.Default
    private Boolean isPinned = false;

    @Column(name = "is_favorite")
    @Builder.Default
    private Boolean isFavorite = false;

    @Column(name = "is_muted")
    @Builder.Default
    private Boolean isMuted = false;

    @Size(max = 50)
    @Column(name = "invite_code", length = 50)
    private String inviteCode;

    @Column(name = "announcement", columnDefinition = "TEXT")
    private String announcement;

    @Column(name = "slow_mode_seconds")
    @Builder.Default
    private Integer slowModeSeconds = 0;

    @Column(name = "subscriber_count")
    @Builder.Default
    private Long subscriberCount = 0L;

    @Column(name = "is_public_channel")
    @Builder.Default
    private Boolean isPublicChannel = false;

    @NotNull
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
    }
}