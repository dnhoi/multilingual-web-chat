package com.example.identity.service;

import com.example.identity.dto.request.*;
import com.example.identity.dto.response.UserProfileResponse;
import com.example.identity.dto.response.UserResponse;
import com.example.identity.entity.InvalidatedToken;
import com.example.identity.entity.User;
import com.example.identity.exception.AppException;
import com.example.identity.exception.ErrorCode;
import com.example.identity.mapper.UserMapper;
import com.example.identity.repository.InvalidatedTokenRepository;
import com.example.identity.repository.UserRepository;
import com.nimbusds.jose.JOSEException;
import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.ParseException;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final IdGeneratorService idGeneratorService;
    private final EmailService emailService;
    private final InvalidatedTokenRepository invalidatedTokenRepository;
    private final AuthenticationService authenticationService;
    private final PasswordEncoder passwordEncoder;

    @NonFinal
    @Value("${spring.activation.base-url}")
    private String baseActiveLink;

    @Transactional
    public UserResponse createUser(UserCreateRequest userCreateRequest) throws Exception {
        if (userRepository.existsByUsername(userCreateRequest.getUsername())) {
            throw new AppException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }
        if (userRepository.existsByEmail(userCreateRequest.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        User user = userMapper.toUser(userCreateRequest);
        user.setUserId(idGeneratorService.generateRandomId("US", userRepository::existsById));
        user.setPassword(passwordEncoder.encode(userCreateRequest.getPassword()));
        user.setRole("USER");
        user.setLocale("US");
        userRepository.save(user);
        try {
            String url = generateActiveLink(user);
            emailService.sendActivationLink(user.getEmail(), user.getUsername(), url);
        } catch (Exception e) {
            log.warn("Error sending activation email (may be due to wrong API Key). Auto-activating account: {}",
                    user.getUsername(), e);
            user.setIsActive(true);
        }
        log.info("New user registered: {}", user.getUsername());
        return userMapper.toUserResponse(user);
    }

    private String generateActiveLink(User user) {
        String token = authenticationService.generateToken(user);
        // NOTE: Never log JWT tokens — they are credentials
        return baseActiveLink + "?token=" + token;
    }

    @PostAuthorize("returnObject.username==authentication.name")
    public UserResponse getMyInfo() {
        var username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponse(user);
    }

    @Transactional
    public String updatePassword(UserUpdatePasswordRequest request) {
        var username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .or(() -> userRepository.findById(username))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 8) {
            throw new AppException(ErrorCode.PASSWORD_MINIMUM);
        }

        String currentPassword = request.getPassword();
        boolean hasCurrentPassword = currentPassword != null && !currentPassword.trim().isEmpty();

        boolean isOAuth2User = (user.getGoogleId() != null && !user.getGoogleId().trim().isEmpty());
        if (!isOAuth2User && user.getPassword() != null && !user.getPassword().isEmpty()) {
            if (!hasCurrentPassword || !passwordEncoder.matches(currentPassword.trim(), user.getPassword())) {
                throw new AppException(ErrorCode.WRONG_PASSWORD);
            }
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        userRepository.save(user);
        log.info("Password updated for user: {}", username);
        return "Change password successfully";
    }

    @Transactional
    public UserResponse updateUser(UserUpdateRequest request) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()
                && !request.getEmail().trim().equalsIgnoreCase(user.getEmail())) {
            String newEmail = request.getEmail().trim();
            if (userRepository.existsByEmail(newEmail)) {
                throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
            }
        }

        if (request.getBirthday() != null && !request.getBirthday().trim().isEmpty()) {
            try {
                java.time.LocalDate birthDate = java.time.LocalDate.parse(request.getBirthday().trim());
                if (birthDate.isAfter(java.time.LocalDate.now())) {
                    throw new AppException(ErrorCode.INVALID_REQUEST);
                }
            } catch (java.time.format.DateTimeParseException e) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }
        }
        userMapper.updateUser(user, request);
        return userMapper.toUserResponse(userRepository.save(user));
    }

    public UserProfileResponse getUserById(String userId) {
        return userRepository.findById(userId)
                .map(userMapper::toUserProfileResponse)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    public List<UserProfileResponse> getUserProfiles(UserIdsRequest request) {
        if (request == null || request.getUserIds() == null || request.getUserIds().isEmpty()) {
            return List.of();
        }
        return userRepository.findAllById(request.getUserIds()).stream()
                .map(userMapper::toUserProfileResponse)
                .toList();
    }

    public List<UserProfileResponse> searchUsers(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        String kw = keyword.trim();
        if (kw.length() < 2 || kw.length() > 50) {
            return List.of();
        }
        List<User> result = userRepository.searchByKeyword(kw);
        return result.stream().map(userMapper::toUserProfileResponse).toList();
    }

    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toUserProfileResponse)
                .toList();
    }

    @Transactional
    public String updateAvatar(String url) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setAvatarUrl(url);
        userRepository.save(user);
        return "Avatar updated successfully";
    }


    @Transactional
    public void activateUser(String token) throws ParseException, JOSEException {
        var signToken = authenticationService.verifyToken(token, false);
        String accessTokenUsername = signToken.getJWTClaimsSet().getSubject();
        String accessTokenId = signToken.getJWTClaimsSet().getJWTID();
        Date accessTokenExpiryTime = signToken.getJWTClaimsSet().getExpirationTime();
        User user = userRepository.findByUsername(accessTokenUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (accessTokenExpiryTime.before(new Date())) {
            throw new AppException(ErrorCode.EXPIRED_TOKEN);
        }
        if (Boolean.TRUE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.ALREADY_ACTIVATE);
        }

        InvalidatedToken invalidatedToken = InvalidatedToken.builder()
                .id(accessTokenId)
                .expiryTime(accessTokenExpiryTime)
                .build();
        invalidatedTokenRepository.save(invalidatedToken);
        user.setIsActive(true);
        userRepository.save(user);
        log.info("User activated: {}", accessTokenUsername);
    }
}
