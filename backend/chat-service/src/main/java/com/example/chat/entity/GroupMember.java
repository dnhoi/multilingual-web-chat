package com.example.chat.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "group_member")
public class GroupMember {

    @EmbeddedId
    private GroupMemberId id;

    @MapsId("conversationId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @NotNull
    @Column(name = "joined_datetime", nullable = false)
    private Instant joinedDatetime;

    @Column(name = "left_datetime")
    private Instant leftDatetime;

    @Column(name = "role", length = 20)
    @Builder.Default
    private String role = "MEMBER";

    @Column(name = "is_muted")
    @Builder.Default
    private Boolean isMuted = false;

    @Column(name = "is_banned")
    @Builder.Default
    private Boolean isBanned = false;

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, PENDING_APPROVAL

    @PrePersist
    public void prePersist() {
        this.joinedDatetime = Instant.now();
    }
}