package com.example.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {
    private String userId;
    private String googleId;
    private String username;
    private String email;
    private String locale;
    private String avatarUrl;
    private String coverUrl;
    private String phone;
    private String country;
    private String timezone;
    private String fullName;
    private Instant createdAt;
    private Instant updatedAt;
    private String role;
    private String bio;
    private String website;
    private String gender;
    private String birthday;
}
