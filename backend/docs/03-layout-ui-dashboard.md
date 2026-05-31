# 📊 03 - Backend View Models & Dashboard Contracts

> Tài liệu quy định các cấu trúc dữ liệu tổng hợp (Aggregated View Models / DTOs), chỉ số thống kê và hợp đồng dữ liệu mà **Multilingual Web Chat Backend** cung cấp cho giao diện người dùng và bảng điều khiển Admin Dashboard.

---

## 📑 MỤC LỤC
1. [Triết Lý Cung Cấp Dữ Liệu Cho Giao Diện](#1-triết-lý-cung-cấp-dữ-liệu-cho-giao-diện)
2. [Hồ Sơ Người Dùng & Tra Cứu Hàng Loạt (User Profiles & Batch DTO)](#2-hồ-sơ-người-dùng--tra-cứu-hàng-loạt-user-profiles--batch-dto)
3. [Tổng Hợp Danh Sách Hội Thoại & Nhóm (Conversation View Models)](#3-tổng-hợp-danh-sách-hội-thoại--nhóm-conversation-view-models)
4. [Dữ Liệu Tin Nhắn Đa Dạng (Rich Message DTO)](#4-dữ-liệu-tin-nhắn-đa-dạng-rich-message-dto)
5. [Bảng Điều Khiển Quản Trị Hệ Thống (Admin Dashboard Contracts)](#5-bảng-điều-khiển-quản-trị-hệ-thống-admin-dashboard-contracts)

---

## 1. Triết Lý Cung Cấp Dữ Liệu Cho Giao Diện

Để ứng dụng Frontend (React SPA) hiển thị nhanh chóng, giảm thiểu tối đa các yêu cầu mạng lặp lại (N+1 query problem ở phía Client):
- **Batching API:** Backend cung cấp endpoint tra cứu hồ sơ người dùng theo danh sách (`POST /api/v1/identify/users/batch`), cho phép Frontend lấy thông tin đại diện, tên gọi của toàn bộ thành viên trong cuộc hội thoại chỉ với một lần gọi.
- **DTO Projection:** Các trường dữ liệu nhạy cảm (`password`, `google_id`, v.v.) bị loại trừ hoàn toàn khi trả về client.
- **Aggregated Responses:** Danh sách hội thoại trả về kèm theo trạng thái ghim (`isPinned`), lưu trữ (`isArchived`), số người đăng ký kênh (`subscriberCount`) và tin nhắn mới nhất.

---

## 2. Hồ Sơ Người Dùng & Tra Cứu Hàng Loạt (User Profiles & Batch DTO)

### 2.1 Chi Tiết Hồ Sơ Cá Nhân (`UserResponse` - My Profile)
Phục vụ màn hình cài đặt tài khoản (`/settings`):
```json
{
  "code": 200,
  "result": {
    "userId": "usr_9b1deb4d",
    "username": "hoangnam",
    "email": "nam@example.com",
    "fullName": "Nguyễn Hoàng Nam",
    "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
    "coverPhotoUrl": "https://res.cloudinary.com/.../cover.jpg",
    "bio": "Fullstack Software Engineer & AI enthusiast",
    "locale": "VI",
    "role": "ROLE_USER",
    "website": "https://hoangnam.dev",
    "gender": "MALE",
    "birthday": "2002-05-15",
    "isActive": true
  }
}
```

### 2.2 Tra Cứu Hồ Sơ Thành Viên Hàng Loạt (`POST /api/v1/identify/users/batch`)
- **Request Body (`UserIdsRequest`):**
  ```json
  {
    "userIds": ["usr_01", "usr_02", "usr_03"]
  }
  ```
- **Response Payload:** Danh sách `UserProfileResponse` chứa các thông tin công khai (Tên hiển thị, avatar, locale, trạng thái hoạt động).

---

## 3. Tổng Hợp Danh Sách Hội Thoại & Nhóm (Conversation View Models)

### 3.1 Cấu Trúc DTO Hội Thoại (`ConversationResponse`)
Trả về thông tin phòng chat 1-1, nhóm hoặc kênh phát thông báo:
```json
{
  "conversationId": "conv_8f293a1c",
  "conversationName": "Nhóm Dự Án Quốc Tế",
  "locale": "EN",
  "avatarUrl": "https://res.cloudinary.com/.../group_avatar.png",
  "description": "Nhóm thảo luận đa ngôn ngữ Anh - Việt",
  "type": "GROUP",
  "isArchived": false,
  "isPinned": true,
  "isFavorite": true,
  "isMuted": false,
  "inviteCode": "INV-789XYZ",
  "slowModeSeconds": 10,
  "subscriberCount": 42,
  "isPublicChannel": false,
  "announcement": "Cuộc họp tiếp theo diễn ra vào 20:00 thứ Sáu.",
  "createdAt": "2026-09-01T10:00:00Z"
}
```

### 3.2 Thống Kê Kênh Công Khai (`ChannelStatsResponse`)
Endpoint: `GET /api/v1/chat/channel/{channelId}/stats`
```json
{
  "channelId": "chan_abc",
  "channelName": "Thông Báo Toàn Công Ty",
  "subscriberCount": 1500,
  "isPublic": true,
  "totalMessages": 320
}
```

---

## 4. Dữ Liệu Tin Nhắn Đa Dạng (Rich Message DTO)

Cấu trúc `MessageResponse` phục vụ hiển thị lịch sử và phát realtime qua WebSocket:
```json
{
  "id": 10452,
  "conversationId": "conv_8f293a1c",
  "userId": "usr_9b1deb4d",
  "senderName": "Nguyễn Hoàng Nam",
  "senderAvatar": "https://res.cloudinary.com/.../avatar.jpg",
  "type": "TEXT",
  "messageText": "Chào bạn, hôm nay tiến độ dự án thế nào rồi?",
  "messageTextTranslate": "Hello, how is the project progress today?",
  "sentDatetime": "2026-09-09T08:30:00Z",
  "status": "SEEN",
  "isEdited": false,
  "isDeleted": false,
  "isPinned": false,
  "replyToMessageId": 10440,
  "replyToMessageText": "Báo cáo tiến độ tuần này",
  "replyToUserId": "usr_02",
  "reactions": "usr_01:👍;usr_02:❤️",
  "pollData": "{\"question\":\"Bạn chọn ăn gì?\",\"options\":[{\"id\":1,\"text\":\"Phở\",\"votes\":[\"usr_01\"]}]}",
  "locationData": "10.7769,106.7009",
  "action": "SEND"
}
```

---

## 5. Bảng Điều Khiển Quản Trị Hệ Thống (Admin Dashboard Contracts)

Dành cho Quản trị viên hệ thống tại giao diện `/admin`:

### 5.1 Quản Lý & Khóa Tài Khoản (`/api/v1/identify/admin/users`)
- Xem toàn bộ người dùng trong hệ thống kèm trạng thái khóa:
  ```json
  [
    {
      "userId": "usr_01",
      "username": "spammer123",
      "email": "spam@example.com",
      "fullName": "Spam Account",
      "isActive": false,
      "role": "ROLE_USER"
    }
  ]
  ```
- **Hành động Khóa/Mở Khóa:** `PUT /api/v1/identify/admin/users/{userId}/toggle-ban` -> Trả về `true` (Mở khóa) hoặc `false` (Bị khóa).

### 5.2 Xử Lý Báo Cáo Vi Phạm (`/api/v1/identify/admin/reports`)
- Danh sách báo cáo vi phạm với trạng thái `PENDING` hoặc `RESOLVED`:
  ```json
  {
    "id": 1,
    "reporterId": "usr_victim",
    "reportedUserId": "usr_spammer",
    "messageId": 10450,
    "reason": "Gửi tin nhắn quấy rối và spam liên tục",
    "status": "PENDING",
    "timestamp": "2026-09-09T08:00:00Z"
  }
  ```
- **Xử lý báo cáo:** `PUT /api/v1/identify/admin/reports/{id}/resolve` -> Chuyển trạng thái sang `RESOLVED`.

### 5.3 Nhật Ký Kiểm Vết Hệ Thống (`/api/v1/identify/admin/audit-logs`)
- Giám sát toàn bộ hoạt động nhạy cảm do Admin thực hiện:
  ```json
  [
    {
      "id": 5,
      "action": "USER_BAN",
      "target": "spammer123",
      "admin": "ADMIN",
      "timestamp": "2026-09-09T08:15:00Z"
    }
  ]
  ```

### 5.4 Cấu Hình Tham Số Toàn Cục (`/api/v1/identify/admin/system-configs`)
- Xem và cập nhật danh sách cấu hình hệ thống:
  ```json
  [
    { "key": "MAX_GROUP_MEMBERS", "value": "100" },
    { "key": "DEFAULT_LANGUAGE", "value": "VI" },
    { "key": "ALLOW_REGISTRATION", "value": "true" }
  ]
  ```
