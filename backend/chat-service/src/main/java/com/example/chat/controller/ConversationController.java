package com.example.chat.controller;

import com.example.chat.dto.request.ConversationRequest;
import com.example.chat.dto.request.CreateGroupRequest;
import com.example.chat.dto.request.UserIdsRequest;
import com.example.chat.dto.response.ApiResponse;
import com.example.chat.dto.response.ConversationResponse;
import com.example.chat.service.ConversationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Slf4j
public class ConversationController {

    private final ConversationService conversationService;

    @PostMapping("/conversation")
    public ApiResponse<ConversationResponse> createConversation(@RequestBody ConversationRequest conversationRequest) {
        return ApiResponse.<ConversationResponse>builder()
                .result(conversationService.createConversation(conversationRequest))
                .build();
    }

    @PostMapping("/conversation/group")
    public ApiResponse<ConversationResponse> createGroupConversation(@RequestBody CreateGroupRequest request) {
        return ApiResponse.<ConversationResponse>builder()
                .result(conversationService.createConversationGroup(request))
                .build();
    }

    @PostMapping("/conversation/out")
    public ApiResponse<String> outConversation(@RequestBody String conversationId) {
        return ApiResponse.<String>builder()
                .message(conversationService.outConversation(conversationId))
                .build();
    }

    @PostMapping("/{conversationId}/out")
    public ApiResponse<String> outConversationPath(@PathVariable String conversationId) {
        return ApiResponse.<String>builder()
                .message(conversationService.outConversation(conversationId))
                .build();
    }

    @PostMapping("/{conversationId}/group/member")
    public ApiResponse<String> addMemberToGroupConversation(@PathVariable String conversationId, @RequestBody UserIdsRequest request) {
        return ApiResponse.<String>builder()
                .message(conversationService.addMemberToGroupConversation(conversationId, request))
                .build();
    }

    @PutMapping("/{conversationId}/locale")
    public ApiResponse<String> updateConversationLocale(@PathVariable String conversationId, @RequestBody String locale) {
        return ApiResponse.<String>builder()
                .message(conversationService.updateConversationLocale(conversationId, locale))
                .build();
    }

    @PutMapping("/{conversationId}/name")
    public ApiResponse<String> updateConversationName(@PathVariable String conversationId, @RequestBody String name) {
        return ApiResponse.<String>builder()
                .message(conversationService.updateConversationName(conversationId, name))
                .build();
    }

    @PutMapping("/{conversationId}/avatar")
    public ApiResponse<String> updateConversationAvatar(@PathVariable String conversationId, @RequestBody String avatarUrl) {
        return ApiResponse.<String>builder()
                .message(conversationService.updateConversationAvatar(conversationId, avatarUrl))
                .build();
    }

    @PutMapping("/{conversationId}/description")
    public ApiResponse<String> updateConversationDescription(@PathVariable String conversationId, @RequestBody String description) {
        return ApiResponse.<String>builder()
                .message(conversationService.updateConversationDescription(conversationId, description))
                .build();
    }

    @PutMapping("/{conversationId}/archive")
    public ApiResponse<String> toggleArchive(@PathVariable String conversationId) {
        return ApiResponse.<String>builder()
                .message(conversationService.toggleArchive(conversationId))
                .build();
    }

    @PutMapping("/{conversationId}/pin")
    public ApiResponse<String> togglePin(@PathVariable String conversationId) {
        return ApiResponse.<String>builder()
                .message(conversationService.togglePin(conversationId))
                .build();
    }

    @PutMapping("/{conversationId}/favorite")
    public ApiResponse<String> toggleFavorite(@PathVariable String conversationId) {
        return ApiResponse.<String>builder()
                .message(conversationService.toggleFavorite(conversationId))
                .build();
    }

    @PutMapping("/{conversationId}/mute")
    public ApiResponse<String> toggleMute(@PathVariable String conversationId) {
        return ApiResponse.<String>builder()
                .message(conversationService.toggleMute(conversationId))
                .build();
    }

    @DeleteMapping("/{conversationId}")
    public ApiResponse<String> deleteConversation(@PathVariable String conversationId) {
        return ApiResponse.<String>builder()
                .message(conversationService.deleteConversation(conversationId))
                .build();
    }

    @PostMapping("/{conversationId}/member/{memberId}/role")
    public ApiResponse<String> changeMemberRole(@PathVariable String conversationId,
                                                @PathVariable String memberId,
                                                @RequestParam(required = false) String role,
                                                @RequestBody(required = false) String bodyRole) {
        String finalRole = (role != null && !role.isBlank()) ? role : bodyRole;
        return ApiResponse.<String>builder()
                .message(conversationService.changeMemberRole(conversationId, memberId, finalRole))
                .build();
    }

    @PostMapping("/{conversationId}/member/{memberId}/kick")
    public ApiResponse<String> kickMember(@PathVariable String conversationId, @PathVariable String memberId) {
        return ApiResponse.<String>builder()
                .message(conversationService.kickMember(conversationId, memberId))
                .build();
    }

    @PostMapping("/{conversationId}/member/{memberId}/mute")
    public ApiResponse<String> toggleMuteMember(@PathVariable String conversationId, @PathVariable String memberId) {
        return ApiResponse.<String>builder()
                .message(conversationService.toggleMuteMember(conversationId, memberId))
                .build();
    }

    @PostMapping("/{conversationId}/member/{memberId}/ban")
    public ApiResponse<String> toggleBanMember(@PathVariable String conversationId, @PathVariable String memberId) {
        return ApiResponse.<String>builder()
                .message(conversationService.toggleBanMember(conversationId, memberId))
                .build();
    }

    @PutMapping("/{conversationId}/announcement")
    public ApiResponse<String> updateAnnouncement(@PathVariable String conversationId, @RequestBody String announcement) {
        return ApiResponse.<String>builder()
                .message(conversationService.updateAnnouncement(conversationId, announcement))
                .build();
    }

    @PutMapping("/{conversationId}/slow-mode")
    public ApiResponse<String> updateSlowMode(@PathVariable String conversationId, @RequestBody Integer slowModeSeconds) {
        return ApiResponse.<String>builder()
                .message(conversationService.updateSlowMode(conversationId, slowModeSeconds))
                .build();
    }

    @GetMapping("/{conversationId}/invite-code")
    public ApiResponse<String> getInviteCode(@PathVariable String conversationId) {
        return ApiResponse.<String>builder()
                .result(conversationService.getInviteCode(conversationId))
                .build();
    }

    @PostMapping("/conversation/join/{inviteCode}")
    public ApiResponse<String> joinByInviteCode(@PathVariable String inviteCode) {
        return ApiResponse.<String>builder()
                .result(conversationService.joinByInviteCode(inviteCode))
                .build();
    }
}
