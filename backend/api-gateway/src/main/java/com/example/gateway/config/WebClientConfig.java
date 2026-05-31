package com.example.gateway.config;

import com.example.gateway.client.IdentityClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.support.WebClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

import java.util.List;

/**
 * Cấu hình WebClient và CORS toàn cục cho Spring Cloud Gateway Reactive.
 */
@Configuration
@Slf4j
public class WebClientConfig {

    /**
     * Khởi tạo WebClient trỏ trực tiếp đến identity-service để thực hiện introspect token.
     */
    @Bean
    WebClient webClient() {
        return WebClient.builder()
                .baseUrl("http://identity-service:8080")
                .build();
    }

    /**
     * Cấu hình bộ lọc CORS toàn cục tại tầng Gateway.
     * Sử dụng allowedOriginPatterns thay vì allowedOrigins khi bật allowCredentials=true
     * để tương thích chuẩn và tránh lỗi trùng lặp tiêu đề CORS với các dịch vụ downstream.
     */
    @Bean
    CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedHeaders(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsWebFilter(source);
    }

    /**
     * Khởi tạo declarative HTTP interface proxy cho IdentityClient.
     */
    @Bean
    IdentityClient identityClient(WebClient webClient) {
        HttpServiceProxyFactory httpServiceProxyFactory = HttpServiceProxyFactory.builderFor(WebClientAdapter.create(webClient)).build();
        return httpServiceProxyFactory.createClient(IdentityClient.class);
    }
}
