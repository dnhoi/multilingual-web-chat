import axios from 'axios';
import { API_CONFIG } from '../../config/api.js';
import tokenService from '../utils/token.js';

// Khởi tạo instance
const axiosClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor cho yêu cầu HTTP: tự động đính kèm JWT Bearer token cho các endpoint cần xác thực
axiosClient.interceptors.request.use(
  (config) => {
    const isPublicEndpoint = config.url?.includes('/auth/forgot-password') ||
                             config.url?.includes('/auth/reset-password') ||
                             config.url?.endsWith('/identify/auth') ||
                             (config.url?.endsWith('/identify/users') && config.method === 'post');
    const token = tokenService.getToken();
    if (token && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho phản hồi HTTP: xử lý cơ chế làm mới phiên (Refresh Token) khi gặp 401 Unauthorized
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosClient(originalRequest);
        }).catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const currentToken = tokenService.getToken();
      if (currentToken) {
        try {
          // Dùng phiên bản axios gốc để tránh lặp vô tận nếu refresh token cũng trả về 401
          const refreshResponse = await axios.post(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH}/refresh`,
            { token: currentToken }
          );
          const newToken = refreshResponse?.data?.result?.token;
          if (newToken) {
            tokenService.setToken(newToken);
            axiosClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            processQueue(null, newToken);
            isRefreshing = false;
            return axiosClient(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
        }
      }
      // Làm mới token thất bại – xóa phiên lưu trữ và đưa về màn hình đăng nhập
      tokenService.removeToken();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
