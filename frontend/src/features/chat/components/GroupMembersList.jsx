import { UserPlus, UserX, Ban, VolumeX } from 'lucide-react';
import { getAvatarUrl } from '../../../config/api';

const GroupMembersList = ({
  participants,
  selectedConversation,
  isOwnerOrAdmin,
  currentUser,
  t,
  onAddMemberClick,
  onUserClick,
  handleRoleChange,
  handleMuteMember,
  handleBanMember,
  handleKickMember
}) => {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            {t('members')} ({participants.length})
          </h3>
          {(selectedConversation.type === 'group' || selectedConversation.isGroup) && (
            <button 
              onClick={() => onAddMemberClick && onAddMemberClick()}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs font-medium hover:bg-blue-50 px-2 py-1 rounded transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t('addMembers')}</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {participants.map((user) => (
            <div
              key={user.userId}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <div 
                className="relative cursor-pointer"
                onClick={() => onUserClick && onUserClick(user)}
              >
                <img
                  src={getAvatarUrl(user.avatarUrl, 'user')}
                  alt={user.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.target.src = getAvatarUrl(null, 'user');
                  }}
                />
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                  user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
              </div>
              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => onUserClick && onUserClick(user)}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {user.fullName} {user.isCurrentUser ? `(${t('you') || 'Bạn'})` : ''}
                  </h4>
                  <span className={`text-xs font-medium ${
                    user.isOnline ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {user.isOnline ? t('online') : t('offline')}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {user.locale || user.language || 'N/A'}
                  </span>
                  {user.isMuted && (
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1 py-0.5 rounded border border-amber-300">
                      {t('muteMember') || 'MUTED'}
                    </span>
                  )}
                  {user.isBanned && (
                    <span className="text-[9px] font-bold bg-red-100 text-red-800 px-1 py-0.5 rounded border border-red-300">
                      {t('banMember') || 'BANNED'}
                    </span>
                  )}
                  {(selectedConversation.type === 'group' || selectedConversation.isGroup) && (
                    isOwnerOrAdmin && !user.isCurrentUser ? (
                      <select
                         value={user.role || 'MEMBER'}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleRoleChange(user.userId, user.fullName, e.target.value);
                        }}
                        className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        title={t('changeRole') || "Phân quyền thành viên"}
                      >
                        <option value="MEMBER">MEMBER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="OWNER">OWNER</option>
                      </select>
                    ) : (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        user.role === 'OWNER' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                          : user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {user.role || 'MEMBER'}
                      </span>
                    )
                  )}
                </div>
              </div>
              {(selectedConversation.type === 'group' || selectedConversation.isGroup) && isOwnerOrAdmin && !user.isCurrentUser && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMuteMember(user.userId, user.fullName);
                    }}
                    title={user.isMuted ? (t('unmuteMember') || "Bật tiếng") : (t('muteMember') || "Tắt tiếng")}
                    className={`p-1 rounded transition-all ${user.isMuted ? 'text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBanMember(user.userId, user.fullName);
                    }}
                    title={user.isBanned ? (t('unbanMember') || "Bỏ chặn") : (t('banMember') || "Chặn thành viên")}
                    className={`p-1 rounded transition-all ${user.isBanned ? 'text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                  >
                    <Ban className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleKickMember(user.userId, user.fullName);
                    }}
                    title={t('kickMember') || "Xóa khỏi nhóm"}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GroupMembersList;
