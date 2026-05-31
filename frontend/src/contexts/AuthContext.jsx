import { createContext, useContext, useState } from 'react';
import webSocketService from '../services/WebSocketService';
import * as authApi from '../features/auth/api/auth.api';
import { API_CONFIG } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const result = await authApi.login(username, password);
      
      try {
        const userResult = await authApi.getCurrentUser();
        
        const userData = userResult?.result || userResult?.data;
        if (userData) {
          const user = {
            id: userData.userId || userData.username,
            userId: userData.userId || userData.username,
            username: userData.username,
            email: userData.email,
            fullName: userData.fullName,
            locale: userData.locale,
            avatarUrl: userData.avatarUrl,
            role: userData.role,
            bio: userData.bio || '',
            website: userData.website || '',
            gender: userData.gender || '',
            birthday: userData.birthday || '',
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
            googleId: userData.googleId
          };
          
          setCurrentUser(user);
          setIsAuthenticated(true);
          
          // Tự động kết nối WebSocket sau khi đăng nhập thành công
          try {
            const token = result?.result?.token || result?.data?.token;
            webSocketService.connect(token, 
              () => {},
              (error) => {}
            );
          } catch (wsError) {
            
          }
          
          return { success: true, user };
        } else {
          const user = {
            id: username,
            username: username,
            email: '',
            fullName: username
          };
          setCurrentUser(user);
          setIsAuthenticated(true);
          return { success: true, user };
        }
      } catch (userError) {
        const user = {
          id: username,
          username: username,
          email: '',
          fullName: username
        };
        setCurrentUser(user);
        setIsAuthenticated(true);
        return { success: true, user };
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username, email, password, fullName) => {
    setIsLoading(true);
    try {
      const result = await authApi.register(username, email, password, fullName);
      
      // Không tự động xác thực sau khi đăng ký
      // Người dùng cần xác nhận qua email kích hoạt tài khoản trước
      return { success: true, message: 'Đăng ký thành công. Vui lòng kiểm tra hộp thư email để kích hoạt tài khoản của bạn.' };
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Ngắt kết nối WebSocket khi đăng xuất
    try {
      webSocketService.disconnect();
    } catch (wsError) {
      
    }
    
    setCurrentUser(null);
    setIsAuthenticated(false);
    authApi.logout();
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      // Chuyển hướng người dùng đến URL xác thực Google OAuth2 của máy chủ
      window.location.href = `${API_CONFIG.BASE_URL}/identify/oauth2/authorization/google`;
      
      // Quá trình xác thực sẽ hoàn tất sau khi Google điều hướng trở lại kèm token
    } catch (error) {
      setIsLoading(false);
      throw new Error('Đăng nhập với Google thất bại');
    }
  };

  const handleOAuth2Success = async (token) => {
    if (token) {
        // Lưu trữ JWT token vào authApi
        authApi.setAuthToken(token);
        
        try {
          const userResult = await authApi.getCurrentUser();
          const userData = userResult?.result || userResult?.data;
      
          if (userData) {
            const user = {
              id: userData.userId || userData.username,
              username: userData.username,
              email: userData.email,
              fullName: userData.fullName,
              locale: userData.locale,
              avatarUrl: userData.avatarUrl,
              role: userData.role,
              bio: userData.bio || '',
              website: userData.website || '',
              gender: userData.gender || '',
              birthday: userData.birthday || '',
              createdAt: userData.createdAt,
              updatedAt: userData.updatedAt,
              googleId: userData.googleId
            };
            
            setCurrentUser(user);
            setIsAuthenticated(true);
            return { success: true, user };
          } else {
            throw new Error('Failed to get user details after OAuth2');
          }
        } catch (error) {
          throw error;
        }
    }
  };

  // Hàm tiện ích lấy JWT token từ Cookie
  const getTokenFromCookie = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token') {
        return value;
      }
    }
    return null;
  };

  // Hàm tiện ích lấy token từ tham số trên URL (phục vụ OAuth2 redirect)
  const getTokenFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
  };

  // Kiểm tra trạng thái đăng nhập của người dùng khi ứng dụng khởi chạy
  const checkAuthStatus = async () => {
    // Ưu tiên kiểm tra token trong localStorage, sau đó đến cookie
    let token = authApi.getAuthToken();
    
    // Kiểm tra token truyền qua URL (khi chuyển hướng từ OAuth2 Google)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
        token = urlToken;
        // Lưu trữ token qua authApi
        authApi.setAuthToken(token);
        
        // Loại bỏ tham số token trên thanh địa chỉ URL mà không tải lại trang
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (!token) {
      // Nếu chưa có token trong localStorage, kiểm tra trong cookie
      token = getTokenFromCookie();
      if (token) {
        // Lưu token vào authApi
        authApi.setAuthToken(token);
        // Xóa cookie sau khi đã đọc và lưu an toàn
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    }
    
    if (token) {
      try {
        setIsLoading(true);
        const userResult = await authApi.getCurrentUser();
        const userData = userResult?.result || userResult?.data;
        
        if (userData) {
          const user = {
            id: userData.userId || userData.username,
            userId: userData.userId || userData.username,
            username: userData.username,
            email: userData.email, 
            fullName: userData.fullName,
            locale: userData.locale,
            avatarUrl: userData.avatarUrl,
            role: userData.role,
            bio: userData.bio || '',
            website: userData.website || '',
            gender: userData.gender || '',
            birthday: userData.birthday || '',
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
            googleId: userData.googleId
          };
          
          setCurrentUser(user);
          setIsAuthenticated(true);
          
          try {
            webSocketService.connect(token, 
              () => {},
              (error) => {}
            );
          } catch (wsError) {
            
          }
        } else {
          logout();
        }
      } catch (error) {
        logout();
      } finally {
        setIsLoading(false);
      }
    }
    setIsAuthChecked(true);
  };

  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    isAuthChecked,
    setCurrentUser,
    login,
    register,
    logout,
    checkAuthStatus,
    loginWithGoogle,
    handleOAuth2Success
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 