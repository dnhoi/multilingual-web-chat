# 📡 Multilingual Web Chat REST & WebSocket API Specification

> Tài liệu giao thức kết nối API chuẩn giữa **Frontend (React 19 / Vite 7 SPA)** và **Backend Microservices (Spring Cloud Gateway Port 8000)** của nền tảng **Multilingual Web Chat**.

---

## 📑 MỤC LỤC
1. [Cấu Hình Cơ Sở & Cấu Trúc Phản Hồi (Base Config)](#1-cấu-hình-cơ-sở--cấu-trúc-phản-hồi-base-config)
2. [Cơ Chế Quản Lý Token & Axios Interceptor](#2-cơ-chế-quản-lý-token--axios-interceptor)
3. [Tích Hợp Tải Lên Đa Phương Tiện (Cloudinary CDN)](#3-tích-hợp-tải-lên-đa-phương-tiện-cloudinary-cdn)
4. [Danh Mục RESTful API Dành Cho Frontend](#4-danh-mục-restful-api-dành-cho-frontend)
5. [Giao Thức Thời Gian Thực WebSocket STOMP](#5-giao-thức-thời-gian-thực-websocket-stomp)
6. [Giao Thức Báo Hiệu WebRTC (Call Signaling)](#6-giao-thức-báo-hiệu-webrtc-call-signaling)

---

## 1. Cấu Hình Cơ Sở & Cấu Trúc Phản Hồi (Base Config)

### 1.1 Biến Môi Trường Frontend (`.env`)
```env
# URL API Gateway Backend
VITE_API_BASE_URL=http://localhost:8000/api/v1

# URL WebSocket STOMP Endpoint
VITE_WEBSOCKET_URL=http://localhost:8000/api/v1/chat/ws

# Cấu hình CDN Cloudinary tải ảnh / media
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=chat_app_preset
```

### 1.2 Cấu Trúc Đối Tượng Phản Hồi (`ApiResponse<T>`)
Tất cả các endpoint trả về định dạng chuẩn:
```json
// Thành công
{
  "code": 200,
  "message": "Thành công",
  "result": { ... }
}

// Lỗi nghiệp vụ
{
  "code": 1001,
  "message": "User not found"
}
```

---

## 2. Cơ Chế Quản Lý Token & Axios Interceptor

Frontend triển khai `axiosClient.js` tại `src/core/api/axiosClient.js`:

1. **Request Interceptor:**
   - Đọc Access Token từ `localStorage.getItem('token')`.
   - Nếu tồn tại, tự động đính kèm vào Header:
     `Authorization: Bearer <token>`.
2. **Response Interceptor & Tự Động Refresh:**
   - Khi Backend trả về mã lỗi HTTP `401 Unauthorized`:
   - `axiosClient` kiểm tra nếu có Refresh Token, tự động gọi `POST /api/v1/identify/auth/refresh`.
   - Nếu làm mới thành công: Cập nhật token mới vào `localStorage` và phát lại request ban đầu.
   - Nếu thất bại: Xóa session và chuyển hướng người dùng về trang đăng nhập `/`.

---

## 3. Tích Hợp Tải Lên Đa Phương Tiện (Cloudinary CDN)

Để tối ưu hóa băng thông Backend và lưu trữ đám mây tốc độ cao, ảnh đại diện, ảnh bìa, tệp đính kèm và file ghi âm giọng nói được tải trực tiếp từ Client lên Cloudinary qua REST API:

- **Endpoint:** `https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload`
- **Method:** `POST` (Multipart / Form-Data)
- **Parameters:**
  - `file`: File Object (ảnh, video, âm thanh, tài liệu).
  - `upload_preset`: Giá trị cấu hình `VITE_CLOUDINARY_UPLOAD_PRESET`.
- **Kết quả:** Nhận về `secure_url` trên CDN để gửi qua tin nhắn chat hoặc lưu vào hồ sơ cá nhân.

---

## 4. Danh Mục RESTful API Dành Cho Frontend

Mọi request được gửi qua Gateway với tiền tố `/api/v1`:

### 4.1 Module Xác Thực (`/identify/auth`)
| Method | Endpoint | Mô Tả |
| :--- | :--- | :--- |
| `POST` | `/identify/auth` | Đăng nhập bằng tài khoản/mật khẩu |
| `POST` | `/identify/auth/refresh` | Làm mới Access Token |
| `POST` | `/identify/auth/logout` | Đăng xuất và vô hiệu hóa Token |
| `POST` | `/identify/auth/forgot-password` | Gửi email liên kết đặt lại mật khẩu |
| `POST` | `/identify/auth/reset-password` | Đặt mật khẩu mới bằng reset token |
| `GET` | `/identify/auth/sessions` | Lấy danh sách các phiên thiết bị đăng nhập |
| `DELETE`| `/identify/auth/sessions/{id}` | Thu hồi từ xa một phiên đăng nhập |

### 4.2 Module Người Dùng (`/identify/users`)
| Method | Endpoint | Mô Tả |
| :--- | :--- | :--- |
| `POST` | `/identify/users` | Đăng ký tài khoản người dùng mới |
| `GET` | `/identify/users` | Lấy thông tin hồ sơ của chính mình (My Profile) |
| `GET` | `/identify/users/{userId}` | Xem hồ sơ người dùng theo User ID |
| `PUT` | `/identify/users` | Cập nhật họ tên, bio, ngày sinh, giới tính |
| `PUT` | `/identify/users/avatar` | Cập nhật URL ảnh đại diện |
| `PUT` | `/identify/users/cover` | Cập nhật URL ảnh bìa trang cá nhân |
| `POST` | `/identify/users/batch` | Tra cứu danh sách hồ sơ người dùng theo mảng IDs |
| `POST` | `/identify/users/find-user?request=...` | Tìm kiếm người dùng theo từ khóa |

### 4.3 Module Hội Thoại & Nhóm (`/chat`)
| Method | Endpoint | Mô Tả |
| :--- | :--- | :--- |
| `POST` | `/chat/conversation` | Bắt đầu trò chuyện 1-1 với người dùng khác |
| `POST` | `/chat/conversation/group` | Tạo nhóm chat mới (tối thiểu 3 thành viên) |
| `POST` | `/chat/{conversationId}/out` | Rời khỏi cuộc hội thoại nhóm |
| `POST` | `/chat/{conversationId}/group/member` | Thêm thành viên vào nhóm |
| `PUT` | `/chat/{conversationId}/locale` | Đổi ngôn ngữ đích mặc định của phòng cho AI dịch |
| `PUT` | `/chat/{conversationId}/pin` | Ghim / Bỏ ghim cuộc hội thoại |
| `PUT` | `/chat/{conversationId}/archive` | Lưu trữ cuộc hội thoại |
| `PUT` | `/chat/{conversationId}/mute` | Tắt / Bật thông báo cuộc hội thoại |
| `DELETE`| `/chat/{conversationId}` | Xóa vĩnh viễn cuộc trò chuyện (Owner) |
| `POST` | `/chat/{conversationId}/member/{id}/kick` | Đuổi thành viên khỏi nhóm |
| `POST` | `/chat/{conversationId}/member/{id}/mute` | Tắt tiếng thành viên |
| `POST` | `/chat/{conversationId}/member/{id}/ban` | Cấm thành viên tham gia nhóm |
| `PUT` | `/chat/{conversationId}/slow-mode` | Bật chế độ chậm (Số giây giãn cách) |
| `GET` | `/chat/{conversationId}/invite-code` | Lấy mã mời tham gia nhóm |
| `POST` | `/chat/conversation/join/{inviteCode}` | Tham gia nhóm chat qua mã mời |

### 4.4 Module Tin Nhắn (`/chat/message`)
| Method | Endpoint | Mô Tả |
| :--- | :--- | :--- |
| `GET` | `/chat/message/{conversationId}?page=0&size=50` | Lấy lịch sử tin nhắn phòng chat phân trang |
| `GET` | `/chat/message/{conversationId}/search?keyword=...` | Tìm kiếm tin nhắn theo từ khóa |
| `DELETE`| `/chat/message/{messageId}` | Thu hồi / Xóa tin nhắn (Người gửi hoặc Admin nhóm; **Chặn nếu gửi quá 24h**) |

### 4.5 Module Quản Trị Hệ Thống (`/identify/admin`)
| Method | Endpoint | Quyền | Mô Tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/identify/admin/users` | Admin | Lấy danh sách toàn bộ người dùng |
| `PUT` | `/identify/admin/users/{userId}/toggle-ban` | Admin | Khóa hoặc mở khóa tài khoản |
| `PUT` | `/identify/admin/users/{userId}/role` | Admin | Đổi vai trò tài khoản (`ROLE_ADMIN` / `ROLE_USER`) |
| `GET` | `/identify/admin/reports` | Admin | Lấy danh sách các báo cáo vi phạm |
| `POST` | `/identify/admin/reports` | Auth | Gửi báo cáo tin nhắn/người dùng vi phạm |
| `PUT` | `/identify/admin/reports/{id}/resolve` | Admin | Đánh dấu báo cáo đã xử lý |
| `GET` | `/identify/admin/audit-logs` | Admin | Xem nhật ký kiểm vết hệ thống |
| `GET` | `/identify/admin/system-configs` | Admin | Lấy danh sách tham số cấu hình hệ thống |
| `PUT` | `/identify/admin/system-configs` | Admin | Cập nhật tham số cấu hình hệ thống (`banned_keywords`, `maintenance_mode`, v.v.) |

---

## 5. Giao Thức Thời Gian Thực WebSocket STOMP

Frontend sử dụng thư viện `@stomp/stompjs` kết hợp `sockjs-client`:

### 5.1 Khởi Tạo Kết Nối (Connection)
```javascript
const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8000/api/v1/chat/ws'),
  connectHeaders: {
    Authorization: `Bearer ${token}`
  },
  reconnectDelay: 5000,
  debug: (str) => console.log(str)
});
client.activate();
```

### 5.2 Đăng Ký Lắng Nghe Tin Nhắn (Subscriptions)
- **Lắng nghe tin nhắn phòng:**
  ```javascript
  client.subscribe(`/topic/${conversationId}`, (message) => {
    const data = JSON.parse(message.body);
    // data.action: 'SEND', 'EDIT', 'DELETE', 'PIN', 'UNPIN', 'REACT', 'SEEN', 'FORWARD'
    handleIncomingMessage(data);
  });
  ```
- **Lắng nghe tín hiệu cá nhân & cuộc gọi:**
  ```javascript
  client.subscribe('/user/queue/messages', (message) => {
    const signal = JSON.parse(message.body);
    // Nhận tín hiệu WebRTC Calling hoặc thông báo vi phạm moderation
    handlePersonalSignal(signal);
  });
  ```

### 5.3 Gửi Tin Nhắn Lên Server (Publishing)
Gửi tới destination `/app/chat`:
```javascript
client.publish({
  destination: '/app/chat',
  body: JSON.stringify({
    conversationId: activeConversationId,
    type: 'TEXT', // TEXT, IMAGE, VIDEO, AUDIO, FILE, POLL, CALL_SIGNAL
    action: 'SEND',
    messageText: 'Xin chào!',
    replyToMessageId: null,
    pollData: null
  })
});
```

> ⚠️ **Chính sách 24 Giờ:** Đối với các hành động `EDIT` (chỉnh sửa) và `DELETE` (thu hồi/xóa tin), tin nhắn chỉ được phép chỉnh sửa hoặc xóa trong vòng 24 giờ kể từ thời điểm gửi (`sentDatetime`). Nếu vượt quá 24 giờ, hệ thống sẽ từ chối xử lý và hiển thị thông báo lỗi.

---

## 6. Giao Thức Báo Hiệu WebRTC (Call Signaling)

Cuộc gọi P2P trao đổi tín hiệu qua STOMP với `type = 'CALL_SIGNAL'`:
1. **Bắt đầu gọi:** Gửi `messageText = 'CALL_OFFER:' + JSON.stringify(localDescription)`
2. **Đối phương nghe máy:** Phản hồi `messageText = 'CALL_ANSWER:' + JSON.stringify(remoteDescription)`
3. **Trao đổi ICE Candidate:** Gửi `messageText = 'ICE_CANDIDATE:' + JSON.stringify(candidate)`
4. **Từ chối / Kết thúc cuộc gọi:** Gửi `CALL_DECLINE`, `CALL_END`, hoặc `CALL_CANCEL`.
