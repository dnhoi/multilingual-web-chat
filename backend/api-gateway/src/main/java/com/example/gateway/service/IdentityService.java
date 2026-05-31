package com.example.gateway.service;

import com.example.gateway.client.IdentityClient;
import com.example.gateway.dto.request.IntrospectRequest;
import com.example.gateway.dto.response.ApiResponse;
import com.example.gateway.dto.response.IntrospectResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * Dịch vụ xác thực danh tính tại tầng API Gateway, điều phối kiểm tra token sang identity-service.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IdentityService {

    private final IdentityClient identityClient;

    /**
     * Gọi bất đồng bộ (Reactive Mono) tới identity-service để thẩm định chữ ký và trạng thái thu hồi của token.
     *
     * @param token Chuỗi JWT access token cần kiểm tra
     * @return Mono chứa ApiResponse bọc IntrospectResponse (kèm cờ isValid)
     */
    public Mono<ApiResponse<IntrospectResponse>> introspect(String token) {
        log.debug("Đang thẩm định token qua IdentityClient...");
        return identityClient.introspect(
                IntrospectRequest.builder()
                        .token(token)
                        .build()
        );
    }
}
