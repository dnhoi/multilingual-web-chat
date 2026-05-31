# 📋 06 - Backend API Contracts & Request/Response Specifications

> Tài liệu mô tả chi tiết hợp đồng API (API Contracts) của toàn bộ các luồng nghiệp vụ trong **Multilingual Web Chat Backend**, bao gồm cấu trúc Request DTO, quy tắc kiểm tra hợp lệ (Jakarta Validation), HTTP Status Code và Response Payload chuẩn.

---

## 📑 MỤC LỤC
1. [Quy Chuẩn Chung Về Hợp Đồng API](#1-quy-chuẩn-chung-về-hợp-đồng-api)
2. [Hợp Đồng API Xác Thực & Phiên Làm Việc (Authentication Contracts)](#2-hợp-đồng-api-xác-thực--phiên-làm-việc-authentication-contracts)
3. [Hợp Đồng API Người Dùng (User Management Contracts)](#3-hợp-đồng-api-người-dùng-user-management-contracts)
4. [Hợp Đồng API Quản Trị Hệ Thống (Admin & Moderation Contracts)](#4-hợp-đồng-api-quản-trị-hệ-thống-admin--moderation-contracts)
5. [Hợp Đồng API Hội Thoại & Nhóm (Conversation & Channel Contracts)](#5-hợp-đồng-api-hội-thoại--nhóm-conversation--channel-contracts)
6. [Hợp Đồng API Tin Nhắn & Lịch Sử (Message Contracts)](#6-hợp-đồng-api-tin-nhắn--lịch-sử-message-contracts)
7. [Hợp Đồng Thời Gian Thực WebSocket STOMP](#7-hợp-đồng-thời-gian-thực-websocket-stomp)

---

## 1. Quy Chuẩn Chung Về Hợp Đồng API

- Mọi API được cung cấp tại tiền tố: `/api/v1/`
- Request có Body định dạng `application/json` được kiểm tra chặt chẽ bởi **Jakarta Bean Validation** (`@Valid`).
- Mọi phản hồi thành công hoặc thất bại đều được bọc trong phong bì `ApiResponse<T>`:
  ```json
  {
    "code": 200,
    "message": "Thành công",
    "result": { ... }
  }
  ```

---

## 2. Hợp Đồng API Xác Thực & Phiên Làm Việc (Authentication Contracts)

### 2.1 Đăng Nhập Hệ Thống
- **Endpoint:** `POST /api/v1/identify/auth`
- **Quyền:** Public
- **Request DTO (`AuthenticationRequest`):**
  ```json
  {
    "username": "user123",
    "password": "Password@123"
  }
  ```
- **Validation:** `@NotBlank` cho cả username và password.
- **Response Payload (`AuthenticationResponse`):**
  ```json
  {
    "code": 200,
    "result": {
      "token": "eyJhbGciOiJIUzUxMiJ9...",
      "authenticated": true
    }
  }
  ```
- **Headers:** Kèm theo Set-Cookie `token` (HttpOnly, SameSite=Strict).

### 2.2 Đăng Ký Tài Khoản
- **Endpoint:** `POST /api/v1/identify/users`
- **Quyền:** Public
- **Request DTO (`UserCreateRequest`):**
  ```json
  {
    "username": "user123",
    "password": "Password@123",
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A"
  }
  ```
- **Validation:** Password tối thiểu 8 ký tự (`@Size(min = 8)`), Email đúng định dạng (`@Email`).
- **Response:** HTTP `201 Created` kèm thông báo kiểm tra email kích hoạt.

### 2.3 Kích Hoạt Tài Khoản Qua Email
- **Endpoint:** `GET /api/v1/identify/auth/active?token={activationToken}`
- **Quyền:** Public
- **Response:** HTTP `302 Found` (Chuyển hướng về trang chủ Frontend `/`).

### 2.4 Quên Mật Khẩu & Đặt Lại Mật Khẩu
- **Quên mật khẩu:** `POST /api/v1/identify/auth/forgot-password`
  - Body: `{ "email": "user@example.com" }`
- **Đặt lại mật khẩu:** `POST /api/v1/identify/auth/reset-password`
  - Body: `{ "token": "jwt_reset_token", "newPassword": "NewPassword@123" }`

### 2.5 Quản Lý Phiên Đăng Nhập Đang Hoạt Động
- **Lấy danh sách phiên:** `GET /api/v1/identify/auth/sessions` (Trả về `List<UserSessionResponse>`)
- **Thu hồi phiên từ xa:** `DELETE /api/v1/identify/auth/sessions/{sessionId}`

---

## 3. Hợp Đồng API Người Dùng (User Management Contracts)

### 3.1 Lấy Thông Tin Cá Nhân (My Info)
- **Endpoint:** `GET /api/v1/identify/users`
- **Quyền:** Authenticated (Bearer Token)
- **Response:** `UserResponse` chứa đầy đủ thông tin cá nhân.

### 3.2 Cập Nhật Hồ Sơ Người Dùng
- **Endpoint:** `PUT /api/v1/identify/users`
- **Request DTO (`UserUpdateRequest`):**
  ```json
  {
    "fullName": "Nguyễn Văn A",
    "bio": "Software developer",
    "website": "https://example.com",
    "gender": "MALE",
    "birthday": "2000-01-01"
  }
  ```

### 3.3 Tra Cứu Hồ Sơ Hàng Loạt (Batch Lookup)
- **Endpoint:** `POST /api/v1/identify/users/batch`
- **Request DTO (`UserIdsRequest`):**
  ```json
  {
    "userIds": ["usr_01", "usr_02"]
  }
  ```
- **Response:** `List<UserProfileResponse>` dùng để hiển thị thông tin thành viên nhóm chat.

---

## 4. Hợp Đồng API Quản Trị Hệ Thống (Admin & Moderation Contracts)

### 4.1 Khóa / Mở Khóa Tài Khoản (Toggle Ban)
- **Endpoint:** `PUT /api/v1/identify/admin/users/{userId}/toggle-ban`
- **Quyền:** `SCOPE_ROLE_ADMIN`
- **Response:** Trả về cờ `result: true` (Hoạt động) hoặc `false` (Bị khóa).

### 4.2 Thay Đổi Vai Trò Người Dùng (Role Management)
- **Endpoint:** `PUT /api/v1/identify/admin/users/{userId}/role?role=ROLE_ADMIN`
- **Quyền:** `SCOPE_ROLE_ADMIN`
- **Params:** `role` nhận giá trị `ROLE_ADMIN` hoặc `ROLE_USER`
- **Response:** Cập nhật quyền và ghi nhật ký kiểm toán.

### 4.3 Tiếp Nhận & Xử Lý Báo Cáo Vi Phạm (Reports)
- **Tạo báo cáo:** `POST /api/v1/identify/admin/reports`
  - Body: `{ "reportedUserId": "usr_bad", "messageId": 1234, "reason": "Spam" }`
- **Xem báo cáo:** `GET /api/v1/identify/admin/reports` (Admin)
- **Duyệt báo cáo:** `PUT /api/v1/identify/admin/reports/{id}/resolve` (Admin)

### 4.4 Nhật Ký Kiểm Vết (Audit Logs)
- **Endpoint:** `GET /api/v1/identify/admin/audit-logs`
- **Quyền:** `SCOPE_ROLE_ADMIN`
- **Response:** Danh sách `AuditLog` sắp xếp giảm dần theo thời gian.

### 4.5 Quản Lý Cấu Hình Hệ Thống (System Configs)
- **Lấy danh sách cấu hình:** `GET /api/v1/identify/admin/system-configs`
- **Cập nhật cấu hình:** `PUT /api/v1/identify/admin/system-configs`
  - Body: `{ "banned_keywords": "...", "maintenance_mode": "false", "min_group_members": "3", "ai_rate_limit": "60" }`

---

## 5. Hợp Đồng API Hội Thoại & Nhóm (Conversation & Channel Contracts)

### 5.1 Tạo Cuộc Hội Thoại
- **Hội thoại 1-1:** `POST /api/v1/chat/conversation`
  - Body: `{ "userId": "usr_friend" }`
- **Nhóm chat:** `POST /api/v1/chat/conversation/group`
  - Body (`CreateGroupRequest`):
    ```json
    {
      "name": "Nhóm Dự Án Web Chat",
      "userIds": ["usr_01", "usr_02", "usr_03"],
      "locale": "EN"
    }
    ```
- **Quy tắc:** Tạo nhóm bắt buộc tối thiểu 3 thành viên (`GROUP_MINIMUM_MEMBERS`).

### 5.2 Quản Lý Trạng Thái Hội Thoại Cá Nhân
- **Ghim hội thoại:** `PUT /api/v1/chat/{conversationId}/pin`
- **Lưu trữ hội thoại:** `PUT /api/v1/chat/{conversationId}/archive`
- **Yêu thích hội thoại:** `PUT /api/v1/chat/{conversationId}/favorite`
- **Tắt thông báo:** `PUT /api/v1/chat/{conversationId}/mute`

### 5.3 Quản Trị Nhóm & Điều Phối Thành Viên
- **Thêm thành viên:** `POST /api/v1/chat/{conversationId}/group/member`
- **Đổi quyền thành viên:** `POST /api/v1/chat/{conversationId}/member/{memberId}/role?role=ADMIN`
- **Đuổi thành viên:** `POST /api/v1/chat/{conversationId}/member/{memberId}/kick`
- **Tắt tiếng thành viên:** `POST /api/v1/chat/{conversationId}/member/{memberId}/mute`
- **Chặn thành viên:** `POST /api/v1/chat/{conversationId}/member/{memberId}/ban`
- **Cài đặt Slow Mode:** `PUT /api/v1/chat/{conversationId}/slow-mode` (Body: Số giây)
- **Mã mời nhóm:** `GET /api/v1/chat/{conversationId}/invite-code`
- **Tham gia bằng mã:** `POST /api/v1/chat/conversation/join/{inviteCode}`

---

## 6. Hợp Đồng API Tin Nhắn & Lịch Sử (Message Contracts)

### 6.1 Lấy Lịch Sử Tin Nhắn Phòng Chat
- **Endpoint:** `GET /api/v1/chat/message/{conversationId}?page=0&size=50`
- **Quyền:** Phải là thành viên trong nhóm.
- **Response:** `List<MessageResponse>` kèm thông tin reply, reactions và bản dịch AI.

### 6.2 Tìm Kiếm Tin Nhắn
- **Endpoint:** `GET /api/v1/chat/message/{conversationId}/search?keyword=hello&page=0&size=50`

### 6.3 Xóa Tin Nhắn
- **Endpoint:** `DELETE /api/v1/chat/message/{messageId}`
- **Quy tắc:** Chỉ người gửi tin nhắn hoặc Quản trị viên nhóm mới có quyền xóa.
- **Giới hạn 24 giờ:** Nếu tin nhắn đã gửi quá 24 giờ (`sent_datetime + 24h < now`), yêu cầu xóa sẽ bị từ chối với lỗi `400 Bad Request` (`INVALID_REQUEST`). Tin nhắn hợp lệ được đánh dấu `is_deleted = true`.

---

## 7. Hợp Đồng Thời Gian Thực WebSocket STOMP

- **Endpoint STOMP:** `ws://localhost:8000/api/v1/chat/ws`
- **Inbound Message Destination:** `/app/chat`
- **Payload `MessageRequest`:**
  ```json
  {
    "conversationId": "conv_123",
    "type": "TEXT",
    "action": "SEND",
    "messageText": "Xin chào thế giới!",
    "replyToMessageId": null,
    "pollData": null,
    "reaction": null
  }
  ```
- **Các giá trị hợp lệ của `action`:**
  - `SEND`: Gửi tin nhắn mới.
  - `EDIT`: Sửa tin nhắn đã gửi hoặc thực hiện bỏ phiếu (Poll vote). **Lưu ý: Bị chặn nếu tin nhắn đã gửi quá 24 giờ (ngoại trừ Poll vote).**
  - `DELETE`: Xóa/thu hồi tin nhắn. **Lưu ý: Bị chặn nếu tin nhắn đã gửi quá 24 giờ.**
  - `PIN` / `UNPIN`: Ghim hoặc bỏ ghim tin nhắn.
  - `REACT`: Thả hoặc xóa emoji cảm xúc (`reaction: "👍"`).
  - `SEEN`: Đã đọc tin nhắn.
  - `FORWARD`: Chuyển tiếp tin nhắn từ hội thoại khác.
- **Outbound Topic Broadcast:** `/topic/{conversationId}` (nhận `MessageResponse`).
- **Kênh Báo Hiệu Cá Nhân:** `/user/queue/messages` (nhận WebRTC Call Signals và lỗi hệ thống).
