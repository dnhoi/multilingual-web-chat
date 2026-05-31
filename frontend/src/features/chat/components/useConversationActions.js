import { useState, useEffect } from 'react';
import * as chatApi from '../api/chat.api';

export const useConversationActions = ({
  selectedConversation,
  currentUser,
  t,
  showToast,
  onUpdateConversation,
  onLeaveConversation
}) => {
  const [groupLocale, setGroupLocale] = useState('EN');
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState('');
  
  const setUpdateStatus = ({ type, message }) => {
    if (message) showToast(message, type);
  };
  
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const handleSetAvatarMessage = (msg) => {
    if (msg) showToast(msg, msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('error') ? 'error' : 'success');
  };
  const [avatarInputKey, setAvatarInputKey] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', action: null });

  const handleDeleteConversation = async () => {
    const isGroup = selectedConversation.type === 'group' || selectedConversation.isGroup;
    const confirmMsg = isGroup 
      ? 'Bạn có chắc chắn muốn XÓA VĨNH VIỄN NHÓM CHAT NÀY? Tất cả tin nhắn và thành viên sẽ bị xóa hoàn toàn và không thể khôi phục!'
      : 'Bạn có chắc chắn muốn XÓA VĨNH VIỄN cuộc trò chuyện này? Tất cả tin nhắn sẽ bị xóa hoàn toàn!';
      
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa cuộc trò chuyện',
      message: confirmMsg,
      action: async () => {
        const conversationId = selectedConversation?.conversationId || selectedConversation?.id;
        try {
          // Optimistically update UI immediately (0ms delay)
          if (window.removeConversationFromList && conversationId) {
            window.removeConversationFromList(conversationId);
          }
          if (onLeaveConversation) {
            onLeaveConversation(conversationId);
          }
          
          await chatApi.deleteConversation(conversationId);
          showToast('Đã xóa cuộc trò chuyện thành công!', 'success');
        } catch (e) {
          showToast(e.message || 'Lỗi khi xóa cuộc trò chuyện', 'error');
        }
      }
    });
  };

  const handleKickMember = async (memberId, memberName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa thành viên',
      message: `Bạn có chắc chắn muốn xóa ${memberName} khỏi nhóm?`,
      action: async () => {
        try {
          const conversationId = selectedConversation.conversationId || selectedConversation.id;
          await chatApi.kickGroupMember(conversationId, memberId);
          showToast(`Đã xóa ${memberName} khỏi nhóm thành công!`, 'success');
          if (selectedConversation && onUpdateConversation) {
            const currentList = selectedConversation.userProfiles || selectedConversation.participants || [];
            const updatedParticipants = currentList.filter(p => p.userId !== memberId);
            onUpdateConversation({ ...selectedConversation, participants: updatedParticipants, userProfiles: updatedParticipants });
          }
          if (window.refreshSelectedConversation) window.refreshSelectedConversation();
          if (window.refreshConversations) window.refreshConversations();
        } catch (e) {
          showToast(e.message || 'Lỗi khi xóa thành viên', 'error');
        }
      }
    });
  };

  const handleRoleChange = async (memberId, memberName, newRole) => {
    try {
      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      await chatApi.changeMemberRole(conversationId, memberId, newRole);
      setUpdateStatus({ type: 'success', message: `Đã đổi vai trò của ${memberName} thành ${newRole}.` });
      if (selectedConversation && onUpdateConversation) {
        const currentList = selectedConversation.userProfiles || selectedConversation.participants || [];
        const updatedParticipants = currentList.map(p =>
          p.userId === memberId ? { ...p, role: newRole } : p
        );
        onUpdateConversation({ ...selectedConversation, participants: updatedParticipants, userProfiles: updatedParticipants });
      }
      if (window.refreshSelectedConversation) window.refreshSelectedConversation();
      if (window.refreshConversations) window.refreshConversations();
    } catch (e) {
      setUpdateStatus({ type: 'error', message: e.message || 'Lỗi khi đổi vai trò' });
    }
  };

  const handleMuteMember = async (memberId, memberName) => {
    try {
      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      await chatApi.toggleMuteMember(conversationId, memberId);
      if (selectedConversation && onUpdateConversation) {
        const currentList = selectedConversation.userProfiles || selectedConversation.participants || [];
        const updatedParticipants = currentList.map(p =>
          p.userId === memberId ? { ...p, isMuted: !p.isMuted } : p
        );
        onUpdateConversation({ ...selectedConversation, participants: updatedParticipants, userProfiles: updatedParticipants });
      }
    } catch (e) {
      setUpdateStatus({ type: 'error', message: e.message || 'Lỗi khi thay đổi trạng thái tắt tiếng' });
    }
  };

  const handleBanMember = async (memberId, memberName) => {
    try {
      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      await chatApi.toggleBanMember(conversationId, memberId);
      if (selectedConversation && onUpdateConversation) {
        const currentList = selectedConversation.userProfiles || selectedConversation.participants || [];
        const updatedParticipants = currentList.map(p =>
          p.userId === memberId ? { ...p, isBanned: !p.isBanned } : p
        );
        onUpdateConversation({ ...selectedConversation, participants: updatedParticipants, userProfiles: updatedParticipants });
      }
      setUpdateStatus({ type: 'success', message: `Đã thay đổi trạng thái chặn của ${memberName}.` });
    } catch (e) {
      setUpdateStatus({ type: 'error', message: e.message || 'Lỗi khi thay đổi trạng thái chặn' });
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      setGroupName(selectedConversation.name || selectedConversation.conversationName || '');
      setGroupLocale(selectedConversation.groupLocale || 'EN');
    }
  }, [selectedConversation]);

  const handleGroupLocaleChange = async (newLocale) => {
    try {
      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      await chatApi.updateConversationLocale(conversationId, newLocale);
      setGroupLocale(newLocale);
      setUpdateStatus({ type: 'success', message: 'Group locale updated successfully!' });
      
      if (window.updateConversationInfo) {
        window.updateConversationInfo(conversationId, {
          groupLocale: newLocale
        });
      }
      
      if (selectedConversation && onUpdateConversation) {
        const updatedConversation = {
          ...selectedConversation,
          groupLocale: newLocale
        };
        onUpdateConversation(updatedConversation);
      }
    } catch (error) {
      setUpdateStatus({ type: 'error', message: 'Failed to update group locale' });
      setGroupLocale(selectedConversation.groupLocale || 'EN');
    }
  };

  const handleGroupNameChange = async () => {
    if (!groupName.trim()) return;
    
    try {
      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      await chatApi.updateConversationName(conversationId, groupName.trim());
      setUpdateStatus({ type: 'success', message: 'Group name updated successfully!' });
      setIsEditingName(false);
      
      if (window.updateConversationInfo) {
        window.updateConversationInfo(conversationId, {
          name: groupName.trim(),
          conversationName: groupName.trim()
        });
      }
      
      if (selectedConversation && onUpdateConversation) {
        const updatedConversation = {
          ...selectedConversation,
          name: groupName.trim(),
          conversationName: groupName.trim()
        };
        onUpdateConversation(updatedConversation);
      }
    } catch (error) {
      setUpdateStatus({ type: 'error', message: 'Failed to update group name' });
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
  };

  const handleAvatarUpload = async (file) => {
    if (!file) return;
    
    setIsUploadingAvatar(true);
    handleSetAvatarMessage('');
    
    try {
      const { valid, error } = (await import('../../../services/CloudinaryService')).default.validateFile(file);
      if (!valid) {
        handleSetAvatarMessage(error || 'Invalid file');
        return;
      }
      
      const cloudinary = (await import('../../../services/CloudinaryService')).default;
      const result = await cloudinary.uploadFile(file);
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }
      
      const url = result?.result?.url || result?.data?.url || result?.url;
      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      
      const res = await chatApi.updateConversationAvatar(conversationId, url);
      if (res.success) {
        if (window.updateConversationInfo) {
          window.updateConversationInfo(conversationId, {
            groupAvtUrl: url,
            avatarUrl: url
          });
        }
        
        if (selectedConversation && onUpdateConversation) {
          const updatedConversation = {
            ...selectedConversation,
            groupAvtUrl: url,
            avatarUrl: url
          };
          onUpdateConversation(updatedConversation);
        }
        
        handleSetAvatarMessage(t('saved') || 'Saved');
      } else {
        handleSetAvatarMessage(res.message || 'Failed');
      }
    } catch (err) {
      handleSetAvatarMessage(err.message || 'Upload failed');
    } finally {
      setIsUploadingAvatar(false);
      setAvatarInputKey((k) => k + 1);
    }
  };

  return {
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
  };
};
