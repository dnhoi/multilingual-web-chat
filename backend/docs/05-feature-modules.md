# 🧩 05 - Backend Feature Modules & Domain Decomposition

> Tài liệu phân tích chuyên sâu về 7 phân hệ tính năng cốt lõi trong kiến trúc Microservices của **Multilingual Web Chat Backend**, bao gồm cấu trúc gói mã nguồn, phạm vi trách nhiệm và mối liên kết giữa các dịch vụ.

---

## 📑 MỤC LỤC
1. [Tổng Quan 7 Phân Hệ Kỹ Thuật & Nghiệp Vụ](#1-tổng-quan-7-phân-hệ-kỹ-thuật--nghiệp-vụ)
2. [Module 1: API Gateway & Định Tuyến An Toàn (api-gateway)](#2-module-1-api-gateway--định-tuyến-an-toàn-api-gateway)
3. [Module 2: Định Danh, Xác Thực & Phiên Làm Việc (identify-service)](#3-module-2-định-danh-xác-thực--phiên-làm-việc-identify-service)
4. [Module 3: Quản Trị, Kiểm Duyệt & Nhật Ký Kiểm Vết (identify-service)](#4-module-3-quản-trị-kiểm-duyệt--nhật-ký-kiểm-vết-identify-service)
5. [Module 4: Quản Lý Hội Thoại, Nhóm & Kênh (chat-service)](#5-module-4-quản-lý-hội-thoại-nhóm--kênh-chat-service)
6. [Module 5: Nhắn Tin Thời Gian Thực STOMP (chat-service)](#6-module-5-nhắn-tin-thời-gian-thực-stomp-chat-service)
7. [Module 6: Động Cơ Dịch Thuật AI Đa Tầng (chat-service)](#7-module-6-động-cơ-dịch-thuật-ai-đa-tầng-chat-service)
8. [Module 7: Báo Hiệu Cuộc Gọi Trực Tiếp WebRTC (chat-service)](#8-module-7-báo-hiệu-cuộc-gọi-trực-tiếp-webrtc-chat-service)

---

## 1. Tổng Quan 7 Phân Hệ Kỹ Thuật & Nghiệp Vụ

Hệ thống được module hóa theo nguyên tắc đơn trách nhiệm (Single Responsibility Principle) và phân chia rõ ràng theo Bounded Context:

```
[ Client Requests ]
        │
        ▼
[ Module 1: API Gateway ] ──── Reverse Proxy, Rate Limit, Security Headers
        ├───────────────────────────────┐
        ▼                               ▼
[ IDENTIFY SERVICE ]            [ CHAT SERVICE ]
  ├─ Module 2: Auth & Users       ├─ Module 4: Conversations & Groups
  └─ Module 3: Admin & Reports    ├─ Module 5: Real-time STOMP Messaging
                                  ├─ Module 6: AI Translation Engine (Kafka + Gemini)
                                  └─ Module 7: WebRTC Signaling
```

---

## 2. Module 1: API Gateway & Định Tuyến An Toàn (api-gateway)

- **Package:** `com.example.gateway`
- **Thành phần chính:**
  - `AuthenticationFilter`: GlobalFilter kiểm tra tính hợp lệ của token trước khi forward request xuống các dịch vụ nội bộ. Tích hợp Reactive Redis để giới hạn tần suất request (Rate Limiting).
  - `CorsDeduplicationFilter`: Loại bỏ các header `Access-Control-Allow-*` trùng lặp khi request đi qua gateway.
  - `WebClientConfig`: Cấu hình WebClient phi chặn để gọi kiểm tra token (`/auth/introspect`) sang `identify-service`.
- **Đặc thù định tuyến:**
  - Chuyển tiếp kết nối WebSocket (`Upgrade: websocket`) tới `ws://chat-service:8081`.
  - Phân luồng các callback Google OAuth2 chính xác đến `identify-service:8080`.

---

## 3. Module 2: Định Danh, Xác Thực & Phiên Làm Việc (identify-service)

- **Package:** `com.example.identity`
- **Thành phần chính:**
  - `AuthenticationController` & `AuthenticationService`: Đăng nhập, đăng ký, refresh token, thu hồi token (logout), xác thực hai chiều qua email (kích hoạt tài khoản, đặt lại mật khẩu).
  - `UserController` & `UserService`: Quản lý thông tin hồ sơ cá nhân, cập nhật avatar, cover photo, tìm kiếm người dùng theo từ khóa, tra cứu hồ sơ hàng loạt (`/batch`).
  - Quản lý phiên đăng nhập: Tự động ghi nhận thiết bị đăng nhập vào bảng `user_sessions`, cho phép người dùng xem và đăng xuất các phiên đăng nhập từ xa.

---

## 4. Module 3: Quản Trị, Kiểm Duyệt & Nhật Ký Kiểm Vết (identify-service)

- **Package:** `com.example.identity.controller.AdminController`
- **Thành phần chính:**
  - **Khóa/Mở Tài Khoản Người Dùng:** API `PUT /admin/users/{userId}/toggle-ban` bảo vệ bằng `@PreAuthorize("hasAuthority('SCOPE_ROLE_ADMIN')")`. Khi thực hiện, hệ thống tự động ghi nhật ký vào `audit_logs`.
  - **Đổi Vai Trò Người Dùng (Role Management):** API `PUT /admin/users/{userId}/role` cho phép Quản trị viên thay đổi vai trò tài khoản (`ROLE_ADMIN` hoặc `ROLE_USER`).
  - **Quản Lý Báo Cáo Vi Phạm (Reports):** Tiếp nhận báo cáo người dùng hoặc tin nhắn xấu từ thành viên (`POST /admin/reports`), Admin thẩm định và đánh dấu hoàn tất (`PUT /admin/reports/{id}/resolve`).
  - **Cấu Hình Tham Số Toàn Cục (System Configs):** Lưu trữ dạng Key-Value trong bảng `system_config` để điều chỉnh linh hoạt các tham số vận hành:
    - `banned_keywords`: Danh sách từ khóa cấm, tự động che dấu tin nhắn vi phạm thành `***`.
    - `broadcast_announcement`: Biểu ngữ thông báo toàn hệ thống hiển thị tức thời cho người dùng.
    - `maintenance_mode`: Bật/Tắt chế độ bảo trì hệ thống.
    - `min_group_members`: Ngưỡng thành viên tối thiểu yêu cầu khi tạo nhóm chat.
    - `ai_rate_limit`: Giới hạn tần suất gọi dịch thuật AI trên phút cho mỗi tài khoản.

---

## 5. Module 4: Quản Lý Hội Thoại, Nhóm & Kênh (chat-service)

- **Package:** `com.example.chat.controller.ConversationController`
- **Nghiệp vụ cốt lõi:**
  - **Hội thoại 1-1 & Nhóm chat:** Tạo phòng chat cá nhân hoặc nhóm chat (tối thiểu 3 thành viên theo cấu hình).
  - **Quản trị thành viên:** Thêm thành viên mới, phân quyền Admin nhóm, đuổi thành viên khỏi nhóm (`kick`), bật tắt tiếng (`mute`), cấm thành viên (`ban`).
  - **Cơ chế chống spam (Slow Mode):** Thiết lập số giây giãn cách tối thiểu giữa 2 lần gửi tin nhắn trong nhóm.
  - **Mã mời tham gia nhóm:** Sinh và kiểm tra mã mời ngẫu nhiên (`inviteCode`) cho phép tham gia nhanh qua liên kết.
  - **Kênh phát thông tin (Channel):** Hỗ trợ tạo kênh thông báo công khai (`isPublicChannel`), người dùng có thể đăng ký theo dõi (`subscribe`) và xem thống kê lượng subscriber.

---

## 6. Module 5: Nhắn Tin Thời Gian Thực STOMP (chat-service)

- **Package:** `com.example.chat.service.ChatService` & `MessageService`
- **Nghiệp vụ cốt lõi:**
  - Tiếp nhận frame STOMP gửi tới `/app/chat`.
  - Kiểm tra điều kiện thành viên, trạng thái cấm (`isBanned`), tắt tiếng (`isMuted`) và vi phạm chế độ chậm (`slowModeSeconds`).
  - Lưu trữ tin nhắn vào CSDL `chat_db` và broadcast ngay lập tức qua topic `/topic/{conversationId}`.
  - Hỗ trợ đầy đủ các hành động nghiệp vụ tin nhắn:
    - `SEND` / `FORWARD`: Gửi mới hoặc chuyển tiếp tin nhắn.
    - `EDIT`: Chỉnh sửa nội dung tin nhắn đã gửi hoặc thực hiện bình chọn (Poll vote). **Chính sách 24h: Nghiêm cấm chỉnh sửa tin nhắn đã gửi quá 24 giờ.**
    - `DELETE`: Xóa mềm tin nhắn (đổi nội dung thành *"Tin nhắn đã bị xóa"*). **Chính sách 24h: Nghiêm cấm thu hồi hoặc xóa tin nhắn đã gửi quá 24 giờ.**
    - `PIN` / `UNPIN`: Ghim hoặc bỏ ghim tin nhắn quan trọng trong phòng.
    - `REACT`: Thả biểu cảm cảm xúc dạng `userId:emoji;...`.
    - `SEEN`: Đánh dấu trạng thái đã đọc tin nhắn.

---

## 7. Module 6: Động Cơ Dịch Thuật AI Đa Tầng (chat-service)

- **Package:** `com.example.chat.service.ChatService`
- **Cơ chế thực thi:**
  - Sử dụng Apache Kafka Topic `translate-group` để xử lý dịch thuật hoàn toàn bất đồng bộ.
  - Sau khi lưu tin nhắn văn bản, `ChatService` đẩy `messageId` vào Kafka.
  - `@KafkaListener` tiếp nhận sự kiện, xác định ngôn ngữ đích theo cấu hình phòng chat hoặc hồ sơ người nhận.
  - **Tầng 1 (Chính):** Gọi Google Gemini AI qua REST Feign client.
  - **Tầng 2 (Dự phòng):** Nếu Gemini AI gặp lỗi hoặc hết hạn ngạch (429), tự động chuyển sang gọi MyMemory Translated API miễn phí.
  - Cập nhật kết quả vào cột `message_text_translate` và broadcast sự kiện `EDIT` tới tất cả thành viên trong phòng chat qua WebSocket.

---

## 8. Module 7: Báo Hiệu Cuộc Gọi Trực Tiếp WebRTC (chat-service)

- **Package:** `com.example.chat.service.ChatService`
- **Cơ chế thực thi:**
  - Nhận diện các tin nhắn có `type == MessageType.CALL_SIGNAL`.
  - Bỏ qua bước ghi CSDL vĩnh viễn đối với các gói tin SDP và ICE Candidates tạm thời.
  - Chuyển phát trực tiếp dữ liệu báo hiệu đến kênh riêng của người nhận qua `/user/queue/messages`.
  - Cho phép 2 trình duyệt thiết lập thành công kết nối Peer-to-Peer (P2P) truyền tải âm thanh và hình ảnh trực tiếp với độ trễ siêu thấp.
