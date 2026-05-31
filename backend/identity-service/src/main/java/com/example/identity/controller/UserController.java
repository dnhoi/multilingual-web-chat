package com.example.identity.controller;

import com.example.identity.dto.request.AvatarUpdateRequest;
import com.example.identity.dto.request.UserCreateRequest;
import com.example.identity.dto.request.UserIdsRequest;
import com.example.identity.dto.request.UserUpdatePasswordRequest;
import com.example.identity.dto.request.UserUpdateRequest;
import com.example.identity.dto.response.ApiResponse;
import com.example.identity.dto.response.UserProfileResponse;
import com.example.identity.dto.response.UserResponse;
import com.example.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody UserCreateRequest userCreateRequest) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<UserResponse>builder()
                        .result(userService.createUser(userCreateRequest))
                        .build());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<UserResponse>> getMyInfo() {
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(@PathVariable String userId) {
        return ResponseEntity.ok(ApiResponse.<UserProfileResponse>builder()
                .result(userService.getUserById(userId))
                .build());
    }

    @PutMapping
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@Valid @RequestBody UserUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.<UserResponse>builder()
                .result(userService.updateUser(request))
                .build());
    }

    @PutMapping("/avatar")
    public ResponseEntity<ApiResponse<String>> updateAvatar(@Valid @RequestBody AvatarUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .message(userService.updateAvatar(request.getUrl()))
                .build());
    }



    @PostMapping("/batch")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getUserProfiles(@Valid @RequestBody UserIdsRequest request) {
        return ResponseEntity.ok(ApiResponse.<List<UserProfileResponse>>builder()
                .result(userService.getUserProfiles(request))
                .build());
    }

    @PutMapping("/update-password")
    public ResponseEntity<ApiResponse<String>> updatePassword(@Valid @RequestBody UserUpdatePasswordRequest request) {
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .message(userService.updatePassword(request))
                .build());
    }

    @PostMapping("/find-user")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> findUser(@RequestParam("request") String keyword) {
        return ResponseEntity.ok(ApiResponse.<List<UserProfileResponse>>builder()
                .result(userService.searchUsers(keyword))
                .build());
    }

    @PreAuthorize("hasAnyAuthority('SCOPE_ROLE_ADMIN', 'ROLE_ADMIN') or hasRole('ADMIN')")
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.<List<UserProfileResponse>>builder()
                .result(userService.getAllUsers())
                .build());
    }
}
