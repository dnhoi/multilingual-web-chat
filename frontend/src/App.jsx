import React, { useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';

const AuthPage = lazy(() => import('./features/auth/pages/AuthPage.jsx'));
const ChatPage = lazy(() => import('./features/chat/pages/ChatPage.jsx'));
const SettingsPage = lazy(() => import('./features/settings/pages/SettingsPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./features/auth/pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./features/auth/pages/ResetPasswordPage.jsx'));
const AdminDashboardPage = lazy(() => import('./features/admin/pages/AdminDashboardPage.jsx'));

const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
  </div>
);

// Auth Initializer Component
const AuthInitializer = ({ children }) => {
  const { checkAuthStatus } = useAuth();
  
  const initializeAuth = useCallback(async () => {
    await checkAuthStatus();
  }, [checkAuthStatus]);
  
  useEffect(() => {
    // Only run once when component mounts
    initializeAuth();
  }, []); // Empty dependency array to run only once
  
  return children;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAuthChecked } = useAuth();
  
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Public Route Component (redirects to chat if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAuthChecked } = useAuth();

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/chat" replace />;
};

// Admin Route Component (requires authentication AND ADMIN role)
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAuthChecked, currentUser } = useAuth();
  
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const userRole = (currentUser?.role || '').toUpperCase();
  const isAdmin = userRole === 'ADMIN' || userRole === 'SYSTEM_ADMIN' || userRole === 'ROLE_ADMIN';

  if (!isAdmin) {
    return <Navigate to="/chat" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <AuthInitializer>
              <div className="App">
                <Suspense fallback={<PageLoading />}>
                  <Routes>
                    <Route path="/" element={<PublicRoute><AuthPage /></PublicRoute>} />
                    <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
                    <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

                    <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
                  </Routes>
                </Suspense>
              </div>
            </AuthInitializer>
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App; 