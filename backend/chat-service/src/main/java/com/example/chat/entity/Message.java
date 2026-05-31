package com.example.chat.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
@Table(name = "message")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id", nullable = false)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @Size(max = 50)
    @NotNull
    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @NotNull
    @Column(name = "message_text", nullable = false, columnDefinition = "MEDIUMTEXT")
    private String messageText;

    @Column(name = "message_text_translate", columnDefinition = "MEDIUMTEXT")
    private String messageTextTranslate;

    @NotNull
    @Column(name = "type", nullable = false)
    private String type;

    @NotNull
    @Column(name = "sent_datetime", nullable = false)
    private Instant sentDatetime;

    @Column(name = "reply_to_message_id")
    private Long replyToMessageId;

    @Column(name = "reply_to_message_text", columnDefinition = "TEXT")
    private String replyToMessageText;

    @Column(name = "reply_to_user_id", length = 50)
    private String replyToUserId;

    @Column(name = "is_edited")
    @Builder.Default
    private Boolean isEdited = false;

    @Column(name = "is_deleted")
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "is_pinned")
    @Builder.Default
    private Boolean isPinned = false;

    @Column(name = "reactions", columnDefinition = "TEXT")
    private String reactions;

    @Column(name = "forward_from_message_id")
    private Long forwardFromMessageId;

    @Column(name = "forward_from_user_id", length = 50)
    private String forwardFromUserId;

    @Column(name = "status", length = 20)
    @Builder.Default
    private String status = "SENT"; // SENT, DELIVERED, SEEN

    @Column(name = "poll_data", columnDefinition = "TEXT")
    private String pollData;

    @Column(name = "location_data", length = 255)
    private String locationData;

    @PrePersist
    public void prePersist() {
        this.sentDatetime = Instant.now();
        if (this.isEdited == null) this.isEdited = false;
        if (this.isDeleted == null) this.isDeleted = false;
        if (this.isPinned == null) this.isPinned = false;
    }
}