import { X } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getAvatarUrl } from '../../../config/api';
import { useToast } from '../../../contexts/ToastContext';
import GroupMembersList from './GroupMembersList';
import ConversationHeader from './ConversationHeader';
import ConfirmModal from '../../../components/common/ConfirmModal';
import GroupSettingsPanel from './GroupSettingsPanel';
import ConversationActionsPanel from './ConversationActionsPanel';
import { useConversationActions } from './useConversationActions';
import * as chatApi from '../api/chat.api';

const ConversationInfo = ({ selectedConversation, onUserProfileClick, onAddMemberClick, onLeaveConversation, onShowLeaveConfirm, onUserClick, onUpdateConversation, onClose }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  const { showToast } = useToast();

  const {
    groupLocale,
    setGroupLocale,
    isEditingName,
    setIsEditingName,
    groupName,
    setGroupName,
    isUploadingAvatar,
    avatarMessage,
    avatarInputKey,
    confirmDialog,
    setConfirmDialog,
    handleDeleteConversation,
    handleKickMember,
    handleRoleChange,
    handleMuteMember,
    handleBanMember,
    handleGroupLocaleChange,
    handleGroupNameChange,
    handleCancelEditName,
    handleAvatarUpload,
    setUpdateStatus
  } = useConversationActions({
    selectedConversation,
    currentUser,
    t,
    showToast,
    onUpdateConversation,
    onLeaveConversation
  });

  const getConversationName = (conversation) => {
    if (conversation.type === 'group' || conversation.isGroup) {
      return conversation.conversationName || conversation.name || t('groupChat');
    }
    
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      if (otherParticipant) {
        return otherParticipant.fullName || otherParticipant.name || otherParticipant.username || t('unknownUser');
      }
    }
    
    if (conversation.userProfiles && conversation.userProfiles.length > 0) {
      const otherUser = conversation.userProfiles.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      if (otherUser) {
        return otherUser.fullName || t('unknownUser');
      }
    }
    
    return t('unknownUser');
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'group' || conversation.isGroup) {
      return getAvatarUrl(conversation.groupAvtUrl || conversation.avatarUrl, 'group');
    }
    
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      if (otherParticipant?.avatarUrl) {
        return getAvatarUrl(otherParticipant.avatarUrl, 'user');
      }
    }
    
    if (conversation.userProfiles && conversation.userProfiles.length > 0) {
      const otherUser = conversation.userProfiles.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      if (otherUser?.avatarUrl) {
        return getAvatarUrl(otherUser.avatarUrl, 'user');
      }
    }
    
    return getAvatarUrl(null, 'user');
  };

  const getParticipants = (conversation) => {
    if (conversation.userProfiles && conversation.userProfiles.length > 0) {
      if (conversation.type === 'group' || conversation.isGroup) {
        return conversation.userProfiles.map(participant => ({
          userId: participant.userId,
          fullName: (participant.userId === currentUser?.id || participant.userId === currentUser?.userId) 
            ? t('you') || 'Tôi' 
            : participant.fullName || participant.name || participant.username,
          avatarUrl: participant.avatarUrl,
          locale: participant.locale,
          role: participant.role || (conversation.ownerId === participant.userId ? 'OWNER' : 'MEMBER'),
          isOnline: participant.online !== undefined ? participant.online : true,
          isCurrentUser: participant.userId === currentUser?.id || participant.userId === currentUser?.userId
        }));
      } else {
        const otherUser = conversation.userProfiles.find(p => 
          p.userId !== currentUser?.id && p.userId !== currentUser?.userId
        );
        if (otherUser) {
          return [{
            userId: otherUser.userId,
            fullName: otherUser.fullName,
            avatarUrl: otherUser.avatarUrl,
            isOnline: otherUser.online !== undefined ? otherUser.online : true,
            isCurrentUser: false,
            language: otherUser.locale || 'en'
          }];
        }
      }
    }
    
    if (conversation.type === 'group' || conversation.isGroup) {
      const participants = conversation.participants || [];
      return participants.map(participant => ({
        userId: participant.userId,
        fullName: (participant.userId === currentUser?.id || participant.userId === currentUser?.userId) 
          ? t('you') || 'Tôi' 
          : participant.fullName || participant.name || participant.username,
        avatarUrl: participant.avatarUrl,
        locale: participant.locale,
        role: participant.role || (conversation.ownerId === participant.userId ? 'OWNER' : 'MEMBER'),
        isOnline: participant.online !== undefined ? participant.online : true,
        isCurrentUser: participant.userId === currentUser?.id || participant.userId === currentUser?.userId
      }));
    } else {
      const participants = [];
      if (conversation.participants && conversation.participants.length > 0) {
        const otherParticipant = conversation.participants.find(p => 
          p.userId !== currentUser?.id && p.userId !== currentUser?.userId
        );
        if (otherParticipant) {
          participants.push({
            userId: otherParticipant.userId,
            fullName: otherParticipant.fullName || otherParticipant.name || otherParticipant.username,
            avatarUrl: otherParticipant.avatarUrl,
            isOnline: otherParticipant.online !== undefined ? otherParticipant.online : true,
            isCurrentUser: false,
            language: otherParticipant.locale || 'en'
          });
        }
      }
      return participants;
    }
    
    return [];
  };

  if (!selectedConversation) {
    return (
      <div className="w-full h-full flex flex-col bg-white border-l border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('conversationInfo')}
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-center text-sm">
            {t('selectConversation')}
          </p>
        </div>
      </div>
    );
  }

  const participants = getParticipants(selectedConversation);
  const currentUserId = currentUser?.id || currentUser?.userId;
  const currentParticipant = (selectedConversation?.participants || []).find(p => 
    String(p.userId || p.id) === String(currentUserId)
  );
  const currentUserRole = currentParticipant?.role || (String(selectedConversation?.ownerId || '') === String(currentUserId || '') ? 'OWNER' : null);
  const isGroup = selectedConversation?.type === 'group' || selectedConversation?.isGroup;
  const isOwnerOrAdmin = isGroup ? (currentUserRole === 'OWNER' || currentUserRole === 'ADMIN' || (!currentUserRole && currentParticipant?.isCurrentUser)) : false;

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-gray-50/80 dark:bg-zinc-850">
        <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-100">
          Thông tin hội thoại
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg hover:bg-gray-200/60 dark:hover:bg-zinc-700 transition-colors"
            title="Đóng bảng thông tin"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
        <ConversationHeader
          selectedConversation={selectedConversation}
          isOwnerOrAdmin={isOwnerOrAdmin}
          getConversationAvatar={getConversationAvatar}
          getConversationName={getConversationName}
          getParticipants={getParticipants}
          t={t}
          avatarInputKey={avatarInputKey}
          handleAvatarUpload={handleAvatarUpload}
          isEditingName={isEditingName}
          groupName={groupName}
          setGroupName={setGroupName}
          handleGroupNameChange={handleGroupNameChange}
          handleCancelEditName={handleCancelEditName}
          setIsEditingName={setIsEditingName}
          avatarMessage={avatarMessage}
          isUploadingAvatar={isUploadingAvatar}
        />

        <GroupSettingsPanel
          selectedConversation={selectedConversation}
          isOwnerOrAdmin={isOwnerOrAdmin}
          groupLocale={groupLocale}
          handleGroupLocaleChange={handleGroupLocaleChange}
          onUpdateConversation={onUpdateConversation}
          setUpdateStatus={setUpdateStatus}
          t={t}
        />
      </div>

      <GroupMembersList
        participants={participants}
        selectedConversation={selectedConversation}
        isOwnerOrAdmin={isOwnerOrAdmin}
        currentUser={currentUser}
        t={t}
        onAddMemberClick={onAddMemberClick}
        onUserClick={onUserClick}
        handleRoleChange={handleRoleChange}
        handleMuteMember={handleMuteMember}
        handleBanMember={handleBanMember}
        handleKickMember={handleKickMember}
      />

      <ConversationActionsPanel
        selectedConversation={selectedConversation}
        isOwnerOrAdmin={isOwnerOrAdmin}
        handleDeleteConversation={handleDeleteConversation}
        onShowLeaveConfirm={onShowLeaveConfirm}
        t={t}
      />

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={async () => {
          if (confirmDialog.action) await confirmDialog.action();
          setConfirmDialog({ isOpen: false, title: '', message: '', action: null });
        }}
        onCancel={() => setConfirmDialog({ isOpen: false, title: '', message: '', action: null })}
      />
    </div>
  );
};

export default ConversationInfo;
