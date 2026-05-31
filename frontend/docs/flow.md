# 🔄 Multilingual Web Chat System Workflows & Sequence Diagrams

> Tài liệu mô tả toàn bộ quy trình nghiệp vụ (Business Workflows), sơ đồ tương tác tuần tự (Sequence Diagrams) và cơ chế vận hành tự động của nền tảng **Multilingual Web Chat**.

---

## 📑 MỤC LỤC
1. [Sơ Đồ Kiến Trúc Tổng Thể](#1-sơ-đồ-kiến-trúc-tổng-thể)
2. [Luồng Đăng Ký & Kích Hoạt Tài Khoản Qua Email](#2-luồng-đăng-ký--kích-hoạt-tài-khoản-qua-email)
3. [Luồng Đăng Nhập Mật Khẩu & Google OAuth2](#3-luồng-đăng-nhập-mật-khẩu--google-oauth2)
4. [Luồng Nhắn Tin Realtime & Dịch Thuật Đa Ngôn Ngữ Bất Đồng Bộ](#4-luồng-nhắn-tin-realtime--dịch-thuật-đa-ngôn-ngữ-bất-đồng-bộ)
5. [Luồng Báo Hiệu Cuộc Gọi Trực Tiếp WebRTC (P2P Audio / Video Call)](#5-luồng-báo-hiệu-cuộc-gọi-trực-tiếp-webrtc-p2p-audio--video-call)
6. [Luồng Điều Phối Nhóm & Kiểm Duyệt Quản Trị (Moderation & Admin Flow)](#6-luồng-điều-phối-nhóm--kiểm-duyệt-quản-trị-moderation--admin-flow)

---

## 1. Sơ Đồ Kiến Trúc Tổng Thể

```mermaid
graph TD
    Client["React Frontend (SPA)<br/>Port 5173 / Trình duyệt"] -->|HTTP REST / WebSocket STOMP| Gateway["API Gateway<br/>Spring Cloud Gateway (Port 8000)"]

    subgraph "Hạ Tầng Microservices Lõi"
        Gateway -->|Route /api/v1/identify/**| IdentifySvc["Identify Service<br/>Spring Boot (Port 8080)"]
        Gateway -->|Route /api/v1/chat/**| ChatSvc["Chat Service<br/>Spring Boot (Port 8081)"]
        Gateway -->|Route /api/v1/chat/ws/**| ChatWS["Chat WebSocket STOMP Broker<br/>Port 8081"]

        Gateway <-->|Check Rate Limit & Blacklist| Redis[("Redis 7<br/>Cache & Rate Limiter")]
        IdentifySvc <-->|User & Session Data| IdentifyDB[("MySQL: identify_db")]
        ChatSvc <-->|Conversations & Messages| ChatDB[("MySQL: chat_db")]

        ChatSvc <-->|Kafka Topic: translate-group| Kafka["Apache Kafka 3.8"]
    end

    subgraph "Tích Hợp Dịch Vụ Ngoài"
        IdentifySvc <-->|OAuth2 Authentication| GoogleOAuth["Google OAuth2 Provider"]
        IdentifySvc <-->|Activation & Reset Emails| BrevoMail["Brevo API / SMTP Server"]
        ChatSvc <-->|"AI Translation (Primary)"| GeminiAI["Google Gemini AI (v1beta)"]
        ChatSvc <-->|Translation Fallback| MyMemory["MyMemory API"]
        Client <-->|Upload Media/Images| Cloudinary["Cloudinary CDN"]
        Client <-->|Direct Video/Voice Streams| RemotePeer["Remote User (P2P WebRTC)"]
    end
```

---

## 2. Luồng Đăng Ký & Kích Hoạt Tài Khoản Qua Email

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Gateway as API Gateway
    participant Identify as Identify Service
    participant DB as identify_db (MySQL)
    participant Mail as Brevo / SMTP Server

    Client->>Gateway: POST /api/v1/identify/users (username, email, password, fullName)
    Gateway->>Identify: Forward Request
    Identify->>DB: Kiểm tra Email / Username đã tồn tại?
    alt Đã tồn tại
        Identify-->>Client: 409 Conflict (EMAIL_ALREADY_EXISTS / USERNAME_ALREADY_EXISTS)
    else Hợp lệ
        Identify->>Identify: Băm mật khẩu bằng BCrypt
        Identify->>DB: Tạo User mới (is_active = 0, role = ROLE_USER)
        Identify->>Identify: Tạo Activation Token JWT (TTL: 24 giờ)
        Identify->>Mail: Gửi email kích hoạt kèm link /api/v1/identify/auth/active?token=...
        Identify-->>Client: 201 Created ("Please check your email to activate your account")
    end

    Client->>Gateway: GET /api/v1/identify/auth/active?token=...
    Gateway->>Identify: Forward Request
    Identify->>Identify: Xác minh tính hợp lệ và thời hạn của Token
    Identify->>DB: Cập nhật status `is_active = 1`
    Identify-->>Client: HTTP 302 Redirect về trang chủ Frontend (/)
```

---

## 3. Luồng Đăng Nhập Mật Khẩu & Google OAuth2

### 3.1 Đăng Nhập Bằng Mật Khẩu (Standard Login)
```mermaid
sequenceDiagram
    autonumber
    actor User as Frontend App
    participant Gateway as API Gateway
    participant Redis as Redis Cache
    participant Identify as Identify Service
    participant DB as identify_db

    User->>Gateway: POST /api/v1/identify/auth (username, password)
    Gateway->>Identify: Forward Request
    Identify->>DB: Tìm kiếm User theo Username
    Identify->>Identify: Khớp mật khẩu BCrypt
    alt Mật khẩu sai hoặc tài khoản chưa kích hoạt
        Identify-->>User: Trả về ErrorCode 1002 hoặc 1006
    else Đăng nhập thành công
        Identify->>Identify: Tạo Access JWT Token (sub, role, expiration)
        Identify->>DB: Ghi nhận phiên UserSession (IP, User-Agent, expires_at)
        Identify-->>User: Trả về AuthenticationResponse + Set Cookie HttpOnly `token`
    end

    User->>Gateway: GET /api/v1/chat/message/conv_123 (Authorization: Bearer <TOKEN>)
    Gateway->>Redis: Kiểm tra Token có trong Blacklist không?
    alt Token bị Blacklist
        Gateway-->>User: 401 Unauthenticated
    else Token hợp lệ
        Gateway->>Identify: Introspect Token (WebClient phi chặn)
        Identify-->>Gateway: Result { valid: true }
        Gateway->>Gateway: Forward Request sang Chat Service
    end
```

### 3.2 Đăng Nhập Một Chạm Google OAuth2
```mermaid
sequenceDiagram
    autonumber
    actor User as Trình Duyệt
    participant Gateway as API Gateway
    participant Identify as Identify Service
    participant Google as Google OAuth2 Server
    participant Frontend as Frontend SPA

    User->>Gateway: GET /api/v1/identify/login/oauth2/authorization/google
    Gateway->>Identify: Forward Request
    Identify->>Google: Chuyển hướng người dùng xác nhận đăng nhập Google
    Google-->>Identify: Callback /api/v1/identify/auth/oauth2/success?code=...
    Identify->>Google: Trao đổi lấy Profile (email, name, picture, sub)
    Identify->>Identify: Tạo mới hoặc cập nhật User trong identify_db
    Identify->>Identify: Sinh Access JWT Token
    Identify-->>User: Chuyển hướng về Frontend: /chat?token=<JWT_TOKEN>
    User->>Frontend: Lưu Token vào LocalStorage và chuyển vào phòng chat
```

---

## 4. Luồng Nhắn Tin Realtime & Dịch Thuật Đa Ngôn Ngữ Bất Đồng Bộ

```mermaid
sequenceDiagram
    autonumber
    actor Sender as Người Gửi (User A)
    participant WS as WebSocket STOMP (Chat Service)
    participant DB as chat_db (MySQL)
    participant Kafka as Kafka Broker (translate-group)
    participant AI as Gemini AI / MyMemory API
    actor Receiver as Người Nhận (User B)

    Sender->>WS: STOMP Publish /app/chat (MessageRequest: type=TEXT, action=SEND)
    WS->>DB: Kiểm tra quyền: Thành viên? Banned? Muted? Slow Mode?
    alt Vi phạm Slow Mode hoặc bị Cấm
        WS-->>Sender: Gửi thông báo lỗi qua /user/queue/messages
    else Hợp lệ
        WS->>DB: Lưu Tin nhắn Gốc vào bảng `message` (status = 'SENT')
        WS-->>Sender: Broadcast Tin nhắn Gốc ngay lập tức qua /topic/{conversationId}
        WS-->>Receiver: Broadcast Tin nhắn Gốc ngay lập tức qua /topic/{conversationId}

        opt Nội dung là văn bản (chứa ký tự chữ cái cần dịch)
            WS->>Kafka: Publish Event (messageId) tới Topic `translate-group`
        end
    end

    note over Kafka, AI: Xử lý Bất đồng bộ qua Kafka Worker
    Kafka->>WS: @KafkaListener nhận messageId
    WS->>DB: Lấy thông tin tin nhắn & xác định Target Locale của phòng/người nhận
    WS->>AI: Gửi yêu cầu dịch sang Google Gemini AI API
    alt Gemini AI dịch thành công
        AI-->>WS: Văn bản đã dịch
    else Gemini AI lỗi hoặc quá hạn ngạch (Quota limit 429)
        WS->>AI: Tự động Fallback sang MyMemory REST API
        AI-->>WS: Văn bản dịch dự phòng
    end

    WS->>DB: UPDATE `message` SET message_text_translate = VănBảnDịch
    WS-->>Sender: Broadcast Event action='EDIT' (kèm nội dung dịch) qua /topic/{conversationId}
    WS-->>Receiver: Broadcast Event action='EDIT' (kèm nội dung dịch) qua /topic/{conversationId}
```

---

## 5. Luồng Báo Hiệu Cuộc Gọi Trực Tiếp WebRTC (P2P Audio / Video Call)

```mermaid
sequenceDiagram
    autonumber
    actor Caller as Người Gọi (User A)
    participant STOMP as Chat Service STOMP Broker
    actor Callee as Người Nhận (User B)

    Caller->>STOMP: Send /app/chat (type: 'CALL_SIGNAL', action: 'SEND', text: 'CALL_OFFER:SDP_DATA')
    note over STOMP: Chat Service nhận dạng CALL_SIGNAL -> Bỏ qua lưu CSDL vĩnh viễn
    STOMP-->>Callee: Gửi trực tiếp qua Kênh Cá Nhân /user/queue/messages

    alt Callee Chấp nhận cuộc gọi (Accept)
        Callee->>STOMP: Send /app/chat (type: 'CALL_SIGNAL', text: 'CALL_ANSWER:SDP_DATA')
        STOMP-->>Caller: Forward qua /user/queue/messages
        
        loop Trao đổi ICE Candidates
            Caller->>STOMP: Send ICE Candidate
            STOMP-->>Callee: Forward ICE Candidate
            Callee->>STOMP: Send ICE Candidate
            STOMP-->>Caller: Forward ICE Candidate
        end
        note over Caller, Callee: KẾT NỐI WEBRTC P2P TRỰC TIẾP TRUYỀN TẢI AUDIO/VIDEO
    else Callee Từ chối (Decline)
        Callee->>STOMP: Send /app/chat (type: 'CALL_SIGNAL', text: 'CALL_DECLINE')
        STOMP-->>Caller: Forward qua /user/queue/messages
        note over Caller: Đóng Modal Cuộc Gọi
    end
```

---

## 6. Luồng Điều Phối Nhóm & Kiểm Duyệt Quản Trị (Moderation & Admin Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Quản Trị Viên (Admin)
    participant Gateway as API Gateway
    participant Identify as Identify Service
    participant DB as identify_db (MySQL)

    Admin->>Gateway: PUT /api/v1/identify/admin/users/{userId}/toggle-ban
    Gateway->>Gateway: Xác thực Token có quyền SCOPE_ROLE_ADMIN
    Gateway->>Identify: Forward Request
    Identify->>DB: Đảo trạng thái `is_active` của User
    Identify->>DB: Ghi nhật ký vào bảng `audit_logs` (action: USER_BAN / USER_UNBAN)
    Identify-->>Admin: 200 OK (Trả về trạng thái active mới)

    Admin->>Gateway: GET /api/v1/identify/admin/reports
    Gateway->>Identify: Forward Request
    Identify->>DB: SELECT * FROM reports WHERE status = 'PENDING'
    Identify-->>Admin: Trả về danh sách báo cáo vi phạm

    Admin->>Gateway: PUT /api/v1/identify/admin/users/{userId}/role?role=ROLE_ADMIN
    Gateway->>Identify: Forward Request
    Identify->>DB: UPDATE users SET role = 'ROLE_ADMIN' WHERE user_id = userId
    Identify->>DB: Ghi nhật ký vào `audit_logs` (action: ROLE_CHANGE)
    Identify-->>Admin: 200 OK
```

---

## 7. Luồng Kiểm Soát Giới Hạn Sửa & Thu Hồi Tin Nhắn (24-Hour Policy Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người Gửi Tin Nhắn
    participant UI as Giao Diện Chat (Frontend)
    participant WS as WebSocket STOMP (Chat Service)
    participant DB as chat_db (MySQL)

    note over UI: Tin nhắn hiển thị trên màn hình
    UI->>UI: Tính toán tuổi của tin nhắn: (now - sentDatetime)
    alt Tin nhắn gửi > 24 giờ
        UI->>UI: Ẩn hoàn toàn nút Sửa (Pencil) và Xóa (Trash) trên Toolbar
    else Tin nhắn gửi trong vòng 24 giờ
        UI->>UI: Hiển thị đầy đủ nút Sửa và Xóa
    end

    opt Người dùng cố tình gửi sự kiện EDIT hoặc DELETE (WebSocket / REST)
        User->>WS: Gửi Action EDIT hoặc DELETE (kèm messageId)
        WS->>DB: Truy vấn tin nhắn theo messageId
        WS->>WS: Kiểm tra `message.sentDatetime.plus(24h).isBefore(now)`
        alt Đã quá 24 giờ
            WS-->>User: Từ chối xử lý, ghi log cảnh báo (Hoặc trả về 400 Bad Request nếu qua REST)
        else Trong hạn 24 giờ
            WS->>DB: Cập nhật nội dung (EDIT) hoặc đánh dấu xóa mềm `is_deleted = true` (DELETE)
            WS-->>WS: Broadcast sự kiện tới toàn bộ phòng chat qua /topic/{conversationId}
        end
    end
```

