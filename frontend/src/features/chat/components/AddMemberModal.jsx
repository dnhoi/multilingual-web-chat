import { useState } from 'react';
import { X, UserPlus, Users } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import UserSearch from '../../../components/common/UserSearch';
import { getAvatarUrl } from '../../../config/api';
import * as chatApi from '../api/chat.api';

const AddMemberModalV2 = ({ isOpen, onClose, conversation, onAddMembers }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [warningMessage, setWarningMessage] = useState('');
  const { t } = useLanguage();

  const handleUserSelect = (user) => {
    const isAlreadyInGroup = conversation?.participants?.some(p => p.userId === user.userId);
    if (isAlreadyInGroup) {
      setWarningMessage(`${user.fullName} đã có trong group rồi!`);
      setTimeout(() => setWarningMessage(''), 3000);
      return;
    }
    
    const isSelected = selectedUsers.find(u => u.userId === user.userId);
    if (isSelected) {
      setSelectedUsers(selectedUsers.filter(u => u.userId !== user.userId));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.userId !== userId));
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      const userIds = selectedUsers.map(user => user.userId);
      const conversationId = conversation.conversationId || conversation.id;
      await chatApi.addMemberToGroup(conversationId, userIds);
      
      if (onAddMembers) {
        onAddMembers(selectedUsers, conversationId);
      }
      
      setSelectedUsers([]);
      onClose();
    } catch (error) {
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            Add Members to Group
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <img
                src={getAvatarUrl(conversation?.avatarUrl, 'group')}
                alt={conversation?.name || 'Group'}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = getAvatarUrl(null, 'group');
                }}
              />
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  {conversation?.name || 'Group Chat'}
                </h3>
                <p className="text-xs text-gray-500">
                  {conversation?.participants?.length || 0} members
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <UserSearch
              onUserSelect={handleUserSelect}
              placeholder="Search by UserID, Name or Email..."
              className="w-full"
            />
            
            {warningMessage && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">{warningMessage}</p>
              </div>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Selected Users ({selectedUsers.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(user => (
                  <div
                    key={user.userId}
                    className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <img
                      src={getAvatarUrl(user.avatarUrl, 'user')}
                      alt={user.fullName}
                      className="w-5 h-5 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = getAvatarUrl(null, 'user');
                      }}
                    />
                    <span>{user.fullName}</span>
                    <button
                      onClick={() => handleRemoveUser(user.userId)}
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
                <p>Search and select users to add to the group</p>
              </div>
            ) : (
               selectedUsers.map(user => (
                 <div
                   key={user.userId}
                   className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200"
                 >
                   <img
                     src={getAvatarUrl(user.avatarUrl, 'user')}
                     alt={user.fullName}
                     className="w-10 h-10 rounded-full object-cover"
                     onError={(e) => {
                       e.target.src = getAvatarUrl(null, 'user');
                     }}
                   />
                   <div className="flex-1">
                     <h4 className="text-sm font-medium text-gray-900">
                       {user.fullName}
                     </h4>
                     <p className="text-xs text-gray-500">
                       {user.email}
                     </p>
                     <p className="text-xs text-gray-400">
                       ID: {user.userId}
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

        <div className="p-4 border-t border-gray-200 flex space-x-3 flex-shrink-0">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddMembers}
            disabled={selectedUsers.length === 0}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Members ({selectedUsers.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModalV2;
