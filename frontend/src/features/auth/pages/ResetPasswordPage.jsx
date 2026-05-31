import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle, Eye, EyeOff, MessageSquare, ShieldCheck } from 'lucide-react';
import * as authApi from '../api/auth.api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [status, setStatus] = useState({ loading: false, success: false, error: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setStatus({ loading: false, success: false, error: 'Mật khẩu xác nhận không khớp.' });
      return;
    }
    if (newPassword.length < 8) {
      setStatus({ loading: false, success: false, error: 'Mật khẩu phải có ít nhất 8 ký tự.' });
      return;
    }
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setStatus({ 
        loading: false, 
        success: false, 
        error: 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt (VD: TestPass123!).' 
      });
      return;
    }
    if (!token) {
      setStatus({ loading: false, success: false, error: 'Token khôi phục không hợp lệ.' });
      return;
    }

    setStatus({ loading: true, success: false, error: '' });
    try {
      await authApi.resetPassword(token, newPassword);
      setStatus({ loading: false, success: true, error: '' });
      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      setStatus({
        loading: false,
        success: false,
        error: err.response?.data?.message || 'Token hết hạn hoặc không hợp lệ.'
      });
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-white dark:bg-zinc-950">

      {/* Left decorative panel */}
      <div
        className="relative hidden lg:flex lg:w-[46%] xl:w-[48%] flex-col justify-between overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1d4ed8 75%, #3b82f6 100%)' }}
      >
        {/* Decorative circles */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 520 640" preserveAspectRatio="xMidYMid slice" fill="none">
          <circle cx="80" cy="160" r="260" stroke="white" strokeWidth="0.8" />
          <circle cx="400" cy="480" r="300" stroke="white" strokeWidth="0.6" />
          <circle cx="260" cy="320" r="180" stroke="white" strokeWidth="0.5" />
        </svg>

        {/* Logo */}
        <div className="relative z-10 p-10 pt-12">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-base tracking-tight">MultilingualChat</span>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 px-10 pb-4 flex-1 flex flex-col justify-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-6">
            <ShieldCheck className="w-7 h-7 text-blue-200" />
          </div>
          <h2
            className="text-3xl xl:text-4xl font-bold text-white leading-[1.15] tracking-tight mb-4"
            style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
          >
            Đặt lại<br />
            <span className="text-blue-200">mật khẩu mới</span>
          </h2>
          <p className="text-blue-100/70 text-sm leading-relaxed max-w-[280px]">
            Tạo mật khẩu mạnh để bảo vệ tài khoản của bạn. Ít nhất 8 ký tự, kết hợp chữ và số.
          </p>
        </div>

        <div className="relative z-10 px-10 pb-8">
          <p className="text-blue-200/40 text-xs">© 2026 MultilingualWebChat. All rights reserved.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-12 xl:px-16 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-1.5">
              Đặt lại mật khẩu
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
            </p>
          </div>

          {/* Success state */}
          {status.success ? (
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                    Đặt lại thành công!
                  </p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    Đang chuyển hướng về trang đăng nhập...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Error banner */}
              {status.error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400">{status.error}</p>
                </div>
              )}

              {/* New password */}
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  * Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 w-4 h-4 pointer-events-none" />
                  <input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    required
                    minLength="8"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  * Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 w-4 h-4 pointer-events-none" />
                  <input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    minLength="8"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900 border rounded-lg placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400 ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-red-400 dark:border-red-600'
                        : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">Mật khẩu xác nhận không khớp.</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={status.loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white rounded-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                style={{ background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)' }}
              >
                {status.loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Lưu mật khẩu mới</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
