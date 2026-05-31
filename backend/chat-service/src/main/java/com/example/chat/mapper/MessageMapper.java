package com.example.chat.mapper;

import com.example.chat.dto.response.MessageResponse;
import com.example.chat.entity.Message;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MessageMapper {

    @Mapping(target = "conversationId", source = "conversation.conversationId")
    @Mapping(target = "messageId", source = "id")
    @Mapping(target = "conversationName", source = "conversation.conversationName")
    @Mapping(target = "groupAvtUrl", source = "conversation.avatarUrl")
    MessageResponse toMessageResponse(Message message);
}
