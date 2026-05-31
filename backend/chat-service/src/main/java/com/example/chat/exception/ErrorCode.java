package com.example.chat.exception;

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
    INVALID_PASSWORD(1005, "Invalid password", HttpStatus.BAD_REQUEST),
    CONVERSATION_NOT_FOUND(1006, "Conversation not found", HttpStatus.NOT_FOUND),
    INVALID_MESSAGE_TYPE(1007, "Invalid message type", HttpStatus.BAD_REQUEST),
    GROUP_MINIMUM_MEMBERS(1008, "Group chat must have at least 3 members", HttpStatus.BAD_REQUEST),
    MEMBER_NOT_IN_GROUP(1009, "User is not a member of this conversation", HttpStatus.FORBIDDEN),
    MEMBER_MUTED(1010, "You are muted in this conversation", HttpStatus.FORBIDDEN),
    MEMBER_BANNED(1011, "You are banned from this conversation", HttpStatus.FORBIDDEN),
    SLOW_MODE_LIMIT(1012, "Please wait before sending another message (Slow Mode active)", HttpStatus.TOO_MANY_REQUESTS),
    INVALID_REQUEST(1013, "Invalid request", HttpStatus.BAD_REQUEST);

    private final Integer code;
    private final String message;
    private final HttpStatusCode status;

    ErrorCode(Integer code, String message, HttpStatusCode status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }
}