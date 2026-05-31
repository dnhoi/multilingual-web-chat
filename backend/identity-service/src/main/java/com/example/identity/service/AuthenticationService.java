package com.example.identity.service;

import com.example.identity.dto.request.AuthenticationRequest;
import com.example.identity.dto.request.IntrospectRequest;
import com.example.identity.dto.response.AuthenticationResponse;
import com.example.identity.dto.response.IntrospectResponse;
import com.example.identity.entity.InvalidatedToken;
import com.example.identity.entity.User;
import com.example.identity.exception.AppException;
import com.example.identity.exception.ErrorCode;
import com.example.identity.repository.InvalidatedTokenRepository;
import com.example.identity.repository.UserRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.StringJoiner;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final UserRepository userRepository;
    private final InvalidatedTokenRepository invalidatedTokenRepository;
    private final com.example.identity.repository.UserSessionRepository userSessionRepository;
    private final IdGeneratorService idGeneratorService;
    private final PasswordEncoder passwordEncoder;
    private final StringRedisTemplate redisTemplate;

    // So lan dang nhap that bai toi da va thoi gian khoa tai khoan
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_MINUTES = 15;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;

    // URL reset password doc tu bien moi truong
    @NonFinal
    @Value("${app.frontend.url}")
    private String frontendUrl;

    private final EmailService emailService;

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        String lockKey = "login:lock:" + request.getUsername();
        String attemptsKey = "login:attempts:" + request.getUsername();

        try {
            String isLocked = redisTemplate.opsForValue().get(lockKey);
            if (isLocked != null) {
                throw new AppException(ErrorCode.ACCOUNT_LOCKED);
            }
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Redis unavailable during lock check for user: {}", request.getUsername());
        }

        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElse(null);

        if (user != null && passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            if (!Boolean.TRUE.equals(user.getIsActive())) {
                throw new AppException(ErrorCode.NOT_ACTIVATE_YET);
            }
        } else {
            try {
                Long attempts = redisTemplate.opsForValue().increment(attemptsKey);
                redisTemplate.expire(attemptsKey, LOCKOUT_DURATION_MINUTES, TimeUnit.MINUTES);
                if (attempts != null && attempts >= MAX_FAILED_ATTEMPTS) {
                    redisTemplate.opsForValue().set(lockKey, "1", LOCKOUT_DURATION_MINUTES, TimeUnit.MINUTES);
                    log.warn("Account locked after {} failed attempts: {}", MAX_FAILED_ATTEMPTS, request.getUsername());
                }
            } catch (Exception e) {
                log.warn("Redis unavailable during attempt tracking for user: {}", request.getUsername());
            }
            throw new AppException(ErrorCode.WRONG_PASSWORD);
        }

        // Dang nhap thanh cong: xoa counter
        redisTemplate.delete(attemptsKey);

        return AuthenticationResponse.builder()
                .token(generateToken(user))
                .refreshToken(generateRefreshToken(user))
                .authenticated(true)
                .build();
    }

    @Transactional
    public void logout(IntrospectRequest request) throws ParseException, JOSEException {
        var signToken = verifyToken(request.getToken(), false);
        String accessTokenId = signToken.getJWTClaimsSet().getJWTID();
        Date accessTokenExpiryTime = signToken.getJWTClaimsSet().getExpirationTime();
        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .id(accessTokenId)
                .expiryTime(accessTokenExpiryTime)
                .build();
        invalidatedTokenRepository.save(invalidatedToken);
        log.info("User logged out, token invalidated: {}", accessTokenId);
    }

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        var token = request.getToken();
        boolean isValid = true;

        try {
            verifyToken(token,false);
        } catch (AppException e) {
            isValid = false;
        }
        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    public SignedJWT verifyToken(String token, boolean isRefresh) throws ParseException, JOSEException {
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);

        boolean verified = signedJWT.verify(verifier);
        if (!verified) throw new AppException(ErrorCode.UNAUTHENTICATED);

        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        if (expiryTime.before(new Date())) throw new AppException(ErrorCode.UNAUTHENTICATED);

        if (invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID())) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return signedJWT;
    }

    public String generateToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .jwtID(UUID.randomUUID().toString())
                .issuer("multilingual-web-chat")
                .issueTime(new Date())
                .expirationTime(Date.from(Instant.now().plus(1, ChronoUnit.HOURS)))
                .claim("scope",buildScope(user))
                .claim("type","access_token")
                .claim("userId",user.getUserId())
                .build();
        Payload payload = new Payload(claimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);
        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
        return jwsObject.serialize();
    }



    private String buildScope(User user){
        StringJoiner scope = new StringJoiner(" ");
        String role = user.getRole();
        if(role != null && !role.trim().isEmpty()){
            // Normalize to uppercase to ensure consistent SCOPE_ROLE_ADMIN matching
            scope.add("ROLE_" + role.trim().toUpperCase());
        }
        return scope.toString();
    }

    public AuthenticationResponse authenticateOAuth2(String email, String fullName, String avatar,String sub) {
        Optional<User> userOptional = userRepository.findByEmail(email);

        User user = userOptional.orElseGet(() -> {
            User newUser = User.builder()
                    .userId(idGeneratorService.generateRandomId("US", userRepository::existsById))
                    .role("USER")
                    .email(email)
                    .username(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .fullName(fullName)
                    .avatarUrl(avatar)
                    .googleId(sub)
                    .isActive(true)
                    .build();
            return userRepository.save(newUser);
        });

        boolean updated = false;
        if (user.getAvatarUrl() == null && avatar != null) {
            user.setAvatarUrl(avatar);
            updated = true;
        }
        if (user.getGoogleId() == null && sub != null) {
            user.setGoogleId(sub);
            updated = true;
        }
        if (updated) {
            userRepository.save(user);
        }

        return AuthenticationResponse.builder()
                .token(generateToken(user))
                .refreshToken(generateRefreshToken(user))
                .authenticated(true)
                .build();
    }

    public String generateRefreshToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .jwtID(UUID.randomUUID().toString())
                .issuer("multilingual-web-chat")
                .issueTime(new Date())
                // FIX #18: Giam thoi gian refresh token tu 30 ngay xuong 7 ngay
                .expirationTime(Date.from(Instant.now().plus(7, ChronoUnit.DAYS)))
                .claim("type", "refresh_token")
                .claim("userId", user.getUserId())
                .build();
        Payload payload = new Payload(claimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);
        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
        return jwsObject.serialize();
    }

    @Transactional
    public AuthenticationResponse refreshToken(com.example.identity.dto.request.RefreshRequest request) throws ParseException, JOSEException {
        var signedJWT = verifyToken(request.getToken(), true);
        String username = signedJWT.getJWTClaimsSet().getSubject();

        // Invalidate old refresh token (rotate token)
        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .id(signedJWT.getJWTClaimsSet().getJWTID())
                .expiryTime(signedJWT.getJWTClaimsSet().getExpirationTime())
                .build();
        invalidatedTokenRepository.save(invalidatedToken);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return AuthenticationResponse.builder()
                .token(generateToken(user))
                .refreshToken(generateRefreshToken(user))
                .authenticated(true)
                .build();
    }

    public String forgotPassword(com.example.identity.dto.request.ForgotPasswordRequest request) throws Exception {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String resetToken = generateRefreshToken(user);
        // FIX #16: Dung bien moi truong FRONTEND_URL thay vi hardcode localhost
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
        try {
            emailService.sendResetPasswordLink(user.getEmail(), user.getUsername(), resetLink);
        } catch (Exception e) {
            log.error("Failed to send email via Brevo for forgotPassword to {}: {}", user.getEmail(), e.getMessage());
            log.info("DEV RESET LINK: {}", resetLink);
        }
        return "Reset password link sent to email: " + user.getEmail();
    }

    @Transactional
    public String resetPassword(com.example.identity.dto.request.ResetPasswordRequest request) throws ParseException, JOSEException {
        var signedJWT = verifyToken(request.getToken(), true);
        String username = signedJWT.getJWTClaimsSet().getSubject();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Invalidate used reset token
        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .id(signedJWT.getJWTClaimsSet().getJWTID())
                .expiryTime(signedJWT.getJWTClaimsSet().getExpirationTime())
                .build();
        invalidatedTokenRepository.save(invalidatedToken);

        return "Password reset successfully";
    }

    @Transactional
    public void createSession(String userId, String refreshToken, String userAgent, String ip) {
        com.example.identity.entity.UserSession session = com.example.identity.entity.UserSession.builder()
                .sessionId(UUID.randomUUID().toString())
                .userId(userId)
                .refreshToken(refreshToken)
                .deviceInfo(userAgent != null ? userAgent : "Unknown Device")
                .ipAddress(ip != null ? ip : "127.0.0.1")
                .lastActive(Instant.now())
                .build();
        userSessionRepository.save(session);
    }

    public List<com.example.identity.dto.response.UserSessionResponse> getActiveSessions(String userId) {
        return userSessionRepository.findByUserIdOrderByLastActiveDesc(userId).stream()
                .map(s -> com.example.identity.dto.response.UserSessionResponse.builder()
                        .sessionId(s.getSessionId())
                        .deviceInfo(s.getDeviceInfo())
                        .ipAddress(s.getIpAddress())
                        .lastActive(s.getLastActive())
                        .build())
                .toList();
    }

    @Transactional
    public void revokeSession(String sessionId) {
        userSessionRepository.deleteById(sessionId);
    }

    // FIX #3: Xoa session chi khi no thuoc ve userId hien tai (chong IDOR)
    @Transactional
    public void revokeSessionForUser(String sessionId, String userId) {
        userSessionRepository.findBySessionIdAndUserId(sessionId, userId)
                .ifPresentOrElse(
                        session -> userSessionRepository.deleteById(sessionId),
                        () -> { throw new AppException(ErrorCode.UNAUTHENTICATED); }
                );
    }

    @Transactional
    public void revokeAllOtherSessions(String userId, String currentSessionId) {
        userSessionRepository.deleteByUserIdAndSessionIdNot(userId, currentSessionId);
    }
}
