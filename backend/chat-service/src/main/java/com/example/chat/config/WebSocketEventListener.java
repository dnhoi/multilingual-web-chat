package com.example.chat.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();
        if (principal != null) {
            String userId = principal.getName();
            log.info("User connected: {}", userId);
            
            Map<String, Object> presenceMessage = new HashMap<>();
            presenceMessage.put("userId", userId);
            presenceMessage.put("online", true);
            
            messagingTemplate.convertAndSend("/topic/presence", presenceMessage);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();
        if (principal != null) {
            String userId = principal.getName();
            log.info("User disconnected: {}", userId);
            
            Map<String, Object> presenceMessage = new HashMap<>();
            presenceMessage.put("userId", userId);
            presenceMessage.put("online", false);
            
            messagingTemplate.convertAndSend("/topic/presence", presenceMessage);
        }
    }
}
