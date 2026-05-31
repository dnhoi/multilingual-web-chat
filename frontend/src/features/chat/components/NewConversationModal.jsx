import { useState } from 'react';
import { X, UserPlus, Users } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import AILanguageSelector from '../../../components/common/AILanguageSelector';
import UserSearch from '../../../components/common/UserSearch';
import { getAvatarUrl } from '../../../config/api';
import * as chatApi from '../api/chat.api';

const NewConversationModal = ({ isOpen, onClose, onCreateConversation }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [conversationType, setConversationType] = useState('direct');
  const [groupLanguage, setGroupLanguage] = useState('EN');
  const [groupName, setGroupName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [isCreating, setIsCreating] = useState(false);


  const handleUserSelect = (user) => {
    setErrorMessage('');
    const internalUser = {
      id: user.userId,
      name: user.fullName,
      email: user.email,
      avatar: user.avatarUrl,
      locale: user.locale
    };

    if (conversationType === 'direct') {
      setSelectedUsers([internalUser]);
    } else {
      const isSelected = selectedUsers.find(u => u.id === internalUser.id);
      if (isSelected) {
        setSelectedUsers(selectedUsers.filter(u => u.id !== internalUser.id));
      } else {
        setSelectedUsers([...selectedUsers, internalUser]);
      }
    }
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0 || isCreating) return;
    setErrorMessage('');

    try {
      setIsCreating(true);

      if (conversationType === 'direct') {
        const toUser = selectedUsers[0];
        const apiResult = await chatApi.createDirectConversation(toUser.id);
        const resData = apiResult?.result || apiResult?.data || apiResult;
        const conversationId = resData?.conversationId || resData?.ConversationId || (typeof resData === 'string' ? resData : null);
        if (!conversationId) throw new Error('No conversationId returned');

        const newConversation = {
          id: conversationId,
          conversationId,
          type: 'direct',
          participants: [
            {
              userId: toUser.id,
              fullName: toUser.name,
              email: toUser.email,
              avatarUrl: toUser.avatar,
              locale: toUser.locale
            }
          ]
        };

        onCreateConversation(newConversation);
      } else {
        const selectedUserIds = selectedUsers.map(u => u.id);
        const selfUserId = currentUser?.userId || currentUser?.id;
        const allUserIds = Array.from(new Set([...(selectedUserIds || []), selfUserId].filter(Boolean)));
        
        if (allUserIds.length < 3) {
          setErrorMessage(t('groupMinMembersError') || 'Nhóm chat phải có ít nhất 3 thành viên (bao gồm cả bạn).');
          setIsCreating(false);
          return;
        }

        const selectedLocale = (groupLanguage || 'EN').toUpperCase();
        const locale = selectedLocale;
        const name = groupName && groupName.trim().length > 0
          ? groupName.trim()
          : `${t('newGroup')} ${selectedUsers.map(u => u.name).join(', ')}`;

        const apiResult = await chatApi.createGroupConversation(allUserIds, name, locale);
        const resData = apiResult?.result || apiResult?.data || apiResult;
        const conversationId = resData?.conversationId || resData?.ConversationId || (typeof resData === 'string' ? resData : null);
        if (!conversationId) throw new Error('No conversationId returned');

        const newConversation = {
          id: conversationId,
          conversationId,
          type: 'group',
          name,
          language: locale,
          ownerId: selfUserId,
          participants: [
            ...selectedUsers.map(u => ({
              userId: u.id,
              fullName: u.name,
              email: u.email,
              avatarUrl: u.avatar,
              locale: u.locale,
              role: 'MEMBER'
            })),
            ...(selfUserId ? [{
              userId: selfUserId,
              fullName: currentUser?.fullName || currentUser?.name || 'Me',
              email: currentUser?.email || '',
              avatarUrl: currentUser?.avatarUrl || currentUser?.avatar || null,
              locale: currentUser?.locale || 'EN',
              role: 'OWNER'
            }] : [])
          ]
        };

        onCreateConversation(newConversation);
      }

      onClose();
      setSelectedUsers([]);
      setGroupName('');
      setGroupLanguage('EN');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('newConversation')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setConversationType('direct'); setErrorMessage(''); }}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-1.5 rounded-md text-xs font-medium transition-colors ${
                conversationType === 'direct'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Cá nhân</span>
            </button>
            <button
              onClick={() => { setConversationType('group'); setErrorMessage(''); }}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-2 px-1.5 rounded-md text-xs font-medium transition-colors ${
                conversationType === 'group'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Nhóm</span>
            </button>

          </div>

          {conversationType === 'group' && (
            <div className="mb-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900"
                />
              </div>
              <div>
                <label className=" block text-sm font-medium text-gray-700 mb-2">
                  Group Language
                </label>
                <AILanguageSelector
                  selectedLanguage={groupLanguage}
                  onLanguageChange={setGroupLanguage}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs text-amber-800 font-medium">
                ⚠️ {t('groupMinMembersHint') || 'Nhóm chat cần ít nhất 3 thành viên (cần chọn thêm ít nhất 2 người)'}
              </div>
            </div>
          )}

            <div className="mb-4">
              <UserSearch
                onUserSelect={handleUserSelect}
                placeholder="Search by UserID, Name or Email..."
                className="w-full"
              />
            </div>

          {selectedUsers.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                {t('selectedUsers')} ({selectedUsers.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <img
                      src={getAvatarUrl(user.avatar, 'user')}
                      alt={user.name}
                      className="w-5 h-5 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = getAvatarUrl(null, 'user');
                      }}
                    />
                    <span>{user.name}</span>
                    <button
                      onClick={() => setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto">
            {selectedUsers.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Search and select users to start a conversation</p>
              </div>
            ) : (
              selectedUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200"
                >
                  <img
                    src={getAvatarUrl(user.avatar, 'user')}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = getAvatarUrl(null, 'user');
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {user.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-400">
                      ID: {user.id}
                    </p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {user.locale}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleCreateConversation}
            disabled={selectedUsers.length === 0 || (conversationType === 'group' && selectedUsers.length < 2) || isCreating}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? 'Creating…' : t('create')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal;
