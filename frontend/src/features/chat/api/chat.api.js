import axiosClient from '../../../core/api/axiosClient';

/**
 * Chat and Conversation APIs
 */

export const getConversations = async (page = 0, size = 50) => {
  const response = await axiosClient.get('/chat/message/list', { params: { page, size } });
  return response.data;
};

export const createDirectConversation = async (toUserId) => {
  const response = await axiosClient.post('/chat/conversation', { toUserId, ToUserId: toUserId });
  return response.data;
};

export const createGroupConversation = async (userIds, conversationName, locale) => {
  const response = await axiosClient.post('/chat/conversation/group', { userIds, conversationName, locale });
  return response.data;
};

export const deleteConversation = async (conversationId) => {
  const response = await axiosClient.delete(`/chat/${conversationId}`);
  return response.data;
};

export const leaveConversation = async (conversationId) => {
  try {
    const response = await axiosClient.post(`/chat/${conversationId}/out`);
    return response.data;
  } catch (err) {
    const response = await axiosClient.post('/chat/conversation/out', conversationId, {
      headers: { 'Content-Type': 'text/plain' }
    });
    return response.data;
  }
};

// --- Conversation Settings ---
export const updateConversationName = async (conversationId, name) => {
  const response = await axiosClient.put(`/chat/${conversationId}/name`, name, {
    headers: { 'Content-Type': 'text/plain' }
  });
  return response.data;
};

export const updateConversationDescription = async (conversationId, description) => {
  const response = await axiosClient.put(`/chat/${conversationId}/description`, description, {
    headers: { 'Content-Type': 'text/plain' }
  });
  return response.data;
};

export const updateConversationAvatar = async (conversationId, avatar) => {
  const response = await axiosClient.put(`/chat/${conversationId}/avatar`, avatar, {
    headers: { 'Content-Type': 'text/plain' }
  });
  return response.data;
};

export const updateConversationLocale = async (conversationId, locale) => {
  const response = await axiosClient.put(`/chat/${conversationId}/locale`, locale, {
    headers: { 'Content-Type': 'text/plain' }
  });
  return response.data;
};

// --- Conversation Toggles ---
export const toggleArchiveConversation = async (conversationId) => {
  const response = await axiosClient.put(`/chat/${conversationId}/archive`);
  return response.data;
};

export const togglePinConversation = async (conversationId) => {
  const response = await axiosClient.put(`/chat/${conversationId}/pin`);
  return response.data;
};

export const toggleFavoriteConversation = async (conversationId) => {
  const response = await axiosClient.put(`/chat/${conversationId}/favorite`);
  return response.data;
};

export const toggleMuteConversation = async (conversationId) => {
  const response = await axiosClient.put(`/chat/${conversationId}/mute`);
  return response.data;
};

// --- Group Members & Moderation ---
export const addMemberToGroup = async (conversationId, userIds) => {
  const response = await axiosClient.post(`/chat/${conversationId}/group/member`, { userIds });
  return response.data;
};

export const kickGroupMember = async (conversationId, memberId) => {
  const response = await axiosClient.post(`/chat/${conversationId}/member/${memberId}/kick`);
  return response.data;
};

export const changeMemberRole = async (conversationId, memberId, role) => {
  const response = await axiosClient.post(`/chat/${conversationId}/member/${memberId}/role`, null, {
    params: { role }
  });
  return response.data;
};

export const toggleMuteMember = async (conversationId, memberId) => {
  const response = await axiosClient.post(`/chat/${conversationId}/member/${memberId}/mute`);
  return response.data;
};

export const toggleBanMember = async (conversationId, memberId) => {
  const response = await axiosClient.post(`/chat/${conversationId}/member/${memberId}/ban`);
  return response.data;
};

export const setSlowMode = async (conversationId, seconds) => {
  const response = await axiosClient.put(`/chat/${conversationId}/slow-mode`, seconds, {
    headers: { 'Content-Type': 'application/json' }
  });
  return response.data;
};

export const updateGroupAnnouncement = async (conversationId, announcement) => {
  const response = await axiosClient.put(`/chat/${conversationId}/announcement`, announcement, {
    headers: { 'Content-Type': 'text/plain' }
  });
  return response.data;
};

export const getGroupInviteCode = async (conversationId) => {
  const response = await axiosClient.get(`/chat/${conversationId}/invite-code`);
  return response.data;
};

export const joinByInviteCode = async (inviteCode) => {
  const response = await axiosClient.post(`/chat/conversation/join/${inviteCode}`);
  return response.data;
};

// --- Messages ---
export const getMessages = async (conversationId, page = 0, size = 50) => {
  const response = await axiosClient.get(`/chat/message/${conversationId}`, { params: { page, size } });
  return response.data;
};

export const searchMessages = async (conversationId, query, page = 0, size = 50) => {
  const response = await axiosClient.get(`/chat/message/${conversationId}/search`, { params: { query, keyword: query, page, size } });
  return response.data;
};

export const deleteMessageByAdmin = async (messageId) => {
  const response = await axiosClient.delete(`/chat/message/${messageId}`);
  return response.data;
};

export const sendMessage = async (conversationId, messageText, messageType = 'TEXT') => {
  const response = await axiosClient.post('/chat/message', { conversationId, messageText, type: messageType });
  return response.data;
};

// --- File Upload ---
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosClient.post('/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress ? (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      onProgress(percentCompleted);
    } : undefined,
  });
  return response.data;
};
