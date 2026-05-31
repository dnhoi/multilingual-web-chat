import tokenService from '../core/utils/token';

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',

  ENDPOINTS: {
    // Xác thực người dùng và tài khoản
    AUTH: '/identify/auth',
    USERS: '/identify/users',
    UPDATE_USER: '/identify/users',
    FIND_USER: '/identify/users/find-user',
    UPDATE_PASSWORD: '/identify/users/update-password',
    OAUTH2_GOOGLE: '/identify/oauth2/authorization/google',
    
    // Trò chuyện, hội thoại và tin nhắn
    MESSAGES: '/chat/message',
    MESSAGE_LIST: '/chat/message/list',
    CONVERSATIONS: '/chat/conversation',
    CREATE_GROUP: '/chat/conversation/group',
    UPDATE_CONVERSATION_NAME: '/chat/{conversationId}/name',
    UPDATE_CONVERSATION_AVATAR: '/chat/{conversationId}/avatar',
    UPDATE_CONVERSATION_LOCALE: '/chat/{conversationId}/locale',
    ADD_MEMBER_TO_CONVERSATION: '/chat/{conversationId}/group/member',
    OUT_CONVERSATION: '/chat/conversation/out',
    MUTE_MEMBER: '/chat/{conversationId}/member/{memberId}/mute',
    BAN_MEMBER: '/chat/{conversationId}/member/{memberId}/ban',
    SLOW_MODE: '/chat/{conversationId}/slow-mode',
    
    // Tải lên tệp tin và ảnh đại diện
    UPLOAD: '/upload',
    UPDATE_AVATAR: '/identify/users/avatar',

    // Quản lý các phiên đăng nhập
    SESSIONS: '/identify/auth/sessions',
    REVOKE_SESSION: '/identify/auth/sessions/{sessionId}',

    // Điểm cuối dành cho Quản trị viên (Admin)
    ADMIN_REPORTS: '/identify/admin/reports',
    ADMIN_AUDIT_LOGS: '/identify/admin/audit-logs',
    ADMIN_SYSTEM_CONFIGS: '/identify/admin/system-configs',
    ADMIN_TOGGLE_BAN: '/identify/admin/users/{userId}/toggle-ban',
    
    // Mã liên kết mời tham gia nhóm
    JOIN_BY_INVITE: '/chat/conversation/join',
    GET_INVITE_CODE: '/chat/conversation/{conversationId}/invite-code',
  },
  
  // Cấu hình phân trang dữ liệu
  DEFAULT_PAGE_SIZE: 20,
  MESSAGES_PER_PAGE: 20,
  
  // Cấu hình kết nối WebSocket
  // SockJS yêu cầu một điểm cuối HTTP(S). Định tuyến qua gateway để trình duyệt
  // dùng cùng một host và ranh giới xác thực với các yêu cầu REST.
  // Quá trình bắt tay HTTP SockJS được gửi đến điểm cuối HTTP chat.
  WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:8000/api/v1/chat/ws',
  
  MAX_FILE_SIZE: 10 * 1024 * 1024, // Giới hạn kích thước tệp tối đa: 10MB
  ALLOWED_FILE_TYPES: [
    'image/*', 
    'video/*', 
    'audio/*', 
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ],
  
  // Cấu hình ảnh đại diện mặc định và bộ nhớ đệm (Cache)
  AVATAR: {
    FALLBACK_AVATAR: '/default-avatar.svg',
    FALLBACK_GROUP_AVATAR: '/default-group-avatar.svg',
    GOOGLE_AVATAR_FALLBACK: '/google-avatar-fallback.svg',
    CACHE_DURATION: 24 * 60 * 60 * 1000, // Thời gian lưu cache: 24 giờ
    RETRY_ATTEMPTS: 3
  },
  
  // Cấu hình thời gian chờ yêu cầu mạng (Timeout)
  REQUEST_TIMEOUT: 30000, // 30 giây cho yêu cầu thông thường
  UPLOAD_TIMEOUT: 60000, // 60 giây cho yêu cầu tải lên tệp
};

// Hàm tiện ích xây dựng URL đầy đủ cho API kèm các tham số query
export const buildApiUrl = (endpoint, params = {}) => {
  const url = new URL(`${API_CONFIG.BASE_URL}${endpoint}`);
  
  // Bổ sung các tham số truy vấn (query params)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
};

// Hàm tiện ích lấy header xác thực Authorization chứa JWT Bearer token
export const getAuthHeaders = () => {
  const token = tokenService.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Hàm tiện ích xử lý và chuẩn hóa dữ liệu phản hồi từ API
export const handleApiResponse = (response) => {
  if (response.data.code === 200) {
    return { success: true, data: response.data.result };
  } else {
    throw new Error(response.data.message || 'Yêu cầu API thất bại');
  }
};

// Hàm tiện ích xử lý và phân loại các thông báo lỗi từ API
export const handleApiError = (error) => {
  if (error.response) {
    // Máy chủ phản hồi với mã lỗi HTTP
    throw new Error(error.response.data.message || `Lỗi máy chủ: ${error.response.status}`);
  } else if (error.request) {
    // Yêu cầu đã được gửi nhưng không nhận được phản hồi từ máy chủ
    throw new Error('Không nhận được phản hồi từ máy chủ. Vui lòng kiểm tra lại kết nối.');
  } else {
    // Các lỗi phát sinh ngoài dự kiến khác
    throw new Error(error.message || 'Đã xảy ra lỗi không mong muốn');
  }
};

// Các hàm tiện ích xử lý URL ảnh đại diện kèm bộ nhớ cache để giảm tần suất tải
export const getAvatarUrl = (avatarUrl, fallbackType = 'user') => {
  if (!avatarUrl) {
    return fallbackType === 'group' 
      ? API_CONFIG.AVATAR.FALLBACK_GROUP_AVATAR 
      : API_CONFIG.AVATAR.FALLBACK_AVATAR;
  }

  // Kiểm tra ảnh đại diện có nguồn từ Google
  if (avatarUrl.includes('googleusercontent.com')) {
    // Ưu tiên đọc từ bộ nhớ đệm (LocalStorage)
    const cached = localStorage.getItem(`avatar_${avatarUrl}`);
    if (cached) {
      try {
        const { url, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < API_CONFIG.AVATAR.CACHE_DURATION) {
          return url;
        }
      } catch (e) {
        // Bộ nhớ đệm không hợp lệ, xóa mục lỗi
        localStorage.removeItem(`avatar_${avatarUrl}`);
      }
    }
    
    // Trả về ảnh Google cùng cơ chế dự phòng
    return avatarUrl;
  }

  return avatarUrl;
};

export const setAvatarFallback = (avatarUrl, fallbackUrl) => {
  if (avatarUrl && avatarUrl.includes('googleusercontent.com')) {
    localStorage.setItem(`avatar_${avatarUrl}`, JSON.stringify({
      url: fallbackUrl,
      timestamp: Date.now()
    }));
  }
};

export const clearAvatarCache = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('avatar_')) {
      localStorage.removeItem(key);
    }
  });
};
