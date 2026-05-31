import { X, Mail, Globe, Clock, MessageCircle, User, Hash } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getAvatarUrl } from '../../../config/api';

const UserProfileModal = ({ isOpen, onClose, user, onSendMessage }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  if (!isOpen || !user) return null;

  const currentUserId = currentUser?.userId || currentUser?.id;
  const targetUserId = user?.userId || user?.id;
  const isSelf = user?.isCurrentUser || (Boolean(currentUserId && targetUserId) && currentUserId === targetUserId);

  const getLanguageName = (languageCode) => {
    const languageMap = {
      'en': t('english'),
      'vi': t('vietnamese'),
      'es': t('spanish'),
      'fr': 'Français',
      'de': 'Deutsch',
      'ja': '日本語',
      'ko': '한국어',
      'zh': '中文',
      'EN': 'English',
      'VI': 'Tiếng Việt',
      'VN': 'Tiếng Việt',
      'ES': 'Español',
      'FR': 'Français',
      'DE': 'Deutsch',
      'JP': '日本語',
      'KR': '한국어',
      'CN': '中文'
    };
    return languageMap[languageCode] || languageCode;
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return t('online');
    
    const now = new Date();
    const lastSeen = new Date(timestamp);
    const diffInMinutes = Math.floor((now - lastSeen) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('justNow');
    if (diffInMinutes < 60) return `${diffInMinutes} ${t('minutesAgo')}`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ${t('hoursAgo')}`;
    return `${Math.floor(diffInMinutes / 1440)} ${t('daysAgo')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-zinc-800">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
            {t('userProfile')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-center mb-4">
            <div className="relative inline-block">
              <img
                src={getAvatarUrl(user.avatarUrl || user.avatar, 'user')}
                alt={user.fullName || user.name || user.username}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-3"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.src = getAvatarUrl(null, 'user');
                }}
              />
              <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white dark:border-zinc-900 ${
                user.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-1">
              {user.fullName || user.name || user.username || t('unknownUser')}
            </h3>
            <p className={`text-sm ${
              user.isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-zinc-400'
            }`}>
              {user.isOnline ? t('online') : (t('offline') || 'Offline')}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-lg">
              <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-200">
                  User ID
                </p>
                <p className="text-sm text-gray-600 dark:text-zinc-400 font-mono">
                  {user.userId}
                </p>
              </div>
            </div>

            {(user.locale || user.language) && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-lg">
                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-200">
                    {t('preferredLanguage') || 'Language'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">
                    {getLanguageName(user.locale || user.language)}
                  </p>
                </div>
              </div>
            )}

            {user.email && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-lg">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-200">
                    {t('email') || 'Email'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            {user.bio && (
              <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-lg">
                <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-200">Bio</p>
                  <p className="text-sm text-gray-600 dark:text-zinc-400 italic whitespace-pre-wrap">{user.bio}</p>
                </div>
              </div>
            )}

            {(user.website || user.gender || user.birthday) && (
              <div className="p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-lg space-y-1 text-xs text-gray-600 dark:text-zinc-400">
                {user.website && <p><span className="font-semibold text-gray-800 dark:text-zinc-200">Website:</span> <a href={user.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{user.website}</a></p>}
                {user.gender && <p><span className="font-semibold text-gray-800 dark:text-zinc-200">Giới tính:</span> {user.gender}</p>}
                {user.birthday && <p><span className="font-semibold text-gray-800 dark:text-zinc-200">Ngày sinh:</span> {user.birthday}</p>}
              </div>
            )}

            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-zinc-800/60 rounded-lg">
              <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                user.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-200">
                  Status
                </p>
                <p className={`text-sm ${
                  user.isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-zinc-400'
                }`}>
                  {user.isOnline ? (t('online') || 'Online') : (t('offline') || 'Offline')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!isSelf && onSendMessage && (
          <div className="p-4 border-t border-gray-200 dark:border-zinc-800 flex-shrink-0">
            <button 
              onClick={() => {
                onSendMessage(user);
                onClose();
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t('sendMessage') || 'Nhắn tin'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
