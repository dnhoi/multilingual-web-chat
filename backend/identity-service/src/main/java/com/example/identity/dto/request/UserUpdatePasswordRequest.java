package com.example.identity.dto.request;

import com.example.identity.validator.PasswordConstraint;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdatePasswordRequest {
    private String password;

    @NotBlank(message = "New password is required")
    @PasswordConstraint(message = "INVALID_PASSWORD", min = 8)
    private String newPassword;
}

