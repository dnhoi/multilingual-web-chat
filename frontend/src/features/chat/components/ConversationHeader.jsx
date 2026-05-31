import { Edit2, Camera } from 'lucide-react';

const ConversationHeader = ({
  selectedConversation,
  isOwnerOrAdmin,
  getConversationAvatar,
  getConversationName,
  getParticipants,
  t,
  avatarInputKey,
  handleAvatarUpload,
  isEditingName,
  groupName,
  setGroupName,
  handleGroupNameChange,
  handleCancelEditName,
  setIsEditingName,
  avatarMessage,
  isUploadingAvatar
}) => {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center space-x-3 mb-4">
        <div className="relative">
          <img
            src={getConversationAvatar(selectedConversation)}
            alt={getConversationName(selectedConversation)}
            className="w-12 h-12 rounded-full object-cover"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.target.src = (selectedConversation.type === 'group' || selectedConversation.isGroup) ? '/default-group-avatar.svg' : '/default-avatar.svg';
            }}
          />
          {(selectedConversation.type !== 'group' && !selectedConversation.isGroup) && (
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
              getParticipants(selectedConversation)[0]?.isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
          )}
          {(selectedConversation.type === 'group' || selectedConversation.isGroup) && (
            <div className="absolute -bottom-1 -right-1">
              <label className="cursor-pointer">
                <div className="w-6 h-6 bg-blue-500 hover:bg-blue-600 border-2 border-white rounded-full flex items-center justify-center transition-colors">
                  <Camera className="w-3 h-3 text-white" />
                </div>
                <input
                  key={avatarInputKey}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleAvatarUpload(file);
                    }
                  }}
                />
              </label>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {(selectedConversation.type === 'group' || selectedConversation.isGroup) && isEditingName ? (
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleGroupNameChange();
                    } else if (e.key === 'Escape') {
                      handleCancelEditName();
                    }
                  }}
                  className="w-full text-lg font-semibold text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter group name..."
                  autoFocus
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {getConversationName(selectedConversation)}
              </h2>
              {(selectedConversation.type === 'group' || selectedConversation.isGroup) && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          <p className="text-sm text-green-600 font-medium">
            {(selectedConversation.type === 'group' || selectedConversation.isGroup) ? t('groupChat') : t('directMessage')}
          </p>
          {(selectedConversation.type === 'group' || selectedConversation.isGroup) && avatarMessage && (
            <p className={`text-xs mt-1 ${isUploadingAvatar ? 'text-gray-600' : 'text-green-600'}`}>
              {avatarMessage}{isUploadingAvatar ? '…' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationHeader;
