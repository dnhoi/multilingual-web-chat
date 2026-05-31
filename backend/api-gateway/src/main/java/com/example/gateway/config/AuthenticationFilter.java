package com.example.gateway.config;

import com.example.gateway.dto.response.ApiResponse;
import com.example.gateway.service.IdentityService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Bộ lọc toàn cục Gateway (GlobalFilter) kiểm tra xác thực JWT và bảo mật cho mọi yêu cầu HTTP đi vào hệ thống.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class AuthenticationFilter implements GlobalFilter, Ordered {
    private final IdentityService identityService;
    private final ObjectMapper objectMapper;
    // Kiểm tra giới hạn tần suất yêu cầu (Rate Limit) cho các endpoint nhạy cảm qua Redis
    private final ReactiveStringRedisTemplate redisTemplate;

    // Giới hạn: 10 yêu cầu / phút cho toàn bộ public API
    private static final int RATE_LIMIT_MAX = 10;
    private static final long RATE_LIMIT_WINDOW_SECONDS = 60;

    // Các endpoint xác thực cần áp dụng giới hạn nghiêm ngặt hơn: 5 yêu cầu / phút chống Brute-Force
    private static final List<String> STRICT_RATE_ENDPOINTS = List.of(
            "/api/v1/identify/auth",
            "/api/v1/identify/auth/forgot-password",
            "/api/v1/identify/auth/refresh"
    );

    @NonFinal
    private final String[] publicEndpoints = {
            "identify/auth",
            "identify/auth/active",
            "identify/auth/refresh",
            "identify/auth/forgot-password",
            "identify/auth/reset-password",
            "identify/auth/introspect",
            "identify/oauth2/.*",
            "identify/login/oauth2/.*",
            "identify/auth/oauth2/success",
            "identify/auth/oauth2/failure",
            "oauth2/.*",
            "v3/api-docs/.*",
            "swagger-ui/.*",
            "swagger-ui.html",
            "identify/swagger-ui/.*",
            "identify/v3/api-docs/.*",
            "chat/swagger-ui/.*",
            "chat/v3/api-docs/.*",
            // SockJS thực hiện các yêu cầu /info và transport ban đầu chưa kèm token trước khi gửi frame STOMP CONNECT.
            // Việc xác thực JWT sẽ được bắt buộc kiểm tra bởi interceptor STOMP tại chat-service.
            "chat/ws/.*",
            "actuator/.*",
            "identify/actuator/.*",
            "chat/actuator/.*",
            ".*/swagger-ui/.*",
            ".*/v3/api-docs/.*",
            ".*/swagger-ui.html",
            "identify/admin/public/.*"
    };

    @Value("${app.api-prefix}")
    @NonFinal
    private String apiPrefix;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        log.info("Bắt đầu xử lý bộ lọc xác thực Gateway....");

        // Gắn các tiêu đề bảo mật HTTP (Security Headers) vào phản hồi để bảo vệ trình duyệt
        ServerHttpResponse response = exchange.getResponse();
        HttpHeaders headers = response.getHeaders();
        headers.add("X-Content-Type-Options", "nosniff");
        headers.add("X-Frame-Options", "DENY");
        headers.add("X-XSS-Protection", "1; mode=block");
        headers.add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        headers.add("Content-Security-Policy", "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'");
        headers.add("Referrer-Policy", "strict-origin-when-cross-origin");
        headers.add("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");

        String path = exchange.getRequest().getURI().getPath();
        String clientIp = getClientIp(exchange.getRequest());

        boolean isPublic = isPublicEndpoint(exchange.getRequest());
        log.info("Kiểm tra endpoint công khai cho {}: {}", path, isPublic);
        if (isPublic) {
            return chain.filter(exchange);
        }

        List<String> authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION);
        if (CollectionUtils.isEmpty(authHeader)) {
            return unauthenticated(exchange.getResponse());
        }

        String token = authHeader.getFirst().replace("Bearer ", "");

        return identityService.introspect(token).flatMap(introspectResponse -> {
            if (introspectResponse.getResult().isValid()) {
                return chain.filter(exchange);
            } else {
                return unauthenticated(exchange.getResponse());
            }
        }).onErrorResume(throwable -> unauthenticated(exchange.getResponse()));
    }

    @Override
    public int getOrder() {
        return -1;
    }

    private boolean isPublicEndpoint(ServerHttpRequest request) {
        String path = request.getURI().getPath();
        org.springframework.http.HttpMethod method = request.getMethod();
        log.info("Checking public endpoint: {}, method: {}", path, method);
        String normalizedPrefix = apiPrefix.endsWith("/") ? apiPrefix : apiPrefix + "/";

        // Allow creating user publicly (POST /api/v1/identify/users or POST /identify/users)
        if (org.springframework.http.HttpMethod.POST.equals(method) && 
            (path.equals(normalizedPrefix + "identify/users") || path.equals("/identify/users") || 
             path.equals(normalizedPrefix + "identify/users/") || path.equals("/identify/users/"))) {
            return true;
        }

        if (path.contains("/identify/auth/sessions") || path.contains("/auth/sessions")) {
            return false;
        }

        if (path.contains("swagger-ui") || path.contains("v3/api-docs")) {
            return true;
        }

        return Arrays.stream(publicEndpoints)
                .anyMatch(s -> {
                    String patternWithPrefix = normalizedPrefix + s;
                    String patternDirect = "/" + s;
                    return path.matches(patternWithPrefix) || path.matches(patternDirect);
                });
    }

    // FIX #1: Lay IP that su cua client (ho tro reverse proxy)
    private String getClientIp(ServerHttpRequest request) {
        String forwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isEmpty()) {
            return forwardedFor.split(",")[0].trim();
        }
        if (request.getRemoteAddress() != null) {
            return request.getRemoteAddress().getAddress().getHostAddress();
        }
        return "unknown";
    }

    Mono<Void> unauthenticated(ServerHttpResponse response){
        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(1401)
                .message("Unauthenticated")
                .build();

        String body = null;
        try {
            body = objectMapper.writeValueAsString(apiResponse);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);

        return response.writeWith(
                Mono.just(response.bufferFactory().wrap(body.getBytes())));
    }

    // FIX #1: Rate Limiting cho cac endpoint nhan dang (chong Brute-Force)
    private Mono<Void> tooManyRequests(ServerHttpResponse response) {
        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(1429)
                .message("Too many requests. Please try again later.")
                .build();
        String body;
        try {
            body = objectMapper.writeValueAsString(apiResponse);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
        response.setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes())));
    }
}

