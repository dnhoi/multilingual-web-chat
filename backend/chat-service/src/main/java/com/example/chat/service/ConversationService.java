package com.example.chat.service;

import com.example.chat.client.IdentityClient;
import com.example.chat.dto.request.ConversationRequest;
import com.example.chat.dto.request.CreateGroupRequest;
import com.example.chat.dto.request.UserIdsRequest;
import com.example.chat.dto.response.ApiResponse;
import com.example.chat.dto.response.ConversationResponse;
import com.example.chat.dto.response.MessageResponse;
import com.example.chat.dto.response.UserProfileResponse;
import com.example.chat.entity.Conversation;
import com.example.chat.entity.GroupMember;
import com.example.chat.entity.GroupMemberId;
import com.example.chat.entity.Message;
import com.example.chat.exception.AppException;
import com.example.chat.exception.ErrorCode;
import com.example.chat.mapper.MessageMapper;
import com.example.chat.repository.ConversationRepository;
import com.example.chat.repository.GroupMemberRepository;
import com.example.chat.repository.MessageRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * Dịch vụ quản lý cuộc trò chuyện (1-1 và nhóm), thành viên và quyền hạn trong nhóm.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ConversationService {

    private final IdGeneratorService idGeneratorService;
    private final GroupMemberRepository groupMemberRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final IdentityClient identityClient;
    private final MessageMapper messageMapper;

    @Autowired
    @Lazy
    private SimpMessagingTemplate simpMessagingTemplate;

    private void sendSystemNotification(Conversation conversation, String text) {
        if (conversation == null) return;
        try {
            Message systemMsg = Message.builder()
                    .conversation(conversation)
                    .userId("SYSTEM")
                    .type("NOTIFICATION")
                    .messageText(text)
                    .status("SENT")
                    .isEdited(false)
                    .isDeleted(false)
                    .isPinned(false)
                    .build();
            messageRepository.save(systemMsg);

            MessageResponse response = messageMapper.toMessageResponse(systemMsg);
            response.setAction("SEND");
            simpMessagingTemplate.convertAndSend("/topic/" + conversation.getConversationId(), response);
        } catch (Exception e) {
            log.warn("Could not broadcast system notification: {}", e.getMessage());
        }
    }

    private String getUserFullName(String userId) {
        if (userId == null) return "Thành viên";
        try {
            ApiResponse<UserProfileResponse> profile = identityClient.getInfo(userId);
            if (profile != null && profile.getResult() != null) {
                UserProfileResponse res = profile.getResult();
                if (org.springframework.util.StringUtils.hasText(res.getFullName())) {
                    return res.getFullName();
                }
                if (org.springframework.util.StringUtils.hasText(res.getUsername())) {
                    return res.getUsername();
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch name for user {}: {}", userId, e.getMessage());
        }
        return userId;
    }

    public boolean userHasAccessToConversation(String userId, String conversationId) {
        Optional<String> conversation = groupMemberRepository.findConversationIdByUserIdAndConversationId(userId, conversationId);
        return conversation.isPresent();
    }

    @Transactional
    public ConversationResponse createConversation(ConversationRequest conversationRequest) {
        String userId = getUserId();
        if (userId.equals(conversationRequest.getToUserId())) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        Optional<String> conversationId = groupMemberRepository.findConversationIdBetweenTwoUsers(conversationRequest.getToUserId(), userId);
        if(conversationId.isPresent()) {
            return ConversationResponse.builder().conversationId(conversationId.get()).build();
        } else {
            String newConversationId = idGeneratorService.generateRandomId("C_", conversationRepository::existsById);
            Conversation conversation = Conversation.builder()
                    .conversationId(newConversationId)
                    .build();
            log.info("Create conversation: " + conversation.getConversationId());
            conversationRepository.save(conversation);
            GroupMember groupMember1 = GroupMember.builder()
                    .conversation(conversation)
                    .id(GroupMemberId.builder()
                            .conversationId(conversation.getConversationId())
                            .userId(conversationRequest.getToUserId())
                            .build())
                    .build();
            GroupMember groupMember2 = GroupMember.builder()
                    .conversation(conversation)
                    .id(GroupMemberId.builder()
                            .conversationId(conversation.getConversationId())
                            .userId(userId)
                            .build())
                    .build();
            groupMemberRepository.saveAll(List.of(groupMember1, groupMember2));
            return ConversationResponse.builder()
                    .conversationId(newConversationId)
                    .build();
        }
    }

    private String getUserId() {
        String userId = null;
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if(authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            userId = jwt.getClaimAsString("userId");
        }
        if(userId == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return userId;
    }

    private GroupMember checkIsMember(String conversationId, String userId) {
        return groupMemberRepository.findByIdUserIdAndIdConversationId(userId, conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.MEMBER_NOT_IN_GROUP));
    }

    private GroupMember checkIsAdminOrOwner(String conversationId, String userId) {
        GroupMember gm = checkIsMember(conversationId, userId);
        if (!"OWNER".equalsIgnoreCase(gm.getRole()) && !"ADMIN".equalsIgnoreCase(gm.getRole())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return gm;
    }

    @Transactional
    public ConversationResponse createConversationGroup(CreateGroupRequest request) {
        String currentUserId = getUserId();
        java.util.Set<String> allUserIds = new java.util.HashSet<>();
        if (request.getUserIds() != null) {
            allUserIds.addAll(request.getUserIds());
        }
        if (currentUserId != null) {
            allUserIds.add(currentUserId);
        }

        if (allUserIds.size() < 3) {
            throw new AppException(ErrorCode.GROUP_MINIMUM_MEMBERS);
        }

        Conversation conversation = Conversation.builder()
                .conversationName(request.getConversationName())
                .locale(request.getLocale())
                .type("GROUP")
                .conversationId(idGeneratorService.generateRandomId("C_", conversationRepository::existsById))
                .build();
        conversationRepository.save(conversation);

        List<GroupMember> members = allUserIds.stream()
                .map(userId -> {
                    boolean isOwner = userId.equalsIgnoreCase(currentUserId);
                    return GroupMember.builder()
                            .id(new GroupMemberId(userId, conversation.getConversationId()))
                            .conversation(conversation)
                            .role(isOwner ? "OWNER" : "MEMBER")
                            .build();
                })
                .toList();

        // Đảm bảo người tạo nhóm có vai trò OWNER (Trưởng nhóm)
        boolean hasOwner = members.stream().anyMatch(m -> "OWNER".equalsIgnoreCase(m.getRole()));
        if (!hasOwner && !members.isEmpty()) {
            members.get(0).setRole("OWNER");
        }

        groupMemberRepository.saveAll(members);
        return ConversationResponse.builder()
                .conversationId(conversation.getConversationId())
                .build();
    }

    public String updateConversationLocale(String conversationId, String locale) {
        String userId = getUserId();
        checkIsMember(conversationId, userId);
        Conversation conversation = conversationRepository.findByConversationId(conversationId);
        if(conversation == null) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        }
        conversation.setLocale(locale);
        conversationRepository.save(conversation);
        sendSystemNotification(conversation, getUserFullName(userId) + " đã thay đổi ngôn ngữ dịch của nhóm");
        return "Locale update success";
    }

    public String updateConversationName(String conversationId, String name) {
        String userId = getUserId();
        checkIsAdminOrOwner(conversationId, userId);
        Conversation conversation = conversationRepository.findByConversationId(conversationId);
        if(conversation == null) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        }
        conversation.setConversationName(name);
        conversationRepository.save(conversation);
        sendSystemNotification(conversation, getUserFullName(userId) + " đã đổi tên nhóm thành \"" + name + "\"");
        return "Name updated success";
    }

    public String updateConversationAvatar(String conversationId, String avatarUrl) {
        String userId = getUserId();
        checkIsAdminOrOwner(conversationId, userId);
        Conversation conversation = conversationRepository.findByConversationId(conversationId);
        if(conversation == null) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        }
        conversation.setAvatarUrl(avatarUrl);
        conversationRepository.save(conversation);
        sendSystemNotification(conversation, getUserFullName(userId) + " đã cập nhật ảnh đại diện nhóm");
        return "Avatar updated success";
    }

    public String updateConversationDescription(String conversationId, String description) {
        String userId = getUserId();
        checkIsAdminOrOwner(conversationId, userId);
        Conversation conversation = conversationRepository.findByConversationId(conversationId);
        if(conversation == null) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        }
        conversation.setDescription(description);
        conversationRepository.save(conversation);
        return "Description updated success";
    }

    public String addMemberToGroupConversation(String conversationId, UserIdsRequest request) {
        String userId = getUserId();
        checkIsMember(conversationId, userId);
        Conversation conversation = conversationRepository.findByConversationId(conversationId);
        if(conversation == null) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        }
        List<GroupMember> members = request.getUserIds().stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .filter(targetUserId -> !groupMemberRepository
                        .existsByIdUserIdAndIdConversationId(targetUserId, conversationId))
                .map(targetUserId -> GroupMember.builder()
                        .id(new GroupMemberId(targetUserId, conversationId))
                        .conversation(conversation)
                        .build())
                .toList();
        groupMemberRepository.saveAll(members);
        if (!members.isEmpty()) {
            List<String> addedNames = members.stream()
                    .map(m -> getUserFullName(m.getId().getUserId()))
                    .toList();
            String namesStr = String.join(", ", addedNames);
            sendSystemNotification(conversation, getUserFullName(getUserId()) + " đã thêm " + namesStr + " vào nhóm");
        }
        return "User added to the conversation.";
    }

    @Transactional
    public String outConversation(String conversationId) {
        String userId = getUserId();
        String cleanId = conversationId != null ? conversationId.replace("\"", "").trim() : "";
        GroupMember groupMember = groupMemberRepository.findByIdUserIdAndIdConversationId(userId, cleanId).orElseThrow(
                () -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        String leavingRole = groupMember.getRole();
        groupMemberRepository.delete(groupMember);

        Conversation conversation = conversationRepository.findByConversationId(cleanId);
        if (conversation != null) {
            String userName = getUserFullName(userId);

            Message systemMsg = Message.builder()
                    .conversation(conversation)
                    .userId(userId)
                    .type("NOTIFICATION")
                    .messageText(userName + " đã rời khỏi nhóm")
                    .status("SENT")
                    .isEdited(false)
                    .isDeleted(false)
                    .isPinned(false)
                    .build();
            messageRepository.save(systemMsg);

            try {
                MessageResponse response = messageMapper.toMessageResponse(systemMsg);
                response.setAction("SEND");
                simpMessagingTemplate.convertAndSend("/topic/" + cleanId, response);
            } catch (Exception e) {
                log.warn("Could not broadcast leave message via WS: {}", e.getMessage());
            }
        }

        // Tự động chuyển giao vai trò Trưởng nhóm (OWNER) cho thành viên còn lại nếu trưởng nhóm rời đi, hoặc giải tán nhóm nếu không còn ai
        List<GroupMember> remainingMembers = groupMemberRepository.findByIdConversationId(cleanId);
        if (remainingMembers == null || remainingMembers.isEmpty()) {
            if (conversation != null) {
                messageRepository.deleteByConversation(conversation);
                conversationRepository.delete(conversation);
            }
        } else if ("OWNER".equalsIgnoreCase(leavingRole) || "ADMIN".equalsIgnoreCase(leavingRole)) {
            boolean hasOtherAdmin = remainingMembers.stream()
                    .anyMatch(m -> "OWNER".equalsIgnoreCase(m.getRole()) || "ADMIN".equalsIgnoreCase(m.getRole()));
            if (!hasOtherAdmin) {
                GroupMember nextAdmin = remainingMembers.get(0);
                nextAdmin.setRole("OWNER");
                groupMemberRepository.save(nextAdmin);
                log.info("Auto-transferred OWNER role to user {} for group {}", nextAdmin.getId().getUserId(), cleanId);
            }
        }

        return "Out conversation success";
    }

    public String toggleArchive(String conversationId) {
        Conversation conversation = conversationRepository.findByConversationId(conversationId);
        if (conversation == null) throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        conversation.setIsArchived(!Boolean.TRUE.equals(conversation.getIsArchived()));
        conversationRepository.save(conversation);
        return "Archive status updated";
    }

    public String togglePin(String conversationId) {
        Conversation conversation = conversationRepository.findByConversationId(conversationId);
        if (conversation == null) throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        conversation.setIsPinned(!Boolean.TRUE.equals(conversation.getIsPinned()));
        conversationRepository.save(conversation);
        return "Pin status updated";
    }

    public String toggleFavorite(String conversationId) {
        Conversation conversation = conversationRepository.findByConversationId(conversationId);
        if (conversation == null) throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        conversation.setIsFavorite(!Boolean.TRUE.equals(conversation.getIsFavorite()));
        conversationRepository.save(conversation);
        return "Favorite status updated";
    }

    public String toggleMute(String conversationId) {
        Conversation conversation = conversationRepository.findByConversationId(conversationId);
        if (conversation == null) throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        conversation.setIsMuted(!Boolean.TRUE.equals(conversation.getIsMuted()));
        conversationRepository.save(conversation);
        return "Mute status updated";
    }

    @Transactional
    public String deleteConversation(String conversationId) {
        String userId = getUserId();
        GroupMember gm = checkIsMember(conversationId, userId);
        // Trong nhóm chỉ OWNER mới có quyền xóa/giải tán nhóm
        Conversation conversation = conversationRepository.findByConversationId(conversationId);
        if (conversation == null) throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        if ("GROUP".equalsIgnoreCase(conversation.getType()) && !"OWNER".equalsIgnoreCase(gm.getRole())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        groupMemberRepository.deleteByIdConversationId(conversationId);
        messageRepository.deleteByConversation(conversation);
        conversationRepository.delete(conversation);
        return "Conversation deleted successfully";
    }

    public String changeMemberRole(String conversationId, String memberId, String role) {
        String currentUserId = getUserId();
        checkIsAdminOrOwner(conversationId, currentUserId);
        GroupMember gm = groupMemberRepository.findByIdUserIdAndIdConversationId(memberId, conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
        gm.setRole(role);
        groupMemberRepository.save(gm);
        sendSystemNotification(gm.getConversation(), getUserFullName(currentUserId) + " đã đổi vai trò của " + getUserFullName(memberId) + " thành " + role);
        return "Member role updated to " + role;
    }

    @Transactional
    public String kickMember(String conversationId, String memberId) {
        String currentUserId = getUserId();
        checkIsAdminOrOwner(conversationId, currentUserId);
        GroupMember gm = groupMemberRepository.findByIdUserIdAndIdConversationId(memberId, conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
        Conversation conversation = gm.getConversation();
        groupMemberRepository.delete(gm);
        sendSystemNotification(conversation, getUserFullName(currentUserId) + " đã xóa " + getUserFullName(memberId) + " khỏi nhóm");
        return "Member kicked successfully";
    }

    public String toggleMuteMember(String conversationId, String memberId) {
        String currentUserId = getUserId();
        checkIsAdminOrOwner(conversationId, currentUserId);
        GroupMember gm = groupMemberRepository.findByIdUserIdAndIdConversationId(memberId, conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
        gm.setIsMuted(!Boolean.TRUE.equals(gm.getIsMuted()));
        groupMemberRepository.save(gm);
        sendSystemNotification(gm.getConversation(), getUserFullName(currentUserId) + " đã " + (Boolean.TRUE.equals(gm.getIsMuted()) ? "tắt tiếng" : "bật tiếng") + " " + getUserFullName(memberId));
        return "Member mute status updated";
    }

    public String toggleBanMember(String conversationId, String memberId) {
        String currentUserId = getUserId();
        checkIsAdminOrOwner(conversationId, currentUserId);
        GroupMember gm = groupMemberRepository.findByIdUserIdAndIdConversationId(memberId, conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
        gm.setIsBanned(!Boolean.TRUE.equals(gm.getIsBanned()));
        groupMemberRepository.save(gm);
        sendSystemNotification(gm.getConversation(), getUserFullName(currentUserId) + " đã " + (Boolean.TRUE.equals(gm.getIsBanned()) ? "chặn" : "bỏ chặn") + " " + getUserFullName(memberId));
        return "Member ban status updated";
    }

    public String updateAnnouncement(String conversationId, String announcement) {
        String currentUserId = getUserId();
        checkIsAdminOrOwner(conversationId, currentUserId);
        Conversation conversation = conversationRepository.findByConversationId(conversationId);
        if (conversation == null) throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        conversation.setAnnouncement(announcement);
        conversationRepository.save(conversation);
        return "Announcement updated successfully";
    }

    public String updateSlowMode(String conversationId, Integer slowModeSeconds) {
        String currentUserId = getUserId();
        checkIsAdminOrOwner(conversationId, currentUserId);
        Conversation conversation = conversationRepository.findByConversationId(conversationId);
        if (conversation == null) throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        conversation.setSlowModeSeconds(slowModeSeconds != null ? slowModeSeconds : 0);
        conversationRepository.save(conversation);
        return "Slow mode updated successfully";
    }

    public String getInviteCode(String conversationId) {
        String currentUserId = getUserId();
        checkIsMember(conversationId, currentUserId);
        Conversation conversation = conversationRepository.findByConversationId(conversationId);
        if (conversation == null) throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        if (conversation.getInviteCode() == null) {
            conversation.setInviteCode(UUID.randomUUID().toString().substring(0, 8));
            conversationRepository.save(conversation);
        }
        return conversation.getInviteCode();
    }

    @Transactional
    public String joinByInviteCode(String inviteCode) {
        String userId = getUserId();
        Conversation conversation = conversationRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
        boolean alreadyMember = groupMemberRepository
                .existsByIdUserIdAndIdConversationId(userId, conversation.getConversationId());
        if (alreadyMember) {
            return conversation.getConversationId();
        }
        GroupMember member = GroupMember.builder()
                .id(new GroupMemberId(userId, conversation.getConversationId()))
                .conversation(conversation)
                .role("MEMBER")
                .build();
        groupMemberRepository.save(member);
        return conversation.getConversationId();
    }
}
