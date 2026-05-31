import React, { useState } from 'react';
import { User, Camera } from 'lucide-react';
import { getAvatarUrl } from '../../../config/api';
import * as authApi from '../../auth/api/auth.api';
import CloudinaryService from '../../../services/CloudinaryService';

const SettingsProfileTab = ({ 
  formData, 
  setFormData, 
  isEditing, 
  setIsEditing, 
  currentUser, 
  setCurrentUser, 
  t, 
  showToast,
  currentLanguage
}) => {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarInputKey, setAvatarInputKey] = useState(0);

  const setAvatarMessage = (msg) => { 
    if (msg) showToast(msg, msg.toLowerCase().includes('fail') ? 'error' : 'success'); 
  };

  const handleCancel = () => {
    setFormData({
      ...formData,
      name: currentUser?.fullName || currentUser?.name || '',
      username: currentUser?.username || '',
      bio: currentUser?.bio || '',
      website: currentUser?.website || '',
      gender: currentUser?.gender || '',
      birthday: currentUser?.birthday || '',
      phone: currentUser?.phone || '',
      language: currentLanguage
    });
    setIsEditing(true);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <User className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">
          {t('profile')}
        </h2>
        </div>
        {!isEditing && (
          <button
            onClick={() => handleCancel()}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {t('edit')}
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img
              src={getAvatarUrl(currentUser?.avatarUrl || currentUser?.avatar, 'user')}
              alt={currentUser?.fullName || currentUser?.name || 'User'}
              className="w-20 h-20 rounded-full object-cover bg-gray-200"
              onError={(e) => {
                e.target.src = getAvatarUrl(null, 'user');
              }}
            />
            <label className="absolute bottom-0 right-0 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors cursor-pointer">
              <Camera className="w-4 h-4" />
              <input
                key={avatarInputKey}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (!file) return;
                  try {
                    setIsUploadingAvatar(true);
                    setAvatarMessage('');
                    const { valid, error } = CloudinaryService.validateFile(file);
                    if (!valid) {
                      setAvatarMessage(error || 'Invalid file');
                      return;
                    }
                    const result = await CloudinaryService.uploadFile(file);
                    if (!result.success) {
                      throw new Error(result.error || 'Upload failed');
                    }
                    const url = result.data.url;
                    const res = await authApi.updateAvatar(url);
                    if (res.success) {
                      setCurrentUser({
                        ...currentUser,
                        avatarUrl: url
                      });
                      setAvatarMessage(t('saved') || 'Saved');
                    } else {
                      setAvatarMessage(res.message || 'Failed');
                    }
                  } catch (err) {
                    setAvatarMessage(err.message || 'Upload failed');
                  } finally {
                    setIsUploadingAvatar(false);
                    setAvatarInputKey((k) => k + 1);
                  }
                }}
              />
            </label>
          </div>
          <div className="flex-1 space-y-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 {t('fullName')}
               </label>
              <input
                type="text"
                value={isEditing ? formData.name : (currentUser?.fullName || currentUser?.name || '')}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('bio')}
              </label>
              <textarea
                rows="2"
                value={isEditing ? (formData.bio || '') : (currentUser?.bio || '')}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                placeholder={t('bioPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('phone') || 'Số điện thoại'}</label>
                <input
                  type="tel"
                  value={isEditing ? (formData.phone || '') : (currentUser?.phone || '')}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder={t('phonePlaceholder') || '+84 912 345 678'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('website')}</label>
                <input
                  type="text"
                  value={isEditing ? (formData.website || '') : (currentUser?.website || '')}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  disabled={!isEditing}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('gender')}</label>
                <select
                  value={isEditing ? (formData.gender || '') : (currentUser?.gender || '')}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:opacity-50"
                >
                  <option value="">{t('genderOther')}</option>
                  <option value="Male">{t('male')}</option>
                  <option value="Female">{t('female')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('birthday')}</label>
                <input
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  value={isEditing ? (formData.birthday || '') : (currentUser?.birthday || '')}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
               {t('email')}
             </label>
            <input
              type="email"
              value={currentUser?.email || 'Not provided'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
               {t('userID')}
             </label>
            <input
              type="text"
              value={currentUser?.id || 'N/A'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
               {t('role')}
             </label>
            <input
              type="text"
              value={currentUser?.role || 'N/A'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
               {t('locale')}
             </label>
            <input
              type="text"
              value={currentUser?.locale || 'N/A'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
               {t('createdAt')}
             </label>
            <input
              type="text"
              value={currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
          
          <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
               {t('lastUpdated')}
             </label>
            <input
              type="text"
              value={currentUser?.updatedAt ? new Date(currentUser.updatedAt).toLocaleDateString() : 'N/A'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsProfileTab;
