package com.example.chat.controller;

import com.example.chat.dto.request.MessageRequest;
import com.example.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;

    @MessageMapping("/chat")
    public void chat(@Payload MessageRequest messageRequest, Principal principal) {
        chatService.sendMessage(messageRequest, principal);
    }

    @KafkaListener(topics = "translate-group", groupId = "translate-group")
    public void receiveMessage(String messageId) {
        chatService.translateCall(messageId);
    }
}
