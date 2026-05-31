package com.example.chat.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConversationResponse {
    private String conversationId;
    private String conversationName;
    private String avatarUrl;
    private String description;
    private String type;
    private Long subscriberCount;
    private Boolean isPublicChannel;
    private String inviteCode;
}
