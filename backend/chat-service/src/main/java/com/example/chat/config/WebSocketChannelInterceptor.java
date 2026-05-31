package com.example.chat.config;

import com.example.chat.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import java.util.List;

/**
 * Bộ đón chặn (ChannelInterceptor) kênh WebSocket/STOMP:
 * - Lệnh CONNECT: Kiểm tra JWT Bearer token trong header, giải mã và gắn thông tin Authentication vào phiên STOMP.
 * - Lệnh SUBSCRIBE: Kiểm tra quyền của người dùng trước khi cho phép lắng nghe kênh tin nhắn của cuộc trò chuyện.
 */
@Configuration
@RequiredArgsConstructor
public class WebSocketChannelInterceptor implements ChannelInterceptor {

    private final CustomJwtDecoder customJwtDecoder;
    private final @Lazy ConversationService conversationService;

    /**
     * Tiền xử lý tin nhắn STOMP trước khi chuyển tiếp vào kênh nội bộ ứng dụng.
     */
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = accessor.getFirstNativeHeader("Authorization");

            if (token == null || !token.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Thiếu token xác thực hoặc token không hợp lệ");
            }

            token = token.substring(7);
            try {
                var jwt = customJwtDecoder.decode(token);
                String userId = jwt.getClaimAsString("userId");

                var auth = new UsernamePasswordAuthenticationToken(
                        userId,
                        token,
                        List.of()
                );

                accessor.setUser(auth);
            } catch (Exception e) {
                throw new IllegalArgumentException("JWT không hợp lệ trong WebSocket: " + e.getMessage());
            }
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            if (accessor.getUser() == null) {
                throw new IllegalArgumentException("Yêu cầu xác thực trước khi kết nối");
            }
            String destination = accessor.getDestination(); // /topic/{conversationId}
            
            if ("/topic/presence".equals(destination)) {
                return message;
            }

            String conversationId = extractConversationId(destination);
            if (conversationId == null) {
                return message; // Bỏ qua kiểm tra quyền truy cập cho kênh cá nhân hoặc hệ thống khác
            }
            String userId = accessor.getUser().getName();

            if (!conversationService.userHasAccessToConversation(userId, conversationId)) {
                throw new IllegalArgumentException("Bạn không có quyền truy cập cuộc trò chuyện này");
            }
        }

        return message;
    }

    private String extractConversationId(String destination) {
        if (destination != null && destination.startsWith("/topic/")) {
            return destination.substring("/topic/".length());
        }
        return null;
    }
}