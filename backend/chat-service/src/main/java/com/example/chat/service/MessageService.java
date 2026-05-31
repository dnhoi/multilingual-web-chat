package com.example.chat.service;

import com.example.chat.dto.request.UserIdsRequest;
import com.example.chat.dto.response.ApiResponse;
import com.example.chat.dto.response.MessageResponse;
import com.example.chat.dto.response.UserProfileResponse;
import com.example.chat.entity.Conversation;
import com.example.chat.entity.GroupMember;
import com.example.chat.entity.Message;
import com.example.chat.exception.AppException;
import com.example.chat.exception.ErrorCode;
import com.example.chat.mapper.MessageMapper;
import com.example.chat.repository.ConversationRepository;
import com.example.chat.repository.GroupMemberRepository;
import com.example.chat.repository.MessageRepository;
import com.example.chat.client.IdentityBatchClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Dịch vụ xử lý truy vấn lịch sử tin nhắn, danh sách cuộc trò chuyện và tìm kiếm tin nhắn.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final MessageMapper messageMapper;
    private final IdentityBatchClient identityBatchClient;
    private final ConversationRepository conversationRepository;

    public List<MessageResponse> getHistoryMessage(String conversationId, Pageable pageable) {
        String userId = getUserId();
        if (!groupMemberRepository.existsByIdUserIdAndIdConversationId(userId, conversationId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        Conversation conversation = conversationRepository.findByConversationId(conversationId);
        if (conversation == null) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        }
        return messageRepository.findAllByConversationOrderBySentDatetimeDesc(conversation, pageable).stream().map(messageMapper::toMessageResponse).toList();
    }

    public List<MessageResponse> searchMessages(String conversationId, String keyword, Pageable pageable) {
        String userId = getUserId();
        if (!groupMemberRepository.existsByIdUserIdAndIdConversationId(userId, conversationId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        Conversation conversation = conversationRepository.findByConversationId(conversationId);
        if (conversation == null) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        }
        return messageRepository.findByConversationAndMessageTextContainingIgnoreCaseOrderBySentDatetimeDesc(conversation, keyword, pageable).stream().map(messageMapper::toMessageResponse).toList();
    }


    public List<MessageResponse> getMyMessage(Pageable pageable) {
        String userId = getUserId();

        List<Message> messages = messageRepository.findLastMessagesByUserId(userId, pageable);
        if (messages.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> conversationIds = messages.stream()
                .map(m -> m.getConversation().getConversationId())
                .collect(Collectors.toSet());

        Map<String, List<com.example.chat.entity.GroupMember>> conversationMembersMap = groupMemberRepository
                .findByIdConversationIdIn(conversationIds).stream()
                .collect(Collectors.groupingBy(gm -> gm.getId().getConversationId()));

        Set<String> allUserIds = conversationMembersMap.values().stream()
                .flatMap(Collection::stream)
                .map(gm -> gm.getId().getUserId())
                .collect(Collectors.toSet());

        Map<String, UserProfileResponse> userMap = Collections.emptyMap();

        if (!allUserIds.isEmpty()) {
            UserIdsRequest userIdsRequest = UserIdsRequest.builder()
                    .userIds(new ArrayList<>(allUserIds))
                    .build();

            ApiResponse<List<UserProfileResponse>> userResponses = identityBatchClient.getBatchInfo(userIdsRequest);

            if (userResponses != null && userResponses.getResult() != null) {
                userMap = userResponses.getResult().stream()
                        .collect(Collectors.toMap(UserProfileResponse::getUserId, u -> u, (u1, u2) -> u1));
            }
        }

        Map<String, UserProfileResponse> finalUserMap = userMap;
        return messages.stream()
                .map(m -> {
                    String conversationId = m.getConversation().getConversationId();
                    List<com.example.chat.entity.GroupMember> gMembers = conversationMembersMap.getOrDefault(conversationId, List.of());

                    List<UserProfileResponse> memberProfiles = gMembers.stream()
                            .map(gm -> {
                                UserProfileResponse base = finalUserMap.get(gm.getId().getUserId());
                                String fName = base != null ? base.getFullName() : "User " + gm.getId().getUserId();
                                String avt = base != null ? base.getAvatarUrl() : null;
                                String loc = base != null ? base.getLocale() : null;

                                return UserProfileResponse.builder()
                                        .userId(gm.getId().getUserId())
                                        .fullName(fName)
                                        .avatarUrl(avt)
                                        .locale(loc)
                                        .role(gm.getRole())
                                        .build();
                            })
                            .toList();

                    return MessageResponse.builder()
                            .messageText(m.getMessageText())
                            .messageTextTranslate(m.getMessageTextTranslate())
                            .sentDatetime(m.getSentDatetime())
                            .userId(m.getUserId())
                            .conversationId(conversationId)
                            .userProfiles(memberProfiles)
                            .conversationName(m.getConversation().getConversationName())
                            .conversationType(m.getConversation().getType())
                            .groupAvtUrl(m.getConversation().getAvatarUrl())
                            .groupLocale(m.getConversation().getLocale())
                            .type(m.getType())
                            .build();
                })
                .toList();
    }

    public String deleteMessage(String messageId) {
        String currentUserId = getUserId();
        Message message = messageRepository.findById(Long.parseLong(messageId))
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        String conversationId = message.getConversation().getConversationId();
        GroupMember gm = groupMemberRepository.findByIdUserIdAndIdConversationId(currentUserId, conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_IN_GROUP));

        boolean isAuthor = message.getUserId().equals(currentUserId);
        boolean isAdminOrOwner = "OWNER".equalsIgnoreCase(gm.getRole()) || "ADMIN".equalsIgnoreCase(gm.getRole());

        if (!isAuthor && !isAdminOrOwner) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Không được phép xóa/thu hồi tin nhắn sau 24 giờ nếu là người gửi (không phải quản trị viên nhóm)
        if (isAuthor && !isAdminOrOwner && message.getSentDatetime() != null) {
            if (message.getSentDatetime().plus(java.time.Duration.ofHours(24)).isBefore(java.time.Instant.now())) {
                throw new AppException(ErrorCode.INVALID_REQUEST);
            }
        }

        message.setIsDeleted(true);
        message.setMessageText(isAuthor ? "Tin nhắn đã bị xóa" : "Tin nhắn đã bị xóa bởi Quản trị viên");
        message.setMessageTextTranslate(null);
        messageRepository.save(message);
        return "Xóa tin nhắn thành công";
    }

    private String getUserId() {
        String userId = null;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if(authentication.getPrincipal() instanceof Jwt jwt) {
            userId = jwt.getClaimAsString("userId");
        }
        if(userId == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return userId;
    }
}
