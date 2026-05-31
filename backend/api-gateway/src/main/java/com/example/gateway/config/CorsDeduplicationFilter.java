package com.example.gateway.config;

import lombok.extern.slf4j.Slf4j;
import org.reactivestreams.Publisher;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpResponseDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Bộ lọc WebFilter loại bỏ các header CORS bị trùng lặp (như Access-Control-Allow-Origin,
 * Access-Control-Allow-Credentials) phát sinh khi cả Gateway và các dịch vụ phía sau cùng cấu hình CORS.
 * Đảm bảo trình duyệt không từ chối phản hồi do header CORS bị khai báo nhiều lần.
 */
@Component
@Slf4j
public class CorsDeduplicationFilter implements WebFilter, Ordered {

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpResponse originalResponse = exchange.getResponse();

        originalResponse.beforeCommit(() -> {
            deduplicateHeaders(originalResponse.getHeaders());
            return Mono.empty();
        });

        ServerHttpResponseDecorator decoratedResponse = new ServerHttpResponseDecorator(originalResponse) {
            @Override
            public Mono<Void> writeWith(Publisher<? extends DataBuffer> body) {
                deduplicateHeaders(getHeaders());
                return super.writeWith(body);
            }

            @Override
            public Mono<Void> writeAndFlushWith(Publisher<? extends Publisher<? extends DataBuffer>> body) {
                deduplicateHeaders(getHeaders());
                return super.writeAndFlushWith(body);
            }
        };

        return chain.filter(exchange.mutate().response(decoratedResponse).build());
    }

    private void deduplicateHeaders(HttpHeaders headers) {
        if (headers == null) return;

        List<String> origins = headers.get(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN);
        if (origins != null && origins.size() > 1) {
            headers.set(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origins.get(0));
        }

        List<String> credentials = headers.get(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS);
        if (credentials != null && credentials.size() > 1) {
            headers.set(HttpHeaders.ACCESS_CONTROL_ALLOW_CREDENTIALS, credentials.get(0));
        }
    }
}
