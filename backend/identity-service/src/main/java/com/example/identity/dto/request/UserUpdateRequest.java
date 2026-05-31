package com.example.identity.dto.request;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {

    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    private String avatarUrl;
    private String coverUrl;

    @Pattern(regexp = "^$|^[+0-9\\s.-]{8,20}$", message = "Invalid phone number format")
    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    private String phone;

    @Size(max = 100, message = "Country must not exceed 100 characters")
    private String country;

    @Size(max = 50, message = "Timezone must not exceed 50 characters")
    private String timezone;

    @Size(max = 10, message = "Locale must not exceed 10 characters")
    private String locale;

    @Size(max = 500, message = "Bio must not exceed 500 characters")
    private String bio;

    @Size(max = 255, message = "Website must not exceed 255 characters")
    private String website;

    @Pattern(regexp = "^$|Male|Female|Other$", message = "Gender must be Male, Female, or Other")
    private String gender;

    @Size(max = 20, message = "Birthday must not exceed 20 characters")
    private String birthday;

    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;
}
