package com.example.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserProfileResponse {
    private String userId;
    private String username;
    private String email;
    private String fullName;
    private String avatarUrl;
    private String coverUrl;
    private String phone;
    private String country;
    private String timezone;
    private String locale;
    private String bio;
    private String website;
    private String gender;
    private String birthday;
    private String role;
    private Boolean isActive;
}
