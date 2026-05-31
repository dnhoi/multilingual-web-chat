package com.example.chat.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@AllArgsConstructor
@Builder
@NoArgsConstructor
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MessageResponse {
    private String messageId;
    private String conversationName;
    private String conversationType;
    private String groupAvtUrl;
    private String groupLocale;
    private String userId;
    private String conversationId;
    private String messageText;
    private String messageTextTranslate;
    private Instant sentDatetime;
    private String type;
    private List<UserProfileResponse> userProfiles;
    private Long replyToMessageId;
    private String replyToMessageText;
    private String replyToUserId;
    private Boolean isEdited;
    private Boolean isDeleted;
    private Boolean isPinned;
    private String reactions;
    private String action;
    private Long forwardFromMessageId;
    private String forwardFromUserId;
    private String status;
    private String pollData;
    private String locationData;
}
