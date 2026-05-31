package com.example.gateway.client;

import com.example.gateway.dto.request.IntrospectRequest;
import com.example.gateway.dto.response.ApiResponse;
import com.example.gateway.dto.response.IntrospectResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.service.annotation.PostExchange;
import reactor.core.publisher.Mono;

/**
 * HTTP Service Client gọi sang identity-service thông qua WebClient reactive của Spring Cloud Gateway.
 */
public interface IdentityClient {

    /**
     * Thẩm định tính hợp lệ của JWT token từ xa thông qua endpoint introspect của identity-service.
     */
    @PostExchange(url = "/identify/auth/introspect", contentType = MediaType.APPLICATION_JSON_VALUE)
    Mono<ApiResponse<IntrospectResponse>> introspect(@RequestBody IntrospectRequest introspectRequest);
}
