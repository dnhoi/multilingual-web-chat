import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Check, X, MessageSquare, Globe, Zap, Shield } from 'lucide-react';
import { useAuthForm } from './useAuthForm';

const LanguageSelector = lazy(() => import('../../../components/common/LanguageSelector'));

/* ─── Feature bullet for left panel ─── */
function FeatureBullet({ icon: Icon, text }) {
  return (
    <li className="flex items-center gap-3 text-sm text-blue-100/80">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
        <Icon className="w-3 h-3 text-blue-200" />
      </span>
      {text}
    </li>
  );
}

/* ─── Password strength row ─── */
function PasswordCheck({ passed, label }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      {passed ? (
        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      ) : (
        <X className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600 shrink-0" />
      )}
      <span className={passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}>
        {label}
      </span>
    </li>
  );
}

/* ─── Decorative SVG curve overlay ─── */
function DecorativeCurve() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
      viewBox="0 0 520 640"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="80" cy="160" r="260" stroke="white" strokeWidth="0.8" />
      <circle cx="400" cy="480" r="300" stroke="white" strokeWidth="0.6" />
      <circle cx="260" cy="320" r="180" stroke="white" strokeWidth="0.5" />
    </svg>
  );
}

const AuthPage = () => {
  const {
    isLogin,
    setIsLogin,
    showPassword,
    setShowPassword,
    formData,
    isLoading,
    showActivationMessage,
    setShowActivationMessage,
    passwordStrength,
    handleGoogleLogin,
    handleSubmit,
    handleInputChange,
    toggleMode,
    t
  } = useAuthForm();

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-white dark:bg-zinc-950">

      {/* ─── LEFT PANEL — brand & feature strip ─── */}
      <div className="relative hidden lg:flex lg:w-[46%] xl:w-[48%] flex-col justify-between overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1d4ed8 75%, #3b82f6 100%)'
        }}
      >
        <DecorativeCurve />

        {/* Logo + brand */}
        <div className="relative z-10 p-10 pt-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-base tracking-tight">MultilingualChat</span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 px-10 pb-4 flex-1 flex flex-col justify-center">
          <h2
            className="text-4xl xl:text-5xl font-bold text-white leading-[1.12] tracking-tight mb-5"
            style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}
          >
            Nền tảng Chat 
            <span className="text-blue-200"> Đa ngôn ngữ</span><br />
            thời gian thực
          </h2>
          <p className="text-blue-100/100 text-sm leading-relaxed max-w-[500px] mb-8">
            Kết nối với mọi người trên thế giới. Dịch thuật tức thì, bảo mật đầu cuối, hỗ trợ đa nền tảng.
          </p>

          <ul className="space-y-3">
            <FeatureBullet icon={Globe} text="Dịch thuật tức thì trên 50+ ngôn ngữ" />
            <FeatureBullet icon={Zap} text="Kết nối WebSocket thời gian thực" />
            <FeatureBullet icon={Shield} text="Mã hoá đầu cuối bảo mật tuyệt đối" />
          </ul>
        </div>

        {/* Footer credit */}
        <div className="relative z-10 px-10 pb-8">
          <p className="text-blue-200/40 text-xs">© 2026 MultilingualWebChat. All rights reserved.</p>
        </div>
      </div>

      {/* ─── RIGHT PANEL — auth form ─── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-12 xl:px-16 bg-white dark:bg-zinc-950">

        {/* Top bar: language + mobile logo */}
        <div className="w-full max-w-sm mb-8 flex items-center justify-between">
          {/* Mobile-only logo */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-white font-semibold text-sm">MultiChat</span>
          </div>
          <div className="ml-auto">
            <Suspense fallback={<div className="w-24 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />}>
              <LanguageSelector />
            </Suspense>
          </div>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-1.5">
              {isLogin
                ? (t('loginSystem') || 'Đăng nhập hệ thống')
                : (t('createAccount') || 'Tạo tài khoản mới')}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {isLogin
                ? (t('welcomeBack') || 'Vui lòng điền thông tin đăng nhập để tiếp tục.')
                : (t('createAccountDesc') || 'Tạo tài khoản để bắt đầu trải nghiệm.')}
            </p>
          </div>

          {/* Activation success banner */}
          {showActivationMessage && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-1">
                {t('registrationSuccessful') || 'Đăng ký thành công!'}
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                {t('checkEmailActivation') || 'Vui lòng kiểm tra email để kích hoạt tài khoản.'}
              </p>
              <button
                onClick={() => { setIsLogin(true); setShowActivationMessage(false); }}
                className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:underline transition-colors"
              >
                {t('goToLogin') || 'Đến trang đăng nhập'}
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {isLogin ? (t('usernameOrEmail') || '* Địa chỉ Email') : (t('username') || '* Tên đăng nhập')}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 w-4 h-4 pointer-events-none" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400"
                  placeholder={isLogin ? (t('enterUsernameOrEmail') || 'admin') : (t('enterUsername') || 'Nhập tên đăng nhập')}
                />
              </div>
            </div>

            {/* Email (register only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('email') || '* Email'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 w-4 h-4 pointer-events-none" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required={!isLogin}
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400"
                    placeholder={t('enterEmail') || 'Nhập địa chỉ email'}
                  />
                </div>
              </div>
            )}

            {/* Full Name (register only) */}
            {!isLogin && (
              <div className="space-y-1.5">
                <label htmlFor="fullName" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('fullName') || '* Họ và tên'}
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 w-4 h-4 pointer-events-none" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required={!isLogin}
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400"
                    placeholder={t('enterFullName') || 'Nhập họ và tên'}
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('password') || '* Mật khẩu'}
                </label>
                {isLogin && (
                  <Link
                    to="/forgot-password"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    {t('forgotPassword') || 'Quên mật khẩu?'}
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 w-4 h-4 pointer-events-none" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength="8"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg placeholder-zinc-400 dark:placeholder-zinc-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-400"
                  placeholder={t('enterPassword') || '••••••••'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength (register only) */}
              {!isLogin && formData.password && (
                <ul className="mt-2.5 space-y-1.5">
                  <PasswordCheck passed={passwordStrength.hasLength} label={t('atLeast8Characters') || 'Ít nhất 8 ký tự'} />
                  <PasswordCheck passed={passwordStrength.hasLetter} label={t('containsLetters') || 'Chứa chữ cái'} />
                  <PasswordCheck passed={passwordStrength.hasNumber} label={t('containsNumbers') || 'Chứa chữ số'} />
                </ul>
              )}
            </div>

            {/* Remember me (login only) */}
            {isLogin && (
              <div className="flex items-center gap-2">
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="w-4 h-4 accent-blue-600 rounded border-zinc-300 dark:border-zinc-600"
                />
                <label htmlFor="rememberMe" className="text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                  {t('RememberMe') || 'Ghi nhớ phiên đăng nhập'}
                </label>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white rounded-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
              style={{ background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)' }}
            >
              {isLoading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isLogin ? (t('loggingIn') || 'Đang đăng nhập...') : (t('registering') || 'Đang đăng ký...')}</span>
                </>
              ) : (
                isLogin ? (t('login') || 'Đăng nhập') : (t('register') || 'Đăng ký ngay')
              )}
            </button>

            {/* Divider */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white dark:bg-zinc-950 text-zinc-400 dark:text-zinc-500">
                  {t('or') || 'Hoặc đăng nhập bằng'}
                </span>
              </div>
            </div>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>{isLoading ? (t('redirecting') || 'Đang chuyển hướng...') : (t('loginWithGoogle') || 'Google')}</span>
            </button>
          </form>

          {/* Mode toggle */}
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
            {isLogin ? (t('dontHaveAccount') || 'Chưa có tài khoản?') : (t('alreadyHaveAccount') || 'Đã có tài khoản?')}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
            >
              {isLogin ? (t('register') || 'Đăng ký ngay') : (t('login') || 'Đăng nhập')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
