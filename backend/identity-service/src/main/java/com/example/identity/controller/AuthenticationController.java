package com.example.identity.controller;

import com.example.identity.dto.request.AuthenticationRequest;
import com.example.identity.dto.request.ForgotPasswordRequest;
import com.example.identity.dto.request.IntrospectRequest;
import com.example.identity.dto.request.RefreshRequest;
import com.example.identity.dto.request.ResetPasswordRequest;
import com.example.identity.dto.response.ApiResponse;
import com.example.identity.dto.response.AuthenticationResponse;
import com.example.identity.dto.response.IntrospectResponse;
import com.example.identity.dto.response.UserSessionResponse;
import com.example.identity.entity.User;
import com.example.identity.service.AuthenticationService;
import com.example.identity.service.UserService;
import com.nimbusds.jose.JOSEException;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.text.ParseException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final UserService userService;

    @NonFinal
    @Value("${app.frontend.url}")
    private String frontendUrl;

    @NonFinal
    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @PostMapping
    public ApiResponse<AuthenticationResponse> login(@Valid @RequestBody AuthenticationRequest request, HttpServletResponse response) {
        AuthenticationResponse authenticationResponse = authenticationService.authenticate(request);
        ResponseCookie cookie = ResponseCookie.from("token", authenticationResponse.getToken())
                .secure(cookieSecure)
                .httpOnly(true)
                .path("/")
                .sameSite("Strict")
                .maxAge(7 * 24 * 60 * 60)
                .build();
        response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ApiResponse.<AuthenticationResponse>builder()
                .result(authenticationResponse)
                .build();
    }

    @PostMapping("/introspect")
    public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request)
            throws ParseException, JOSEException {
        var result = authenticationService.introspect(request);
        return ApiResponse.<IntrospectResponse>builder()
                .result(result)
                .build();
    }

    @GetMapping("/oauth2/success")
    public void oauth2Success(
            Authentication authentication,
            HttpServletResponse response
    ) throws IOException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        Map<String, Object> attributes = oauthToken.getPrincipal().getAttributes();

        String email = (String) attributes.get("email");
        String fullName = (String) attributes.get("name");
        String avatar = (String) attributes.get("picture");
        String sub = (String) attributes.get("sub");

        AuthenticationResponse authResponse =
                authenticationService.authenticateOAuth2(email, fullName, avatar, sub);

        ResponseCookie cookie = ResponseCookie.from("token", authResponse.getToken())
                .secure(cookieSecure)
                .httpOnly(false)
                .path("/")
                .sameSite("Lax")
                .maxAge(7 * 24 * 60 * 60)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        response.sendRedirect(frontendUrl + "/chat?token=" + authResponse.getToken());
    }

    @GetMapping("/oauth2/failure")
    public ApiResponse<String> oauth2Failure() {
        return ApiResponse.<String>builder()
                .code(200)
                .result("OAuth2 login failed")
                .build();
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestBody IntrospectRequest request) throws ParseException, JOSEException {
        authenticationService.logout(request);
        return ApiResponse.<Void>builder()
                .build();
    }

    @GetMapping("/active")
    public void active(@RequestParam("token") String token, HttpServletResponse response) throws ParseException, JOSEException, IOException {
        var signToken = authenticationService.verifyToken(token, false);
        if (signToken != null) {
            userService.activateUser(token);
            response.sendRedirect(frontendUrl + "/");
        }
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthenticationResponse> refresh(@RequestBody RefreshRequest request) throws ParseException, JOSEException {
        var result = authenticationService.refreshToken(request);
        return ApiResponse.<AuthenticationResponse>builder()
                .result(result)
                .build();
    }

    @PostMapping("/forgot-password")
    public ApiResponse<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) throws Exception {
        return ApiResponse.<String>builder()
                .message(authenticationService.forgotPassword(request))
                .build();
    }

    @PostMapping("/reset-password")
    public ApiResponse<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) throws ParseException, JOSEException {
        return ApiResponse.<String>builder()
                .message(authenticationService.resetPassword(request))
                .build();
    }

    @GetMapping("/sessions")
    public ApiResponse<List<UserSessionResponse>> getActiveSessions() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.getUserByUsername(username);
        return ApiResponse.<List<UserSessionResponse>>builder()
                .result(authenticationService.getActiveSessions(user.getUserId()))
                .build();
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ApiResponse<String> revokeSession(@PathVariable String sessionId) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.getUserByUsername(username);
        authenticationService.revokeSessionForUser(sessionId, user.getUserId());
        return ApiResponse.<String>builder()
                .message("Session revoked")
                .build();
    }
}
