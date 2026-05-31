package com.example.chat.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

/**
 * Cấu hình kết nối WebSocket và STOMP Message Broker cho dịch vụ Chat:
 * - Đăng ký điểm cuối SockJS kết nối từ máy khách (Frontend).
 * - Cấu hình định tuyến các kênh phát sóng tin nhắn (/topic, /queue).
 * - Gắn bộ kiểm tra quyền hạn và xác thực JWT token (WebSocketChannelInterceptor).
 * - Tối ưu dung lượng bộ đệm cho tệp gửi lớn (lên đến 50MB).
 */
@Configuration
@RequiredArgsConstructor
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final WebSocketChannelInterceptor webSocketChannelInterceptor;

    /**
     * Cấu hình Message Broker:
     * - /topic: Kênh tin nhắn hội thoại nhóm (broadcast)
     * - /queue: Kênh tin nhắn cá nhân 1-1 (unicast)
     * - /app: Tiền tố các điểm nhận tin nhắn từ client xử lý logic backend
     * - /user: Tiền tố định tuyến tin nhắn tới từng người dùng cụ thể
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic","/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    /**
     * Đăng ký điểm cuối STOMP (/ws và /chat/ws) tích hợp cơ chế dự phòng SockJS
     * và cấu hình danh sách các nguồn gốc (Origin) được phép kết nối.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws", "/chat/ws")
            .setAllowedOriginPatterns(
                "http://localhost:[*]",
                "http://127.0.0.1:[*]",
                "http://192.168.*:[*]",
                "http://172.17.*:[*]"
            )
                .withSockJS();
    }

    /**
     * Đăng ký interceptor chặn kênh vào từ client để kiểm tra xác thực JWT.
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketChannelInterceptor);
    }

    /**
     * Cấu hình giới hạn kích thước và thời gian chờ truyền tin nhắn WebSocket.
     */
    @Override
    public void configureWebSocketTransport(org.springframework.web.socket.config.annotation.WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(50 * 1024 * 1024); // Giới hạn kích thước tin nhắn: 50MB
        registration.setSendBufferSizeLimit(50 * 1024 * 1024); // Giới hạn bộ đệm gửi: 50MB
        registration.setSendTimeLimit(20 * 1000); // Thời gian chờ gửi: 20 giây
    }

    /**
     * Thiết lập thông số buffer tối đa cho container Servlet WebSocket.
     */
    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(50 * 1024 * 1024);
        container.setMaxBinaryMessageBufferSize(50 * 1024 * 1024);
        return container;
    }
}
