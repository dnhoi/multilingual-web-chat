import { Suspense, lazy } from 'react';
import { Menu, X, Settings, Shield } from 'lucide-react';
import { getAvatarUrl } from '../../../config/api';

const LanguageSelector = lazy(() => import('../../../components/common/LanguageSelector'));

const ChatHeader = ({
  currentUser,
  t,
  showSidebar,
  toggleSidebar,
  navigate
}) => {
  const userRole = (currentUser?.role || '').toUpperCase();
  const isAdmin = userRole === 'ADMIN' || userRole === 'SYSTEM_ADMIN' || userRole === 'ROLE_ADMIN';

  return (
    <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
        >
          {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="hidden lg:flex items-center space-x-3">
          <div className="relative">
            {currentUser ? (
              <img
                src={getAvatarUrl(currentUser.avatarUrl || currentUser.avatar, 'user')}
                alt={currentUser.fullName || currentUser.name || 'User'}
                className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-zinc-800 ring-2 ring-blue-500/20"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.src = getAvatarUrl(null, 'user');
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 animate-pulse" />
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full shadow-xs"></div>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
              {currentUser?.fullName || currentUser?.name || currentUser?.username || 'User'}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{t('online')}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Suspense fallback={<div className="w-24 h-8 bg-gray-200 dark:bg-zinc-800 rounded-lg animate-pulse"></div>}>
          <LanguageSelector />
        </Suspense>

        {isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors"
            title="Admin Dashboard"
          >
            <Shield className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={() => navigate('/settings')}
          className="p-2 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          title={t('settings')}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
