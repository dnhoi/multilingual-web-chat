# 🌐 Multilingual Web Chat — Real-Time Communication & Collaboration Platform

> **Hệ thống Trò chuyện Trực tuyến Đa Ngôn ngữ Thời Gian Thực** với khả năng **Tự động Dịch Thuật Đa Tầng bằng AI (Google Gemini & MyMemory Fallback)**, **Gọi Thoại & Video Trực Tiếp Trên Trình Duyệt (WebRTC P2P)**, quản lý Nhóm & Kênh (Channel), bình chọn (Poll), tải lên đa phương tiện trên CDN Cloudinary và kiến trúc Microservices hiện đại (Spring Boot 3.4 + React 19).

[![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.8-brightgreen.svg?logo=springboot)](https://spring.io/projects/spring-boot)
[![Spring Cloud](https://img.shields.io/badge/Spring%20Cloud-2024.0.1-blue.svg)](https://spring.io/projects/spring-cloud)
[![React](https://img.shields.io/badge/React-19.1-blue.svg?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.0-purple.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1-38B2AC.svg?logo=tailwindcss)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg?logo=mysql)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg?logo=redis)](https://redis.io/)
[![Apache Kafka](https://img.shields.io/badge/Apache%20Kafka-3.8-black.svg?logo=apachekafka)](https://kafka.apache.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker)](https://www.docker.com/)

---

## 📌 Mục Lục
1. [Giới Thiệu Dự Án](#-giới-thiệu-dự-án)
2. [Kiến Trúc Hệ Thống & Tech Stack](#-kiến-trúc-hệ-thống--tech-stack)
3. [Các Tính Năng Cốt Lõi](#-các-tính-năng-cốt-lõi)
4. [Tài Khoản Mẫu & Phân Quyền (RBAC)](#-tài-khoản-mẫu--phân-quyền-rbac)
5. [Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
6. [Yêu Cầu Tiên Quyết (Prerequisites)](#-yêu-cầu-tiên-quyết-prerequisites)
7. [Hướng Dẫn Cài Đặt & Khởi Chạy Từng Bước](#-hướng-dẫn-cài-đặt--khởi-chạy-từng-bước)
8. [Cấu Hình Biến Môi Trường & Cổng Mạng](#-cấu-hình-biến-môi-trường--cổng-mạng)
9. [Bảng Tra Cứu API & Giao Thức WebSocket](#-bảng-tra-cứu-api--giao-thức-websocket)
10. [Hệ Thống Tài Liệu Đặc Tả Chi Tiết](#-hệ-thống-tài-liệu-đặc-tả-chi-tiết)

---

## 📖 Giới Thiệu Dự Án

**Multilingual Web Chat** là giải pháp toàn diện phá vỡ rào cản ngôn ngữ trong giao tiếp và hợp tác toàn cầu. Được xây dựng trên nền tảng **Microservices hướng sự kiện (EDA)** và giao diện **Single Page Application (SPA)** hiện đại:

- **Dịch Thuật Tự Động Bất Đồng Bộ Bằng AI (AI Translation Pipeline)**: Người dùng có thể thoải mái gửi tin nhắn bằng tiếng mẹ đẻ. Hệ thống phân luồng qua **Apache Kafka**, gọi **Google Gemini AI** để dịch theo ngữ cảnh sang ngôn ngữ mục tiêu của đối phương hoặc của phòng chat. Nếu Gemini AI vượt hạn mức quota hoặc mất kết nối, hệ thống tự động fallback sang **MyMemory API** mà không làm nghẽn luồng gửi nhận tin nhắn tức thì.
- **Cuộc Gọi Thoại & Video P2P Trực Tiếp (WebRTC)**: Tận dụng Spring WebSocket STOMP Broker làm máy chủ báo hiệu (Signaling Server), cho phép 2 trình duyệt trực tiếp đàm phán SDP và hoán đổi ứng viên ICE để truyền tải media luồng thời gian thực với độ trễ cực thấp.
- **Hội Thoại & Quản Trị Nhóm Đa Cấp**: Chat 1-1, Nhóm chat (tối thiểu 3 thành viên), Kênh phát thông tin (Channel) công khai có số lượng subscriber, mã mời tham gia nhóm (`invite_code`), chế độ hạn chế tần suất gửi tin nhắn (Slow Mode), ghim thông báo, cấm (`ban`) và tắt tiếng (`mute`) thành viên vi phạm.
- **Đa Phương Tiện & Tiện Ích Đỉnh Cao**: Tải ảnh, video, âm thanh ghi âm giọng nói trực tiếp lên CDN Cloudinary, bình chọn tương tác (Polls), chia sẻ vị trí địa lý, ghim tin nhắn, thả biểu cảm emoji đa dạng.
- **Bảo Mật Cấp Doanh Nghiệp**: Token JWT ký bằng thuật toán HMAC-SHA512 qua Nimbus JOSE, đăng nhập một chạm Google OAuth2, kích hoạt tài khoản bằng email qua Brevo API / SMTP, quản lý và thu hồi phiên đăng nhập từ xa (User Sessions), phòng thủ brute-force bằng Reactive Redis Rate Limiter và bảo vệ an ninh qua bộ HTTP Security Headers.

---

## 🏗️ Kiến Trúc Hệ Thống & Tech Stack

### Sơ Đồ Kiến Trúc Tổng Thể

```mermaid
graph TD
    Client["React Frontend (SPA)<br/>Vite 7 / React 19 / Port 5173"] -->|HTTP REST / WebSocket STOMP| Gateway["API Gateway<br/>Spring Cloud Gateway (Port 8000)"]
    
    subgraph "Backend Microservices Core"
        Gateway -->|Route /api/v1/identify/**| IdentifySvc["Identify Service (Port 8080)<br/>Auth, User, Admin, Sessions"]
        Gateway -->|Route /api/v1/chat/**| ChatSvc["Chat Service (Port 8081)<br/>Conversations, Messages"]
        Gateway -->|Route /api/v1/chat/ws/**| ChatWS["WebSocket STOMP Broker<br/>Port 8081"]
        
        Gateway <-->|Check Rate Limit & Token Blacklist| Redis[("Redis 7<br/>Cache & Rate Limiter")]
        IdentifySvc <-->|User & Session Data| IdentifyDB[("MySQL: identify_db")]
        ChatSvc <-->|Messages & Conversations| ChatDB[("MySQL: chat_db")]
        
        ChatSvc <-->|Kafka Topic: translate-group| Kafka["Apache Kafka 3.8"]
    end
    
    subgraph "Dịch Vụ Ngoại Vi"
        IdentifySvc <-->|OAuth2 Authentication| GoogleOAuth["Google OAuth2 Provider"]
        IdentifySvc <-->|Activation & Reset Emails| BrevoMail["Brevo API / SMTP Server"]
        ChatSvc <-->|AI Translation (Primary)| GeminiAI["Google Gemini AI"]
        ChatSvc <-->|Translation Fallback| MyMemory["MyMemory API"]
        Client <-->|Upload Media/Images| Cloudinary["Cloudinary CDN"]
        Client <-->|Direct Video/Voice Media Streams| Peer["Remote User (P2P WebRTC)"]
    end
```

### Bảng Công Nghệ Sử Dụng (Technology Matrix)

| Lớp (Layer) | Công Nghệ / Thư Viện | Phiên Bản | Vai Trò & Điểm Nổi Bật |
| :--- | :--- | :--- | :--- |
| **Backend Runtime** | OpenJDK | **21 LTS** | Hiệu năng cao, Virtual Threads, Pattern Matching |
| **Core Framework** | Spring Boot | **3.4.7 / 3.4.8** | Dependency Injection, WebMvc, Reactive WebFlux |
| **Cloud Services** | Spring Cloud | **2024.0.1** | Spring Cloud Gateway, OpenFeign Client |
| **Bảo Mật & Token** | Spring Security + Nimbus JOSE | 3.4.x | JWT Signer HMAC-SHA512, OAuth2 Resource Server |
| **Đăng Nhập Xã Hội**| Spring Security OAuth2 Client | 3.4.x | Đăng nhập một chạm qua tài khoản Google |
| **ORM / Data** | Spring Data JPA / Hibernate | 3.4.x | Quản lý giao dịch, Auditing, Multi-DB mapping |
| **Cơ Sở Dữ Liệu** | MySQL | **8.0+** | Tách biệt `identify_db` và `chat_db`, charset `utf8mb4` |
| **Bộ Nhớ Đệm** | Redis (Reactive & Classic) | **7.x** | Rate Limiting phân tầng, Token Blacklist, Sessions |
| **Message Broker** | Apache Kafka | **3.8.0** | Hàng đợi sự kiện xử lý dịch thuật AI bất đồng bộ |
| **Real-time Broker**| Spring WebSocket (STOMP) | 3.4.8 | Nhắn tin thời gian thực, WebRTC Call Signaling |
| **AI Translation** | Google Gemini AI API | v1beta | Dịch tự động tin nhắn theo ngữ cảnh ngôn ngữ |
| **Dịch Dự Phòng** | MyMemory Translated API | REST | Dự phòng tự động khi Gemini AI chạm hạn mức |
| **Email Service** | Brevo API / Spring Mail | 1.1.0 | Gửi Transactional Mail kích hoạt & reset password |
| **Frontend Library**| React | **^19.1.0** | Component-based UI hiện đại, Hooks, Contexts |
| **Frontend Tool** | Vite | **^7.0.4** | Bundler siêu tốc, Hot Module Replacement (HMR) |
| **Frontend Styling**| Tailwind CSS | **^4.1.11** | Utility-first CSS với `@tailwindcss/postcss` |
| **Realtime Client** | `@stomp/stompjs` + `sockjs-client` | **^7.1.1** | Kết nối STOMP qua WebSocket với fallback HTTP |
| **Gọi Trực Tiếp** | WebRTC Native Browser API | Native | Đàm thoại âm thanh và video Peer-to-Peer |
| **Media Storage** | Cloudinary REST API | REST CDN | Tải và phân phối ảnh, video, âm thanh trực tiếp |

---

## ⚡ Các Tính Năng Cốt Lõi

### 1. Nhắn Tin Thời Gian Thực Đỉnh Cao
- Gửi tin nhắn tức thời qua giao thức WebSocket STOMP tới đích `/app/chat`.
- Hỗ trợ đầy đủ các hành động: Gửi (`SEND`), Sửa nội dung (`EDIT`), Xóa tin nhắn (`DELETE`), Ghim tin (`PIN`/`UNPIN`), Thả cảm xúc emoji (`REACT`), Đánh dấu đã đọc (`SEEN`), Trả lời trích dẫn (`REPLY`), Chuyển tiếp tin (`FORWARD`).
- Hỗ trợ đa dạng loại nội dung: Văn bản (`TEXT`), Hình ảnh (`IMAGE`), Video (`VIDEO`), Âm thanh giọng nói (`AUDIO`), Tệp tin (`FILE`), Bình chọn (`POLL`), Chia sẻ vị trí (`LOCATION`).
- **Giới hạn thời gian Sửa & Thu hồi/Xóa tin nhắn (24h Policy):** Nghiêm cấm và chặn hoàn toàn việc chỉnh sửa hoặc thu hồi tin nhắn đã gửi quá 24 giờ ở cả tầng giao diện (ẩn nút Sửa/Xóa) và máy chủ Backend (chặn kiểm duyệt tại REST API & WebSocket handler).

### 2. Dịch Thuật Đa Ngôn Ngữ Tự Động Bằng AI
- Tự động nhận diện tin nhắn văn bản có chứa chữ cái để đưa vào hàng đợi xử lý ngầm (Kafka Topic `translate-group`).
- Tự động nhận biết ngôn ngữ mục tiêu dựa theo thiết lập của phòng chat hoặc ngôn ngữ ưu tiên của người nhận (`VI`, `EN`, `JA`, `KO`, `ZH`).
- Tự động dịch thuật qua Google Gemini AI, tự động chuyển sang MyMemory API nếu gặp sự cố.
- Cập nhật bản dịch và phát sóng sự kiện `EDIT` tới mọi thành viên trong phòng chat.

### 3. Đàm Thoại Trực Tiếp WebRTC (Audio & Video Calling)
- Tích hợp cuộc gọi 1-1 trực tiếp trên giao diện trình duyệt mà không cần cài đặt thêm tiện ích ngoài.
- Sử dụng WebSocket STOMP để truyền tải các gói tín hiệu `CALL_OFFER`, `CALL_ANSWER`, `ICE_CANDIDATE`, `CALL_DECLINE`, `CALL_END`, `CALL_CANCEL`.
- Sau khi thiết lập xong báo hiệu, luồng âm thanh và hình ảnh được truyền trực tiếp P2P giữa hai trình duyệt.

### 4. Quản Trị Nhóm & Kênh Thông Báo
- Tạo phòng chat 1-1 hoặc nhóm chat (tối thiểu 3 thành viên theo cấu hình hệ thống).
- Phân quyền quản trị nhóm: `OWNER`, `ADMIN`, `MEMBER`.
- Quản lý thành viên: Thêm thành viên, Đổi quyền, Đuổi khỏi nhóm (`kick`), Tắt tiếng (`mute`), Cấm thành viên (`ban`).
- Chế độ chậm (Slow Mode): Giới hạn khoảng cách thời gian giữa 2 tin nhắn liên tiếp để ngăn chặn spam.
- Mã mời tham gia nhóm (`invite_code`): Tạo liên kết cho phép người khác tự tham gia nhóm nhanh chóng.
- Kênh thông báo công khai (Channels): Hỗ trợ kênh tin tức một chiều có số lượng người theo dõi (`subscriber_count`).

### 5. Quản Trị Hệ Thống (Admin Dashboard)
- **Quản lý tài khoản & Phân quyền:** Khóa hoặc mở khóa tài khoản người dùng (`toggle-ban`), thay đổi vai trò người dùng giữa `ROLE_ADMIN` và `ROLE_USER` (`PUT /admin/users/{userId}/role`).
- **Tiếp nhận & Xử lý báo cáo vi phạm:** Nút báo cáo tin nhắn/người dùng tích hợp sẵn trên menu tin nhắn của giao diện chat (`POST /admin/reports`), Admin dễ dàng thẩm định và đóng báo cáo (`PUT /admin/reports/{id}/resolve`).
- **Cấu hình hệ thống động (`system_configs`):**
  - **Bộ lọc từ khóa cấm (`banned_keywords`):** Tự động phát hiện và che giấu `***` các từ ngữ độc hại trong tin nhắn chat.
  - **Thông báo toàn hệ thống (`broadcast_announcement`):** Banner hiển thị thông điệp khẩn cấp trên đầu màn hình chat của mọi người dùng.
  - **Chế độ bảo trì (`maintenance_mode`):** Tạm ngừng kết nối chat phục vụ nâng cấp máy chủ.
  - **Số lượng thành viên tối thiểu (`min_group_members`):** Điều chỉnh ngưỡng thành viên khi tạo nhóm.
  - **Giới hạn tốc độ dịch AI (`ai_rate_limit`):** Giới hạn số lượt yêu cầu dịch thuật AI trên phút cho mỗi người dùng.
- **Giám sát an ninh:** Toàn bộ thao tác quản trị được lưu vết minh bạch tại bảng nhật ký kiểm toán (`audit_logs`).

---

## 👥 Tài Khoản Mẫu & Phân Quyền (RBAC)

Dự án đã chuẩn bị sẵn tài khoản Quản trị viên trong script khởi tạo [`backend/MultilingualWebChat.sql`](file:///d:/MultilingualWebChat/backend/MultilingualWebChat.sql):

- **Tài khoản (Username):** `admin`
- **Mật khẩu (Password):** `Admin@1234`
- **Email:** `admin@example.com`
- **Quyền hạn (Role):** `ADMIN`

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
MultilingualWebChat/
├── README.md                       # Tài liệu tổng quan dự án (File này)
├── .github/workflows/ci.yml        # CI Pipeline (GitHub Actions)
├── docs/                           # Thư mục tài liệu đặc tả toàn cục
│   └── SPEC-labodc.md              # Đặc tả kỹ thuật chính thức (Single Source of Truth)
│
├── frontend/                       # PHÂN HỆ GIAO DIỆN CLIENT (React 19 + Vite 7 + Tailwind CSS v4)
│   ├── docs/                       # Tài liệu dành riêng cho Frontend
│   │   ├── api.md                  # Hướng dẫn tích hợp REST API và WebSocket STOMP
│   │   ├── db_schema.md            # Sơ đồ CSDL MySQL và cấu trúc bảng
│   │   └── flow.md                 # Sơ đồ tuần tự các luồng nghiệp vụ
│   ├── src/
│   │   ├── components/             # Reusable UI Components (Button, Modal, Toast, Input, Avatar)
│   │   ├── config/                 # api.js, constants
│   │   ├── contexts/               # AuthContext, LanguageContext, ToastContext
│   │   ├── core/api/               # axiosClient.js (Interceptors & Refresh Token)
│   │   ├── features/               # Feature-driven Modules:
│   │   │   ├── admin/              # AdminDashboardPage, Quản lý báo cáo & Users
│   │   │   ├── auth/               # AuthPage, ForgotPasswordPage, ResetPasswordPage
│   │   │   ├── chat/               # ChatPage, ChatWindow, MessageList, WebRTC CallModal, Polls
│   │   │   └── settings/           # SettingsPage, Quản lý phiên, Đổi mật khẩu
│   │   ├── services/               # WebSocketService.js (STOMP Client), CloudinaryService.js
│   │   ├── App.jsx                 # Định tuyến SPA và Route Guards
│   │   └── index.css               # Tailwind CSS directives
│   ├── package.json
│   └── vite.config.js
│
└── backend/                        # HỆ THỐNG MÁY CHỦ MICROSERVICES (Java 21 / Spring Boot 3.4)
    ├── docs/                       # Tài liệu kỹ thuật chi tiết của Backend
    │   ├── 01-project-foundation.md # Nền tảng kỹ thuật và kiến trúc microservices
    │   ├── 02-auth-security-flow.md # Bảo mật, JWT, OAuth2, Rate Limiting và Sessions
    │   ├── 03-layout-ui-dashboard.md # Hợp đồng dữ liệu View Models & Admin Dashboard
    │   ├── 04-state-api-patterns.md # ApiResponse, ErrorCode, Kafka EDA và WebRTC
    │   ├── 05-feature-modules.md   # Phân tích 7 module tính năng của Backend
    │   └── 06-backend-api-contract.md # Đặc tả hợp đồng API và toàn bộ endpoints
    ├── api-gateway/                # Spring Cloud Gateway (Port 8000)
    ├── identity-service/           # Identity & User Management Service (Port 8080)
    ├── chat-service/               # Realtime Chat & WebRTC Service (Port 8081)
    ├── docker-compose.yml          # Điều phối hạ tầng (Redis 7, Kafka 3.8)
    ├── k8s-manifests.yaml          # Triển khai Kubernetes
    └── MultilingualWebChat.sql     # Script CSDL MySQL (identify_db, chat_db)
```

---

## 💻 Yêu Cầu Tiên Quyết (Prerequisites)

- **Java Development Kit**: OpenJDK 21 trở lên (khuyên dùng Eclipse Temurin hoặc Amazon Corretto 21).
- **Node.js**: Phiên bản LTS 20.x hoặc 22.x (đi kèm npm).
- **Docker & Docker Compose**: Để khởi chạy Redis 7 và Apache Kafka 3.8.
- **MySQL Database Server**: Phiên bản 8.0 trở lên.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Từng Bước

### Bước 1: Thiết Lập Cơ Sở Dữ Liệu MySQL
Mở MySQL Client hoặc chạy lệnh bash để tạo 2 CSDL `identify_db`, `chat_db` và tài khoản Admin:
```bash
mysql -u root -p < backend/MultilingualWebChat.sql
```

### Bước 2: Khởi Chạy Hạ Tầng Docker (Redis & Kafka)
Di chuyển vào thư mục backend và khởi chạy các dịch vụ hỗ trợ qua Docker Compose:
```bash
cd backend
docker compose up -d redis kafka
```
*(Kiểm tra trạng thái container bằng lệnh `docker compose ps` để đảm bảo Redis và Kafka đã sẵn sàng).*

### Bước 3: Khởi Chạy 3 Microservices Backend
Mở 3 cửa sổ dòng lệnh (Terminal) riêng biệt:

1. **Terminal 1 — Identity Service (Port 8080):**
   ```bash
   cd backend/identity-service
   ./mvnw spring-boot:run
   ```
2. **Terminal 2 — Chat Service (Port 8081):**
   ```bash
   cd backend/chat-service
   ./mvnw spring-boot:run
   ```
3. **Terminal 3 — API Gateway (Port 8000):**
   ```bash
   cd backend/api-gateway
   ./mvnw spring-boot:run
   ```

### Bước 4: Khởi Chạy Giao Diện Frontend Client
Mở cửa sổ dòng lệnh thứ 4:
```bash
cd frontend
npm install
npm run dev
```

Truy cập ứng dụng ngay tại: **`http://localhost:5173`**  
*(Đăng nhập tài khoản quản trị: `admin` / `Admin@1234`)*

---

## ⚙️ Cấu Hình Biến Môi Trường & Cổng Mạng

### Bảng Phân Bổ Cổng Dịch Vụ (Port Mappings)
| Dịch Vụ / Container | Port Host | Port Container | Giao Thức / Mục Đích Sử Dụng |
| :--- | :--- | :--- | :--- |
| **Frontend Web Client** | `5173` | `5173` | Giao diện người dùng Single Page Application (Vite Dev Server) |
| **API Gateway** | `8000` | `8000` | Cổng vào duy nhất tiếp nhận REST API & WebSocket STOMP (`/api/v1`) |
| **Identity Service** | `8080` | `8080` | Dịch vụ xác thực JWT, quản lý người dùng, Google OAuth2, phiên |
| **Chat Service** | `8081` | `8081` | Dịch vụ nhắn tin STOMP, quản lý nhóm, kênh, AI translation, WebRTC |
| **Redis Server** | `6379` | `6379` | In-memory Cache, Token Blacklist và Bộ đếm Rate Limiter |
| **Apache Kafka Broker** | `9092` / `9094` | `9092` | Hàng đợi sự kiện xử lý dịch thuật AI bất đồng bộ |
| **MySQL Server** | `3306` | `3306` | CSDL quan hệ lưu trữ dữ liệu chính (`identify_db`, `chat_db`) |

### Biến Môi Trường Trọng Yếu
- **Backend (`backend/.env.example`):**
  - `URL_DB`: Chuỗi kết nối JDBC tới MySQL (`jdbc:mysql://localhost:3306/...`).
  - `SIGNER_KEY`: Khóa ký HMAC-SHA512 tối thiểu 64 ký tự (đồng bộ giữa Gateway, Identity và Chat service).
  - `REDIS_PASSWORD`: Mật khẩu bảo vệ máy chủ Redis.
  - `BREVO_API_KEY`: API Key gửi email kích hoạt tài khoản.
  - `CLIENT_ID` & `CLIENT_SECRET`: Khóa xác thực Google OAuth2.
  - `GEMINI_API_KEY`: Khóa API Google Gemini để dịch thuật thông minh.
- **Frontend (`frontend/.env.example`):**
  - `VITE_API_BASE_URL`: `http://localhost:8000/api/v1`
  - `VITE_WEBSOCKET_URL`: `http://localhost:8000/api/v1/chat/ws`
  - `VITE_CLOUDINARY_CLOUD_NAME`: Tên cloud lưu trữ media.
  - `VITE_CLOUDINARY_UPLOAD_PRESET`: Preset tải file trực tiếp.

---

## 📡 Bảng Tra Cứu API & Giao Thức WebSocket

### RESTful API Endpoints
- **Xác thực (`/api/v1/identify/auth`):** Đăng nhập (`POST /`), Refresh Token (`POST /refresh`), Đăng xuất (`POST /logout`), Kích hoạt tài khoản (`GET /active`), Quên mật khẩu (`POST /forgot-password`), Quản lý phiên (`GET /sessions`).
- **Người dùng (`/api/v1/identify/users`):** Đăng ký (`POST /`), Thông tin cá nhân (`GET /`), Cập nhật hồ sơ (`PUT /`), Đổi avatar/cover (`PUT /avatar`, `PUT /cover`), Tra cứu theo lô (`POST /batch`).
- **Hội thoại & Nhóm (`/api/v1/chat`):** Tạo chat 1-1 (`POST /conversation`), Tạo nhóm chat (`POST /conversation/group`), Đổi ngôn ngữ đích (`PUT /{id}/locale`), Ghim/Lưu trữ/Tắt tiếng (`PUT /{id}/pin`, `archive`, `mute`), Điều phối thành viên (`POST /{id}/member/{mid}/role`, `kick`, `mute`, `ban`), Bật chế độ chậm (`PUT /{id}/slow-mode`), Kênh (`POST /channel`).
- **Lịch sử tin nhắn (`/api/v1/chat/message`):** Lịch sử phân trang (`GET /{conversationId}?page=0&size=50`), Tìm kiếm tin nhắn (`GET /{conversationId}/search`), Thu hồi/Xóa tin (`DELETE /{messageId}` — giới hạn tối đa 24 giờ kể từ lúc gửi).
- **Quản trị Admin (`/api/v1/identify/admin`):** Khóa/Mở tài khoản (`PUT /users/{id}/toggle-ban`), Đổi vai trò người dùng (`PUT /users/{id}/role`), Danh sách người dùng (`GET /users`), Tiếp nhận/Xử lý báo cáo vi phạm (`POST/GET /reports`, `PUT /reports/{id}/resolve`), Nhật ký kiểm toán an ninh (`GET /audit-logs`), Cấu hình tham số hệ thống (`GET/PUT /system-configs`).

### WebSocket STOMP Destinations
- **Endpoint Kết Nối:** `ws://localhost:8000/api/v1/chat/ws`
- **Client Gửi Lên Server:** `/app/chat` (Payload `MessageRequest` kèm action `SEND`, `EDIT`, `DELETE`, `PIN`, `REACT`, `SEEN`, `FORWARD`, `CALL_SIGNAL`).
- **Lắng Nghe Tin Nhắn Phòng:** `/topic/{conversationId}` (Nhận bản tin gốc và bản tin dịch thuật).
- **Lắng Nghe Tín Hiệu Cá Nhân & WebRTC:** `/user/queue/messages` (Nhận thông báo lỗi vi phạm và gói tin đàm phán cuộc gọi P2P).

---

## 📚 Hệ Thống Tài Liệu Đặc Tả Chi Tiết

Toàn bộ hệ thống tài liệu kiến trúc, luồng nghiệp vụ và thiết kế cơ sở dữ liệu đã được hoàn thiện đầy đủ tại các liên kết sau:

- **Tài Liệu Đặc Tả Kỹ Thuật Toàn Cục:** [`docs/SPEC-labodc.md`](file:///d:/MultilingualWebChat/docs/SPEC-labodc.md)
- **Tài Liệu Backend Microservices:**
  - [`backend/docs/01-project-foundation.md`](file:///d:/MultilingualWebChat/backend/docs/01-project-foundation.md): Nền tảng kỹ thuật và cấu trúc microservices.
  - [`backend/docs/02-auth-security-flow.md`](file:///d:/MultilingualWebChat/backend/docs/02-auth-security-flow.md): Luồng bảo mật, xác thực JWT, OAuth2, Rate Limiting và Sessions.
  - [`backend/docs/03-layout-ui-dashboard.md`](file:///d:/MultilingualWebChat/backend/docs/03-layout-ui-dashboard.md): Hợp đồng dữ liệu View Models và Admin Dashboard.
  - [`backend/docs/04-state-api-patterns.md`](file:///d:/MultilingualWebChat/backend/docs/04-state-api-patterns.md): Chuẩn phản hồi ApiResponse, ErrorCode, Kafka EDA và WebRTC signaling.
  - [`backend/docs/05-feature-modules.md`](file:///d:/MultilingualWebChat/backend/docs/05-feature-modules.md): 7 phân hệ tính năng nghiệp vụ của Backend.
  - [`backend/docs/06-backend-api-contract.md`](file:///d:/MultilingualWebChat/backend/docs/06-backend-api-contract.md): Đặc tả hợp đồng API và payload của tất cả endpoint.
- **Tài Liệu Frontend:**
  - [`frontend/docs/api.md`](file:///d:/MultilingualWebChat/frontend/docs/api.md): Hướng dẫn kết nối REST và WebSocket STOMP dành cho Frontend.
  - [`frontend/docs/db_schema.md`](file:///d:/MultilingualWebChat/frontend/docs/db_schema.md): Sơ đồ ERD và chi tiết các bảng MySQL (`identify_db`, `chat_db`).
  - [`frontend/docs/flow.md`](file:///d:/MultilingualWebChat/frontend/docs/flow.md): Sơ đồ luồng Mermaid và tương tác tuần tự của các chức năng.
