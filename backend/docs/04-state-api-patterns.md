# 🛠️ 04 - Backend State, API Patterns & Architecture Practices

> Tài liệu mô tả các mẫu thiết kế (Design Patterns), chuẩn hóa tầng dữ liệu (Data Envelopes), quản trị giao dịch (Transaction Management), xử lý ngoại lệ tập trung, cơ chế dịch thuật AI bất đồng bộ qua Kafka và truyền tín hiệu WebRTC trong **Multilingual Web Chat Backend**.

---

## 📑 MỤC LỤC
1. [Chuẩn Hóa Dữ Liệu Phản Hồi (ApiResponse Envelope)](#1-chuẩn-hóa-dữ-liệu-phản-hồi-apiresponse-envelope)
2. [Xử Lý Ngoại Lệ Tập Trung & Bộ Mã Lỗi Toàn Cục (Global Exception Handling)](#2-xử-lý-ngoại-lệ-tập-trung--bộ-mã-lỗi-toàn-cục-global-exception-handling)
3. [Kiến Trúc Hướng Sự Kiện (EDA) Với Apache Kafka](#3-kiến-trúc-hướng-sự-kiện-eda-với-apache-kafka)
4. [Quy Trình Dịch Thuật Đa Tầng: Gemini AI & Fallback MyMemory](#4-quy-trình-dịch-thuật-đa-tầng-gemini-ai--fallback-mymemory)
5. [Cơ Chế Báo Hiệu Cuộc Gọi Trực Tiếp (WebRTC Signaling Over STOMP)](#5-cơ-chế-báo-hiệu-cuộc-gọi-trực-tiếp-webrtc-signaling-over-stomp)
6. [Quản Lý Giao Dịch Dữ Liệu (@Transactional & PrePersist)](#6-quản-lý-giao-dịch-dữ-liệu-transactional--prepersist)

---

## 1. Chuẩn Hóa Dữ Liệu Phản Hồi (ApiResponse Envelope)

Mọi API RESTful của Backend đều thống nhất trả về đối tượng `ApiResponse<T>`:

```java
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    @Builder.Default
    private int code = 200;
    private String message;
    private T result;
}
```

- **Khi thành công:** `code = 200` (hoặc `201` khi tạo mới), dữ liệu nằm trong `result`.
- **Khi có lỗi:** `code` chứa mã định danh lỗi nghiệp vụ từ `ErrorCode`, trường `message` mô tả lý do thất bại.

---

## 2. Xử Lý Ngoại Lệ Tập Trung & Bộ Mã Lỗi Toàn Cục (Global Exception Handling)

Lớp `GlobalExceptionHandler` sử dụng `@RestControllerAdvice` bắt toàn bộ ngoại lệ phát sinh trong hệ thống:

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(value = AppException.class)
    ResponseEntity<ApiResponse> handlingAppException(AppException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        ApiResponse apiResponse = new ApiResponse();
        apiResponse.setCode(errorCode.getCode());
        apiResponse.setMessage(errorCode.getMessage());
        return ResponseEntity.status(errorCode.getStatus()).body(apiResponse);
    }
}
```

### Danh Mục `ErrorCode` Chuẩn Hóa
| Code | Enum Name | HTTP Status | Diễn Giải |
| :--- | :--- | :--- | :--- |
| `9999` | `UNCATEGORIZED_EXCEPTION` | 500 Internal Server | Lỗi hệ thống chưa được phân loại |
| `1000` | `UNAUTHORIZED` | 403 Forbidden | Bạn không có quyền thực hiện hành động |
| `1001` | `USER_NOT_FOUND` | 404 Not Found | Không tìm thấy người dùng |
| `1002` | `WRONG_PASSWORD` | 400 Bad Request | Mật khẩu hiện tại không đúng |
| `1003` | `UNAUTHENTICATED` | 401 Unauthorized | Chưa đăng nhập hoặc token không hợp lệ |
| `1004` | `PASSWORD_MINIMUM` | 400 Bad Request | Mật khẩu phải có tối thiểu 8 ký tự |
| `1005` | `INVALID_PASSWORD` | 400 Bad Request | Định dạng mật khẩu không hợp lệ |
| `1006` | `CONVERSATION_NOT_FOUND` | 404 Not Found | Không tìm thấy cuộc hội thoại |
| `1006` | `NOT_ACTIVATE_YET` | 400 Bad Request | Tài khoản chưa được kích hoạt qua email |
| `1007` | `EXPIRED_TOKEN` | 400 Bad Request | Token kích hoạt hoặc đặt lại mật khẩu đã hết hạn |
| `1008` | `GROUP_MINIMUM_MEMBERS` | 400 Bad Request | Nhóm chat phải có tối thiểu 3 thành viên |
| `1009` | `EMAIL_ALREADY_EXISTS` | 409 Conflict | Địa chỉ email đã được sử dụng |
| `1010` | `USERNAME_ALREADY_EXISTS` | 409 Conflict | Tên đăng nhập đã tồn tại |
| `1010` | `MEMBER_MUTED` | 403 Forbidden | Bạn đang bị tắt tiếng trong cuộc trò chuyện |
| `1011` | `MEMBER_BANNED` | 403 Forbidden | Bạn đã bị chặn khỏi cuộc trò chuyện này |
| `1012` | `SLOW_MODE_LIMIT` | 429 Too Many Requests | Chế độ chậm đang kích hoạt, vui lòng chờ |
| `1012` | `ACCOUNT_LOCKED` | 429 Too Many Requests | Tài khoản bị tạm khóa do đăng nhập sai nhiều lần |
| `1013` | `INVALID_CREDENTIALS` | 401 Unauthorized | Tên đăng nhập hoặc mật khẩu không chính xác |

---

## 3. Kiến Trúc Hướng Sự Kiện (EDA) Với Apache Kafka

Nhằm tối ưu hóa hiệu năng gửi nhận tin nhắn thời gian thực:
- **Non-blocking Messaging:** Khi người dùng gửi tin nhắn văn bản, Chat Service lưu tin nhắn gốc vào MySQL và phát sóng ngay lập tức tới WebSocket topic `/topic/{conversationId}` để các bên nhận được tức thì không độ trễ.
- **Async Translation:** Nếu tin nhắn chứa ký tự chữ cái (kiểm tra regex `.*\p{L}.*`), Chat Service phát sự kiện chứa `messageId` vào Kafka topic `translate-group`.
- **Fault-tolerance:** Nếu Kafka broker gặp sự cố tạm thời, hệ thống tự động bọc tác vụ trong `CompletableFuture.runAsync(...)` để dịch nền trực tiếp, đảm bảo không làm gián đoạn luồng gửi tin của người dùng.

```java
if (messageType == MessageType.TEXT && shouldTranslate) {
    try {
        kafkaTemplate.send("translate-group", msg.getId().toString());
    } catch (Exception e) {
        log.error("Kafka send error: {}", e.getMessage());
        CompletableFuture.runAsync(() -> translateCall(msg.getId().toString()));
    }
}
```

---

## 4. Quy Trình Dịch Thuật Đa Tầng: Gemini AI & Fallback MyMemory

Phương thức `ChatService.translateCall(String messageId)` được kích hoạt bởi Kafka Listener:

1. **Xác định Ngôn ngữ Mục tiêu (Target Locale):**
   - Ưu tiên đọc cấu hình `locale` của phòng chat (`conversation.getLocale()`).
   - Nếu phòng không cấu hình, lấy theo `locale` ưa thích trong hồ sơ của người nhận (gọi Feign sang `identify-service`).
   - Mặc định là `VI` (Tiếng Việt) nếu không tìm thấy cấu hình.
2. **Tầng 1: Google Gemini AI API:**
   - Tạo yêu cầu: *"You are a translation tool. Translate the following text into [targetLocale] language and return ONLY the translated string without quotes or extra explanation: [text]"*.
   - Đọc kết quả từ candidate đầu tiên.
3. **Tầng 2: MyMemory Translation API (Tự động Dự phòng):**
   - Nếu Gemini AI gặp lỗi mạng, vượt hạn mức (Quota limit 429) hoặc trả về kết quả rỗng:
   - Hệ thống tự động chuyển sang gọi MyMemory REST API miễn phí:
     `https://api.mymemory.translated.net/get?q={text}&langpair=autodetect|{targetLang}`.
   - Chuẩn hóa mã locale: `vn -> vi`, `jp -> ja`, `kr -> ko`, `cn -> zh`.
4. **Cập nhật & Broadcast:**
   - Cập nhật trường `message_text_translate` vào MySQL.
   - Phát hành STOMP message với `action = "EDIT"` qua `/topic/{conversationId}` để cập nhật trực tiếp trên màn hình của tất cả người dùng trong phòng.

---

## 5. Cơ Chế Báo Hiệu Cuộc Gọi Trực Tiếp (WebRTC Signaling Over STOMP)

Hệ thống tận dụng WebSocket STOMP Broker của `chat-service` làm **Signaling Server** cho cuộc gọi Video/Thoại WebRTC P2P:
- Khi tin nhắn có `type == CALL_SIGNAL`:
  - **Không lưu vĩnh viễn vào CSDL** (ngoại trừ các tín hiệu mở/kết thúc cuộc gọi để ghi nhận lịch sử).
  - Tín hiệu được chuyển phát trực tiếp tới hàng đợi cá nhân của người nhận: `/user/queue/messages`.
- **Các loại tín hiệu hỗ trợ:**
  - `CALL_OFFER:<SDP>`: Người gọi gửi đề nghị kèm Session Description Protocol.
  - `CALL_ANSWER:<SDP>`: Người nhận chấp nhận cuộc gọi và phản hồi SDP.
  - `ICE_CANDIDATE:<Data>`: Trao đổi địa chỉ mạng/port giữa 2 trình duyệt để vượt NAT.
  - `CALL_DECLINE`: Từ chối cuộc gọi.
  - `CALL_END`: Kết thúc cuộc gọi đang diễn ra.
  - `CALL_CANCEL`: Người gọi hủy cuộc gọi khi đối phương chưa nghe máy.

---

## 6. Quản Lý Giao Dịch Dữ Liệu (@Transactional & PrePersist)

- Toàn bộ các phương thức tạo hội thoại, thêm thành viên, gửi và cập nhật tin nhắn đều được bảo vệ bởi `@Transactional(rollbackFor = Exception.class)`.
- Các Entity (`Message`, `Conversation`, `GroupMember`) áp dụng `@PrePersist` để gán giá trị mặc định cho timestamp (`sentDatetime = Instant.now()`), cờ xóa (`isDeleted = false`), cờ ghim (`isPinned = false`) nhằm đảm bảo tính toàn vẹn dữ liệu.
