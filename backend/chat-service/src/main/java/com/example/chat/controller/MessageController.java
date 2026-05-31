package com.example.chat.controller;

import com.example.chat.dto.request.MessageRequest;
import com.example.chat.dto.response.ApiResponse;
import com.example.chat.dto.response.MessageResponse;
import com.example.chat.service.ChatService;
import com.example.chat.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/message")
@RequiredArgsConstructor
@Slf4j
public class MessageController {

    private final MessageService messageService;
    private final ChatService chatService;

    @PostMapping
    public ApiResponse<Void> sendMessage(@Valid @RequestBody MessageRequest messageRequest, Principal principal) {
        chatService.sendMessage(messageRequest, principal);
        return ApiResponse.<Void>builder()
                .message("Message sent successfully")
                .build();
    }

    @GetMapping("/{conversationId}")
    public ApiResponse<List<MessageResponse>> getHistoryMessage(@RequestParam(defaultValue = "0") int page,
                                                                @RequestParam(defaultValue = "50") int size,
                                                                @PathVariable String conversationId) {
        Pageable pageable = Pageable.ofSize(size).withPage(page);
        return ApiResponse.<List<MessageResponse>>builder()
                .result(messageService.getHistoryMessage(conversationId, pageable))
                .build();
    }

    @GetMapping("/list")
    public ApiResponse<List<MessageResponse>> getHistoryMessage(@RequestParam(defaultValue = "0") int page,
                                                                @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = Pageable.ofSize(size).withPage(page);
        return ApiResponse.<List<MessageResponse>>builder()
                .result(messageService.getMyMessage(pageable))
                .build();
    }

    @GetMapping("/{conversationId}/search")
    public ApiResponse<List<MessageResponse>> searchMessages(@PathVariable String conversationId,
                                                             @RequestParam String keyword,
                                                             @RequestParam(defaultValue = "0") int page,
                                                             @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = Pageable.ofSize(size).withPage(page);
        return ApiResponse.<List<MessageResponse>>builder()
                .result(messageService.searchMessages(conversationId, keyword, pageable))
                .build();
    }

    @DeleteMapping("/{messageId}")
    public ApiResponse<String> deleteMessage(@PathVariable String messageId) {
        return ApiResponse.<String>builder()
                .message(messageService.deleteMessage(messageId))
                .build();
    }
}
