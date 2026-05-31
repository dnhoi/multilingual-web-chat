package com.example.chat.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@Slf4j
public class WebSocketFeignInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null) {
            String token = null;
            if (authentication.getCredentials() instanceof String s && StringUtils.hasText(s)) {
                token = s;
            } else if (authentication.getCredentials() instanceof Jwt jwt) {
                token = jwt.getTokenValue();
            } else if (authentication.getPrincipal() instanceof Jwt jwt) {
                token = jwt.getTokenValue();
            }

            if (StringUtils.hasText(token)) {
                template.header("Authorization", "Bearer " + token);
            }
        }
    }
}