package com.example.chat.service;

import com.example.chat.constant.MessageType;
import com.example.chat.dto.request.MessageRequest;
import com.example.chat.dto.request.TranslateRequest;
import com.example.chat.dto.response.ApiResponse;
import com.example.chat.dto.response.MessageResponse;
import com.example.chat.dto.response.UserProfileResponse;
import com.example.chat.entity.Conversation;
import com.example.chat.entity.Message;
import com.example.chat.entity.GroupMember;
import java.util.Optional;
import com.example.chat.exception.AppException;
import com.example.chat.exception.ErrorCode;
import com.example.chat.mapper.MessageMapper;
import com.example.chat.repository.ConversationRepository;
import com.example.chat.repository.GroupMemberRepository;
import com.example.chat.repository.MessageRepository;
import com.example.chat.client.IdentityClient;
import com.example.chat.client.TranslateClient;
import com.example.chat.dto.response.TranslateResponse;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.List;

/**
 * Dịch vụ xử lý gửi nhận tin nhắn real-time qua WebSocket và dịch thuật tự động.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final MessageMapper messageMapper;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final TranslateClient translateClient;
    private final IdentityClient identityClient;
    private final KafkaTemplate<String, String> kafkaTemplate;

    private static final java.net.http.HttpClient HTTP_CLIENT = java.net.http.HttpClient.newBuilder()
            .connectTimeout(java.time.Duration.ofSeconds(5))
            .build();

    public void sendMessage(MessageRequest messageRequest, Principal principal) {
        String userId = principal.getName();
        String action = messageRequest.getAction() != null ? messageRequest.getAction().toUpperCase() : "SEND";

        // Kiểm tra quyền thành viên cuộc trò chuyện trước khi xử lý các hành động
        GroupMember senderMember = groupMemberRepository.findByIdUserIdAndIdConversationId(userId, messageRequest.getConversationId())
                .orElse(null);
        if (senderMember == null || Boolean.TRUE.equals(senderMember.getIsBanned())) {
            log.warn("User {} is not member or is banned from conversation {}", userId, messageRequest.getConversationId());
            return;
        }

        // Xử lý hành động Đang soạn tin (TYPING) - không lưu vào cơ sở dữ liệu
        if ("TYPING".equals(action)) {
            if (Boolean.TRUE.equals(senderMember.getIsMuted())) {
                return;
            }
            MessageResponse typingResponse = MessageResponse.builder()
                    .conversationId(messageRequest.getConversationId())
                    .userId(userId)
                    .action("TYPING")
                    .build();
            simpMessagingTemplate.convertAndSend("/topic/" + messageRequest.getConversationId(), typingResponse);
            return;
        }

        // Xử lý hành động Chỉnh sửa (EDIT) tin nhắn hoặc bình chọn khảo sát
        if ("EDIT".equals(action) && messageRequest.getMessageId() != null) {
            Message message = messageRepository.findById(messageRequest.getMessageId())
                    .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
            boolean isPoll = "POLL".equalsIgnoreCase(message.getType());
            if (isPoll || message.getUserId().equals(userId)) {
                // Không được phép sửa tin nhắn sau 24 giờ
                if (!isPoll && message.getSentDatetime() != null) {
                    if (message.getSentDatetime().plus(java.time.Duration.ofHours(24)).isBefore(java.time.Instant.now())) {
                        log.warn("Không được phép chỉnh sửa tin nhắn #{} vì đã gửi quá 24 giờ.", message.getId());
                        return;
                    }
                }

                String newText = messageRequest.getMessageText();
                message.setMessageText(newText);
                message.setIsEdited(!isPoll);
                
                if (isPoll) {
                    message.setMessageTextTranslate(null);
                } else {
                    boolean shouldTranslate = newText != null && newText.matches(".*\\p{L}.*");
                    if (!shouldTranslate) {
                        message.setMessageTextTranslate(newText);
                    } else {
                        message.setMessageTextTranslate(null);
                    }
                }
                
                messageRepository.save(message);
                MessageResponse response = messageMapper.toMessageResponse(message);
                response.setAction("EDIT");
                simpMessagingTemplate.convertAndSend("/topic/" + messageRequest.getConversationId(), response);
                
                if (!isPoll && "TEXT".equalsIgnoreCase(message.getType())) {
                    boolean shouldTranslate = newText != null && newText.matches(".*\\p{L}.*");
                    if (shouldTranslate) {
                        try {
                            kafkaTemplate.send("translate-group", message.getId().toString());
                        } catch (Exception e) {
                            log.error("Kafka send error: {}", e.getMessage());
                            java.util.concurrent.CompletableFuture.runAsync(() -> translateCall(message.getId().toString()));
                        }
                    }
                }
            }
            return;
        }

        // Xử lý hành động Xóa (DELETE) tin nhắn (đánh dấu đã xóa mềm)
        if ("DELETE".equals(action) && messageRequest.getMessageId() != null) {
            Message message = messageRepository.findById(messageRequest.getMessageId())
                    .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
            if (message.getUserId().equals(userId)) {
                // Không được phép thu hồi/xóa tin nhắn sau 24 giờ
                if (message.getSentDatetime() != null) {
                    if (message.getSentDatetime().plus(java.time.Duration.ofHours(24)).isBefore(java.time.Instant.now())) {
                        log.warn("Không được phép xóa/thu hồi tin nhắn #{} vì đã gửi quá 24 giờ.", message.getId());
                        return;
                    }
                }

                message.setIsDeleted(true);
                message.setMessageText("Tin nhắn đã bị xóa");
                message.setMessageTextTranslate(null);
                messageRepository.save(message);
                MessageResponse response = messageMapper.toMessageResponse(message);
                response.setAction("DELETE");
                simpMessagingTemplate.convertAndSend("/topic/" + messageRequest.getConversationId(), response);
            }
            return;
        }

        // Xử lý hành động Ghim / Bỏ ghim tin nhắn (PIN / UNPIN)
        if (("PIN".equals(action) || "UNPIN".equals(action)) && messageRequest.getMessageId() != null) {
            Message message = messageRepository.findById(messageRequest.getMessageId())
                    .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
            message.setIsPinned("PIN".equals(action));
            messageRepository.save(message);
            MessageResponse response = messageMapper.toMessageResponse(message);
            response.setAction(action);
            simpMessagingTemplate.convertAndSend("/topic/" + messageRequest.getConversationId(), response);
            return;
        }

        // Xử lý Thả biểu cảm cảm xúc (REACT)
        if ("REACT".equals(action) && messageRequest.getMessageId() != null) {
            Message message = messageRepository.findById(messageRequest.getMessageId())
                    .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
            String currentReactions = message.getReactions() != null ? message.getReactions() : "";
            // Định dạng lưu trữ: userId:emoji;userId2:emoji2
            String newReaction = messageRequest.getReaction();
            if (newReaction != null && !newReaction.trim().isEmpty()) {
                // Gỡ bỏ biểu cảm cũ của người dùng nếu đã tồn tại
                String[] items = currentReactions.split(";");
                StringBuilder sb = new StringBuilder();
                for (String item : items) {
                    if (!item.startsWith(userId + ":") && !item.trim().isEmpty()) {
                        sb.append(item).append(";");
                    }
                }
                sb.append(userId).append(":").append(newReaction.trim());
                message.setReactions(sb.toString());
            } else {
                // Xóa biểu cảm của người dùng
                String[] items = currentReactions.split(";");
                StringBuilder sb = new StringBuilder();
                for (String item : items) {
                    if (!item.startsWith(userId + ":") && !item.trim().isEmpty()) {
                        sb.append(item).append(";");
                    }
                }
                message.setReactions(sb.toString());
            }
            messageRepository.save(message);
            MessageResponse response = messageMapper.toMessageResponse(message);
            response.setAction("REACT");
            simpMessagingTemplate.convertAndSend("/topic/" + messageRequest.getConversationId(), response);
            return;
        }

        // Xử lý trạng thái Đã xem / Đã đọc tin nhắn (SEEN)
        if ("SEEN".equals(action) && messageRequest.getMessageId() != null) {
            Message message = messageRepository.findById(messageRequest.getMessageId())
                    .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
            message.setStatus("SEEN");
            messageRepository.save(message);
            MessageResponse response = messageMapper.toMessageResponse(message);
            response.setAction("SEEN");
            simpMessagingTemplate.convertAndSend("/topic/" + messageRequest.getConversationId(), response);
            return;
        }

        // Mặc định: Gửi mới (SEND) hoặc Chuyển tiếp (FORWARD) tin nhắn
        Conversation conversation = conversationRepository.findById(messageRequest.getConversationId())
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        MessageType messageType;
        try {
            messageType = MessageType.valueOf(messageRequest.getType().toUpperCase());
        } catch (Exception e) {
            messageType = MessageType.FILE;
        }
        
        // Kiểm tra quyền thành viên và kiểm duyệt đối với tin nhắn người dùng thông thường
        if (messageType != MessageType.CALL_SIGNAL) {
            GroupMember gm = groupMemberRepository.findByIdUserIdAndIdConversationId(userId, conversation.getConversationId())
                    .orElse(null);
            if (gm == null) {
                sendWebSocketError(messageRequest.getConversationId(), userId, "Bạn không phải là thành viên của cuộc hội thoại này.");
                return;
            }
            if (Boolean.TRUE.equals(gm.getIsBanned())) {
                sendWebSocketError(messageRequest.getConversationId(), userId, "Bạn đã bị chặn (banned) khỏi cuộc hội thoại này.");
                return;
            }
            if (Boolean.TRUE.equals(gm.getIsMuted())) {
                sendWebSocketError(messageRequest.getConversationId(), userId, "Bạn đã bị tắt tiếng (muted) trong cuộc hội thoại này.");
                return;
            }
            if (conversation.getSlowModeSeconds() != null && conversation.getSlowModeSeconds() > 0) {
                Optional<Message> lastMsgOpt = messageRepository.findFirstByConversationAndUserIdOrderBySentDatetimeDesc(conversation, userId);
                if (lastMsgOpt.isPresent()) {
                    java.time.Instant lastSent = lastMsgOpt.get().getSentDatetime();
                    long secondsElapsed = java.time.Duration.between(lastSent, java.time.Instant.now()).toSeconds();
                    if (secondsElapsed < conversation.getSlowModeSeconds()) {
                        long secondsRemaining = conversation.getSlowModeSeconds() - secondsElapsed;
                        sendWebSocketError(messageRequest.getConversationId(), userId, 
                            "Chế độ chậm đang kích hoạt. Vui lòng đợi " + secondsRemaining + " giây trước khi gửi tiếp.");
                        return;
                    }
                }
            }
        }

        String messageText = messageRequest.getMessageText();
        String translatedText = null;
        boolean shouldTranslate = false;
        
        if (messageType == MessageType.TEXT && messageText != null) {
            // Kiểm tra xem chuỗi có chứa chữ cái hay không (emoji, dấu câu, số không cần dịch)
            shouldTranslate = messageText.matches(".*\\p{L}.*");
            if (!shouldTranslate) {
                translatedText = messageText; // Biểu tượng emoji và icon giữ nguyên, không cần dịch
            }
        }

        Message msg = Message.builder()
                .conversation(conversation)
                .userId(userId)
                .type(messageType.name())
                .messageText(messageText)
                .messageTextTranslate(translatedText)
                .replyToMessageId(messageRequest.getReplyToMessageId())
                .replyToMessageText(messageRequest.getReplyToMessageText())
                .replyToUserId(messageRequest.getReplyToUserId())
                .forwardFromMessageId(messageRequest.getForwardFromMessageId())
                .forwardFromUserId(messageRequest.getForwardFromUserId())
                .pollData(messageRequest.getPollData())
                .locationData(messageRequest.getLocationData())
                .status("SENT")
                .isEdited(false)
                .isDeleted(false)
                .isPinned(false)
                .build();
                
        boolean shouldSave = true;
        if (messageType == MessageType.CALL_SIGNAL) {
            if (messageText == null || !(messageText.contains("CALL_OFFER") 
                                      || messageText.contains("CALL_DECLINE") 
                                      || messageText.contains("CALL_END") 
                                      || messageText.contains("CALL_CANCEL"))) {
                shouldSave = false;
            }
        }
        
        if (shouldSave) {
            messageRepository.save(msg);
        } else {
            msg.setId(System.currentTimeMillis()); // Thiết lập ID tạm thời cho các tín hiệu WebRTC nhất thời
        }

        MessageResponse response = messageMapper.toMessageResponse(msg);
        response.setAction("FORWARD".equals(action) ? "FORWARD" : "SEND");
        simpMessagingTemplate.convertAndSend("/topic/" + messageRequest.getConversationId(), response);

        if (messageType == MessageType.CALL_SIGNAL) {
            List<String> members = groupMemberRepository.getGroupMembersByConversationIdExcludeUser(
                    conversation.getConversationId(), userId);
            for (String memberId : members) {
                try {
                    simpMessagingTemplate.convertAndSendToUser(memberId, "/queue/messages", response);
                } catch (Exception e) {
                    log.error("Failed to send call signal to user {}: {}", memberId, e.getMessage());
                }
            }
        }

        if (messageType == MessageType.TEXT && shouldTranslate) {
            try {
                kafkaTemplate.send("translate-group", msg.getId().toString());
            } catch (Exception e) {
                log.error("Kafka send error: {}", e.getMessage());
                java.util.concurrent.CompletableFuture.runAsync(() -> translateCall(msg.getId().toString()));
            }
        }
    }

    @Transactional
    public void translateCall(String messageId) {
        try {
            Message message = messageRepository.findById(Long.parseLong(messageId)).orElse(null);
            if (message == null) return;

            String targetLocale = null;
            if (message.getConversation().getLocale() != null && !message.getConversation().getLocale().trim().isEmpty()) {
                targetLocale = message.getConversation().getLocale();
            } else {
                List<String> otherUsers = groupMemberRepository.getGroupMembersByConversationIdExcludeUser(
                        message.getConversation().getConversationId(), message.getUserId());
                if (otherUsers != null && !otherUsers.isEmpty()) {
                    try {
                        ApiResponse<UserProfileResponse> user = identityClient.getInfo(otherUsers.get(0));
                        if (user != null && user.getResult() != null) {
                            targetLocale = user.getResult().getLocale();
                        }
                    } catch (Exception e) {
                        log.error("Failed to fetch target user info for translation: {}", e.getMessage());
                    }
                }
            }

            if (targetLocale == null || targetLocale.trim().isEmpty()) {
                targetLocale = "VI";
            }

            log.info("Translate call: messageId={}, targetLocale={}", messageId, targetLocale);
            String translated = translate(message.getMessageText(), targetLocale);
            if (translated != null && !translated.trim().isEmpty()) {
                message.setMessageTextTranslate(translated.trim());
                messageRepository.save(message);
                MessageResponse response = messageMapper.toMessageResponse(message);
                response.setAction("EDIT");
                simpMessagingTemplate.convertAndSend("/topic/" + message.getConversation().getConversationId(), response);
            }
        } catch (Exception e) {
            log.error("Error in translateCall for messageId {}: {}", messageId, e.getMessage());
        }
    }

    private String translate(String messageText, String locale) {
        if (messageText == null || messageText.trim().isEmpty()) return null;

        // 1. Ưu tiên thử dịch qua Google Gemini API
        try {
            TranslateRequest request = TranslateRequest.builder()
                    .contents(List.of(
                            TranslateRequest.Content.builder()
                                    .parts(List.of(
                                            TranslateRequest.Part.builder()
                                                    .text("You are a translation tool. Translate the following text into " + locale + " language and return ONLY the translated string without quotes or extra explanation: " + messageText)
                                                    .build()
                                    ))
                                    .build()
                    ))
                    .build();
            TranslateResponse response = translateClient.translate(request);
            if (response != null && response.getCandidates() != null && !response.getCandidates().isEmpty()) {
                String text = response.getCandidates().get(0).getContent().getParts().get(0).getText();
                if (text != null && !text.trim().isEmpty()) {
                    String upper = text.trim().toUpperCase();
                    if (upper.contains("PLEASE SELECT TWO DISTINCT LANGUAGES")
                        || upper.contains("MYMEMORY HAS SEEN ALL")
                        || upper.contains("INVALID TARGET")
                        || text.trim().equalsIgnoreCase(messageText.trim())) {
                        return null;
                    }
                    return text.trim();
                }
            }
        } catch (Exception e) {
            log.warn("Gemini Translate API unavailable/failed ({}), using MyMemory fallback translator...", e.getMessage());
        }

        // 2. Cơ chế dự phòng (Fallback): Sử dụng MyMemory Translation API
        try {
            String targetLang = locale != null ? locale.toLowerCase() : "vi";
            if ("vn".equals(targetLang)) targetLang = "vi";
            if ("jp".equals(targetLang)) targetLang = "ja";
            if ("kr".equals(targetLang)) targetLang = "ko";
            if ("cn".equals(targetLang)) targetLang = "zh";

            String encodedText = java.net.URLEncoder.encode(messageText, java.nio.charset.StandardCharsets.UTF_8);
            String apiUrl = "https://api.mymemory.translated.net/get?q=" + encodedText + "&langpair=autodetect%7C" + targetLang;

            java.net.http.HttpRequest httpRequest = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(apiUrl))
                    .timeout(java.time.Duration.ofSeconds(5))
                    .GET()
                    .build();
            java.net.http.HttpResponse<String> httpResponse = HTTP_CLIENT.send(httpRequest, java.net.http.HttpResponse.BodyHandlers.ofString());

            if (httpResponse.statusCode() == 200 || httpResponse.statusCode() == 400) {
                String body = httpResponse.body();
                int idx = body.indexOf("\"translatedText\":\"");
                if (idx != -1) {
                    int start = idx + 18;
                    int end = body.indexOf("\"", start);
                    if (end != -1) {
                        String rawTranslated = body.substring(start, end);
                        String unescaped = unescapeUnicode(rawTranslated);
                        if (unescaped != null) {
                            String upper = unescaped.toUpperCase();
                            if (upper.contains("PLEASE SELECT TWO DISTINCT LANGUAGES") 
                                || upper.contains("MYMEMORY HAS SEEN ALL") 
                                || upper.contains("QUERY LENGTH LIMIT")
                                || upper.contains("INVALID TARGET LANGUAGE")
                                || unescaped.trim().equalsIgnoreCase(messageText.trim())) {
                                return messageText.trim();
                            }
                            return unescaped.trim();
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Fallback translator error: {}", ex.getMessage());
        }

        return messageText != null ? messageText.trim() : null;
    }

    private String unescapeUnicode(String input) {
        if (input == null) return null;
        StringBuilder sb = new StringBuilder();
        int i = 0;
        while (i < input.length()) {
            char c = input.charAt(i);
            if (c == '\\' && i + 1 < input.length() && input.charAt(i + 1) == 'u' && i + 5 < input.length()) {
                try {
                    int codePoint = Integer.parseInt(input.substring(i + 2, i + 6), 16);
                    sb.append((char) codePoint);
                    i += 6;
                    continue;
                } catch (Exception e) {
                }
            }
            sb.append(c);
            i++;
        }
        return sb.toString();
    }

    private void sendWebSocketError(String conversationId, String userId, String errorMessage) {
        MessageResponse errorResponse = MessageResponse.builder()
                .conversationId(conversationId)
                .userId(userId)
                .messageText(errorMessage)
                .action("ERROR")
                .sentDatetime(java.time.Instant.now())
                .type("TEXT")
                .build();
        simpMessagingTemplate.convertAndSendToUser(userId, "/queue/messages", errorResponse);
    }
}
