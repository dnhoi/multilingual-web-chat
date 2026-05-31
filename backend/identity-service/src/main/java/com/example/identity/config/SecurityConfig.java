package com.example.identity.config;

import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.spec.SecretKeySpec;

/**
 * Cấu hình bảo mật Spring Security cho Identity Service:
 * - Thiết lập quyền truy cập cho từng endpoint (public vs authenticated vs admin).
 * - Tích hợp OAuth2 Resource Server để giải mã và xác thực JWT token.
 * - Hỗ trợ đăng nhập Google OAuth2 (OAuth2 Login).
 */
@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomJwtDecoder customJwtDecoder;

    @NonFinal
    @Value("${jwt.signerKey}")
    private String SIGNER_KEY;

    /**
     * Chuỗi bộ lọc bảo mật chính (SecurityFilterChain) áp dụng cho các HTTP requests.
     */
    @Bean
    public SecurityFilterChain securityFilter(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authorize -> authorize
                .requestMatchers(org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/auth/sessions")).authenticated()
                .requestMatchers(org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/auth/sessions/**")).authenticated()
                .requestMatchers(org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher(org.springframework.http.HttpMethod.GET, "/users/all")).hasAnyAuthority("SCOPE_ROLE_ADMIN", "ROLE_ADMIN")
                .requestMatchers(org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher(org.springframework.http.HttpMethod.POST, "/users")).permitAll()
                .requestMatchers(org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher(org.springframework.http.HttpMethod.GET, "/users/*")).permitAll()
                .requestMatchers(org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher(org.springframework.http.HttpMethod.POST, "/users/batch")).permitAll()
                .requestMatchers(org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/auth")).permitAll()
                .requestMatchers(org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/auth/**")).permitAll()
                .requestMatchers(org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/oauth2/**")).permitAll()
                .requestMatchers(org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/v3/api-docs/**")).permitAll()
                .requestMatchers(org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/swagger-ui/**")).permitAll()
                .requestMatchers(org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/swagger-ui.html")).permitAll()
                .requestMatchers(org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher(org.springframework.http.HttpMethod.POST, "/admin/reports")).permitAll()
                .requestMatchers(org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/admin/public/**")).permitAll()
                .requestMatchers(org.springframework.security.web.util.matcher.AntPathRequestMatcher.antMatcher("/admin/**")).hasAnyAuthority("SCOPE_ROLE_ADMIN", "ROLE_ADMIN")
                .anyRequest().authenticated());
        http.oauth2ResourceServer(oauth2 -> oauth2
                .bearerTokenResolver(request -> {
                    if (isPublicEndpoint(request)) {
                        return null;
                    }
                    String header = request.getHeader("Authorization");
                    if (header != null && header.startsWith("Bearer ")) {
                        return header.substring(7);
                    }
                    return null;
                })
                .jwt(jwt -> jwt.decoder(customJwtDecoder)));

        http.cors(AbstractHttpConfigurer::disable);
        http.csrf(AbstractHttpConfigurer::disable);

        http.oauth2Login(oauth2 -> {
            oauth2.defaultSuccessUrl("/auth/oauth2/success", true);
            oauth2.failureUrl("/auth/oauth2/failure");
        })
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED));
        http.exceptionHandling(exception -> exception
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"code\":1003,\"message\":\"Unauthenticated\"}");
                })
        );
        return http.build();
    }

    /**
     * Khởi tạo bộ giải mã JWT chuẩn Nimbus sử dụng giải thuật HMAC SHA-512.
     */
    @Bean
    JwtDecoder jwtDecoder() {
        SecretKeySpec secretKeySpec = new SecretKeySpec(SIGNER_KEY.getBytes(), "HS512");
        return NimbusJwtDecoder.withSecretKey(secretKeySpec).macAlgorithm(MacAlgorithm.HS512).build();
    }

    /**
     * Xác định xem một yêu cầu HTTP có thuộc danh sách endpoint công khai không cần token hay không.
     */
    private boolean isPublicEndpoint(jakarta.servlet.http.HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        if (path.contains("/auth/sessions") || path.contains("/users/all")) {
            return false;
        }

        if (path.contains("/auth/") || path.endsWith("/auth") || path.contains("/oauth2/") || path.contains("/admin/public/")) {
            return true;
        }

        if ("POST".equalsIgnoreCase(method) && (path.endsWith("/users") || path.endsWith("/users/") || path.endsWith("/users/batch"))) {
            return true;
        }

        if ("GET".equalsIgnoreCase(method) && path.matches(".*/users/[^/]+")) {
            if (path.endsWith("/users/all") || path.endsWith("/users/my-info")) {
                return false;
            }
            return true;
        }

        return false;
    }
}
