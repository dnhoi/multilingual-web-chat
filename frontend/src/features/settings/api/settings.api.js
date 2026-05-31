import axiosClient from '../../../core/api/axiosClient';

/**
 * Settings and Admin APIs
 */

export const getReports = async () => {
  const response = await axiosClient.get('/identify/admin/reports');
  return response.data;
};

export const createReport = async (reportData) => {
  const response = await axiosClient.post('/identify/admin/reports', reportData);
  return response.data;
};

export const resolveReport = async (id) => {
  const response = await axiosClient.put(`/identify/admin/reports/${id}/resolve`);
  return response.data;
};

export const getAuditLogs = async () => {
  const response = await axiosClient.get('/identify/admin/audit-logs');
  return response.data;
};

export const createAuditLog = async (action, target, adminName) => {
  const response = await axiosClient.post('/identify/admin/audit-logs', { action, target, admin: adminName });
  return response.data;
};

export const getSystemConfigs = async () => {
  const response = await axiosClient.get('/identify/admin/system-configs');
  return response.data;
};

export const updateSystemConfigs = async (configs) => {
  const response = await axiosClient.put('/identify/admin/system-configs', configs);
  return response.data;
};

export const toggleBanUser = async (userId) => {
  const response = await axiosClient.put(`/identify/admin/users/${userId}/toggle-ban`);
  return response.data;
};

export const changeUserRole = async (userId, role) => {
  const response = await axiosClient.put(`/identify/admin/users/${userId}/role`, { role });
  return response.data;
};

export const getActiveSessions = async () => {
  const response = await axiosClient.get('/identify/auth/sessions');
  return response.data;
};

export const revokeSession = async (sessionId) => {
  const response = await axiosClient.delete(`/identify/auth/sessions/${sessionId}`);
  return response.data;
};

export const getPublicAnnouncement = async () => {
  const response = await axiosClient.get('/identify/admin/public/announcement');
  return response.data;
};

export const getPublicBannedKeywords = async () => {
  const response = await axiosClient.get('/identify/admin/public/banned-keywords');
  return response.data;
};

export const updateBroadcast = async (broadcastData) => {
  const response = await axiosClient.post('/identify/admin/broadcast', broadcastData);
  return response.data;
};

export const getSecurityAlerts = async () => {
  const response = await axiosClient.get('/identify/admin/security-alerts');
  return response.data;
};

export const getMediaStats = async () => {
  const response = await axiosClient.get('/identify/admin/media-stats');
  return response.data;
};

export const cleanupMedia = async () => {
  const response = await axiosClient.post('/identify/admin/media/cleanup');
  return response.data;
};
