import axiosClient from '../../../core/api/axiosClient';
import tokenService from '../../../core/utils/token';

/**
 * Authentication and User Profile APIs
 */

export const login = async (username, password) => {
  const response = await axiosClient.post('/identify/auth', { username, password });
  const data = response.data;
  
  if (data.result?.authenticated && data.result?.token) {
    tokenService.setToken(data.result.token);
    axiosClient.defaults.headers.common['Authorization'] = `Bearer ${data.result.token}`;
  }
  return data;
};

export const register = async (username, email, password, fullName) => {
  const response = await axiosClient.post('/identify/users', { username, email, password, fullName });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axiosClient.get('/identify/users');
  return response.data;
};

export const getUserById = async (userId) => {
  const response = await axiosClient.get(`/identify/users/${userId}`);
  return response.data;
};

export const getAllUsers = async () => {
  const response = await axiosClient.get('/identify/users/all');
  return response.data;
};

export const updatePassword = async (password, newPassword) => {
  const response = await axiosClient.put('/identify/users/update-password', { password, newPassword });
  return response.data;
};

export const updateUser = async (updateData) => {
  const payload = typeof updateData === 'object' ? updateData : { fullName: updateData };
  const response = await axiosClient.put('/identify/users', payload);
  return response.data;
};

export const updateAvatar = async (avatarUrl) => {
  const response = await axiosClient.put('/identify/users/avatar', { url: avatarUrl });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await axiosClient.post('/identify/auth/forgot-password', { email }, {
    headers: { Authorization: '' }
  });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await axiosClient.post('/identify/auth/reset-password', { token, newPassword });
  return response.data;
};

export const findUser = async (request) => {
  const response = await axiosClient.post('/identify/users/find-user', null, { params: { request } });
  return response.data;
};

export const getAuthToken = () => {
  return tokenService.getToken();
};

export const setAuthToken = (token) => {
  tokenService.setToken(token);
  axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const logout = () => {
  tokenService.removeToken();
  delete axiosClient.defaults.headers.common['Authorization'];
};
