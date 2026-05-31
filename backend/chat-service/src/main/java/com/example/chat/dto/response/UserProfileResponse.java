package com.example.chat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileResponse {
    private String userId;
    private String username;
    private String fullName;
    private String avatarUrl;
    private String locale;
    private String role;
}
