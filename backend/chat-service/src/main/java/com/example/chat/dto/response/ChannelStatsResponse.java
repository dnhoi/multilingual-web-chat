package com.example.chat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelStatsResponse {
    private String channelId;
    private String channelName;
    private Long subscriberCount;
    private Boolean isPublic;
    private Instant createdAt;
    private String inviteCode;
}
