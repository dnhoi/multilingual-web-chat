package com.example.identity.validator;

import jakarta.validation.ConstraintValidator;

public class PasswordValidator implements ConstraintValidator<PasswordConstraint, String> {

    // Yeu cau mat khau manh hon: it nhat 8 ky tu, co chu hoa, chu thuong, so va ky tu dac biet
    private static final String PASSWORD_PATTERN =
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?])[A-Za-z\\d!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]{8,}$";
    // BCrypt hashes always start with $2a$, $2b$, or $2y$
    private static final String BCRYPT_PREFIX_PATTERN = "^\\$2[aby]\\$.*";

    @Override
    public boolean isValid(String password, jakarta.validation.ConstraintValidatorContext constraintValidatorContext) {
        if(password == null) {
            return false;
        }
        if(password.matches(BCRYPT_PREFIX_PATTERN)) {
            return true;
        }
        return password.matches(PASSWORD_PATTERN);
    }
}
