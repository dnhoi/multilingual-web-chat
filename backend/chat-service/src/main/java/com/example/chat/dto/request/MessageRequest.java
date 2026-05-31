package com.example.chat.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {
    private Long messageId;
    private String messageText;
    private String conversationId;
    private String type;
    private Long replyToMessageId;
    private String replyToMessageText;
    private String replyToUserId;
    private String action; // SEND, EDIT, DELETE, PIN, UNPIN, REACT, TYPING, FORWARD
    private String reaction;
    private Long forwardFromMessageId;
    private String forwardFromUserId;
    private String status;
    private String pollData;
    private String locationData;
}
