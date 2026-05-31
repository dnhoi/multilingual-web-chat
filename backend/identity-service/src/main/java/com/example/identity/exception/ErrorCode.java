package com.example.identity.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHORIZED(1000, "You do not have permission", HttpStatus.FORBIDDEN),
    USER_NOT_FOUND(1001, "User not found", HttpStatus.NOT_FOUND),
    WRONG_PASSWORD(1002, "Password is wrong", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1003, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    PASSWORD_MINIMUM(1004, "Password minimum 8 characters", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1005, "Password must be at least 8 characters and contain uppercase, lowercase, numbers, and special characters", HttpStatus.BAD_REQUEST),
    NOT_ACTIVATE_YET(1006, "User not activate yet", HttpStatus.BAD_REQUEST),
    EXPIRED_TOKEN(1007, "Expired token", HttpStatus.BAD_REQUEST),
    ALREADY_ACTIVATE(1008, "User already activated", HttpStatus.BAD_REQUEST),
    EMAIL_ALREADY_EXISTS(1009, "Email already exists", HttpStatus.CONFLICT),
    USERNAME_ALREADY_EXISTS(1010, "Username already exists", HttpStatus.CONFLICT),
    INVALID_REQUEST(1011, "Invalid request data", HttpStatus.BAD_REQUEST),
    // Khoa tai khoan sau nhieu lan dang nhap that bai; thong bao loi chung chong user enumeration
    ACCOUNT_LOCKED(1012, "Account temporarily locked due to too many failed attempts. Try again in 15 minutes.", HttpStatus.TOO_MANY_REQUESTS),
    INVALID_CREDENTIALS(1013, "Invalid username or password", HttpStatus.UNAUTHORIZED),
    INVALID_PHONE(1014, "Invalid phone number format", HttpStatus.BAD_REQUEST);


    private final Integer code;
    private final String message;
    private final HttpStatusCode status;

    ErrorCode(Integer code, String message,HttpStatusCode status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }
}