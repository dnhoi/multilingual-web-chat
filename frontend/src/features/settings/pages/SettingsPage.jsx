import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, LogOut, Save, X, Bell, Shield, Palette, Globe, User, Mail, Smartphone, HardDrive } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import AILanguageSelector from '../../../components/common/AILanguageSelector';
import { getAvatarUrl } from '../../../config/api';
import * as authApi from '../../../features/auth/api/auth.api';
import * as settingsApi from '../../../features/settings/api/settings.api';
import { useToast } from '../../../contexts/ToastContext';

import NotificationSettings from '../components/NotificationSettings';
import PrivacySettings from '../components/PrivacySettings';
import PasswordModal from '../components/PasswordModal';
import EmailModal from '../components/EmailModal';
import SessionManagerModal from '../components/SessionManagerModal';
import SettingsProfileTab from '../components/SettingsProfileTab';
import SettingsLanguageTab from '../components/SettingsLanguageTab';
import SettingsStorageTab from '../components/SettingsStorageTab';
import SettingsAccountTab from '../components/SettingsAccountTab';

const SettingsPage = () => {
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const emailMessage = '';
  const emailMessageType = null;
  const setEmailMessageType = () => {};
  const setEmailMessage = (msg) => { if (msg) showToast(msg, msg.toLowerCase().includes('lỗi') || msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('vui lòng') ? 'error' : 'success'); };
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  
  const getInitialNotifications = () => {
    try {
      const saved = localStorage.getItem('app_notifications');
      return saved ? JSON.parse(saved) : {
        messages: true,
        mentions: true,
        groupUpdates: false,
        sound: true,
        dnd: false,
        preview: true
      };
    } catch (e) {
      return { messages: true, mentions: true, groupUpdates: false, sound: true, dnd: false, preview: true };
    }
  };

  const getInitialPrivacy = () => {
    try {
      const saved = localStorage.getItem('app_privacy');
      return saved ? JSON.parse(saved) : {
        showOnlineStatus: true,
        showLastSeen: true,
        allowGroupInvites: true,
        readReceipts: true,
        phoneVisibility: true,
        autoDownload: true
      };
    } catch (e) {
      return { showOnlineStatus: true, showLastSeen: true, allowGroupInvites: true, readReceipts: true, phoneVisibility: true, autoDownload: true };
    }
  };

  const { currentUser, logout, setCurrentUser } = useAuth();
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const saveMessage = '';
  const saveStatus = null;
  const setSaveStatus = () => {};
  const setSaveMessage = (msg) => { if (msg) showToast(msg, msg.toLowerCase().includes('fail') ? 'error' : 'success'); };


  const [formData, setFormData] = useState({
    name: currentUser?.fullName || currentUser?.name || '',
    username: currentUser?.username || '',
    bio: currentUser?.bio || '',
    website: currentUser?.website || '',
    gender: currentUser?.gender || '',
    birthday: currentUser?.birthday || '',
    phone: currentUser?.phone || '',
    language: currentLanguage || 'en',
    aiLanguage: (currentUser?.locale || 'EN').toUpperCase(),
    notifications: getInitialNotifications(),
    privacy: getInitialPrivacy(),
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.fullName || currentUser.name || '',
        username: currentUser.username || '',
        bio: currentUser.bio || '',
        website: currentUser.website || '',
        gender: currentUser.gender || '',
        birthday: currentUser.birthday || '',
        phone: currentUser.phone || '',
        aiLanguage: (currentUser.locale || 'EN').toUpperCase()
      }));
    }
  }, [currentUser]);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const passwordMessage = '';
  const passwordMessageType = null;
  const setPasswordMessageType = () => {};
  const setPasswordMessage = (msg) => { if (msg) showToast(msg, msg.toLowerCase().includes('lỗi') || msg.toLowerCase().includes('fail') || msg.toLowerCase().includes('không') ? 'error' : 'success'); };

  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [isFetchingSessions, setIsFetchingSessions] = useState(false);
  const sessionsError = '';
  const setSessionsError = (msg) => { if (msg) showToast(msg, 'error'); };


  const fetchActiveSessions = async () => {
    try {
      setIsFetchingSessions(true);
      setSessionsError('');
      const res = await settingsApi.getActiveSessions();
      if (res?.data) {
        setActiveSessions(res.data);
      } else if (res?.result) {
        setActiveSessions(res.result);
      }
    } catch (err) {
      setSessionsError(err.message || 'Failed to fetch sessions');
    } finally {
      setIsFetchingSessions(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      const res = await settingsApi.revokeSession(sessionId);
      if (res?.success || res?.code === 200 || res?.message?.includes('success') || res?.message?.includes('successfully')) {
        showToast('Đã thu hồi phiên đăng nhập thành công!', 'success');
        fetchActiveSessions();
      } else {
        showToast(res?.message || 'Không thể thu hồi phiên đăng nhập', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Không thể thu hồi phiên đăng nhập', 'error');
    }
  };


  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSave = async () => {
    try {
      setSaveMessage('');
      setSaveStatus(null);
      
      if (formData.phone && formData.phone.trim()) {
        const phoneRegex = /^[+0-9\s.-]{8,20}$/;
        if (!phoneRegex.test(formData.phone.trim())) {
          showToast(t('invalidPhoneFormat') || 'Số điện thoại không hợp lệ (từ 8-20 chữ số)', 'error');
          return;
        }
      }

      const locale = (formData.aiLanguage || currentUser?.locale || 'EN').toUpperCase();
      const fullName = formData.name?.trim() || currentUser?.fullName || '';
      const payload = {
        fullName,
        locale,
        bio: formData.bio || '',
        website: formData.website || '',
        gender: formData.gender || '',
        birthday: formData.birthday || '',
        phone: formData.phone?.trim() || ''
      };
      const res = await authApi.updateUser(payload);
      if (res?.data) {
        setCurrentUser({
          ...currentUser,
          fullName: res.data.fullName,
          locale: res.data.locale,
          avatarUrl: res.data.avatarUrl,
          username: res.data.username,
          email: res.data.email,
          phone: res.data.phone,
          bio: res.data.bio,
          website: res.data.website,
          gender: res.data.gender,
          birthday: res.data.birthday,
          id: res.data.userId || currentUser?.id
        });
      }
      setSaveStatus('success');
      setSaveMessage(t('saved') || 'Saved');
      setIsEditing(false);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      setSaveStatus('error');
      setSaveMessage(e.message || 'Failed to save changes');
    }
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
      language: currentLanguage
    });
    setIsEditing(false);
  };

  const handleLanguageChange = (language) => {
    setFormData({ ...formData, language });
    changeLanguage(language);
  };

  const handleNotificationChange = (key) => {
    const updated = {
      ...formData.notifications,
      [key]: !formData.notifications[key]
    };
    setFormData({
      ...formData,
      notifications: updated
    });
    localStorage.setItem('app_notifications', JSON.stringify(updated));
    setSaveStatus('success');
    setSaveMessage(t('saved') || 'Saved');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  const handlePrivacyChange = (key) => {
    const updated = {
      ...formData.privacy,
      [key]: !formData.privacy[key]
    };
    setFormData({
      ...formData,
      privacy: updated
    });
    localStorage.setItem('app_privacy', JSON.stringify(updated));
    setSaveStatus('success');
    setSaveMessage(t('saved') || 'Saved');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 selection:bg-blue-600 selection:text-white transition-colors">
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 px-6 py-3.5 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/chat')}
              className="p-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all border border-gray-200 dark:border-zinc-700"
              title="Về Trang Chat"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
              {t('settings')}
            </h1>
          </div>
          
          {isEditing && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancel}
                className="p-2 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors border border-gray-200 dark:border-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs hover:shadow-md transition-all font-medium text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{t('save')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">


        <SettingsProfileTab
          formData={formData}
          setFormData={setFormData}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          t={t}
          showToast={showToast}
          currentLanguage={currentLanguage}
        />

        <SettingsLanguageTab
          formData={formData}
          setFormData={setFormData}
          currentLanguage={currentLanguage}
          handleLanguageChange={handleLanguageChange}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          t={t}
          showToast={showToast}
        />

        <NotificationSettings formData={formData} handleNotificationChange={handleNotificationChange} t={t} />

        <PrivacySettings formData={formData} handlePrivacyChange={handlePrivacyChange} t={t} />

        <SettingsStorageTab formData={formData} handlePrivacyChange={handlePrivacyChange} t={t} />

        <SettingsAccountTab
          currentUser={currentUser}
          setShowPasswordModal={setShowPasswordModal}
          setShowEmailModal={setShowEmailModal}
          setNewEmailInput={setNewEmailInput}
          fetchActiveSessions={fetchActiveSessions}
          setShowSessionsModal={setShowSessionsModal}
          handleLogout={handleLogout}
          t={t}
        />
      </div>

      <EmailModal 
        showEmailModal={showEmailModal} 
        setShowEmailModal={setShowEmailModal} 
        newEmailInput={newEmailInput} 
        setNewEmailInput={setNewEmailInput} 
        t={t} 
      />

      <SessionManagerModal 
        showSessionsModal={showSessionsModal} 
        setShowSessionsModal={setShowSessionsModal} 
        isFetchingSessions={isFetchingSessions} 
        sessionsError={sessionsError} 
        activeSessions={activeSessions} 
        handleRevokeSession={handleRevokeSession} 
        t={t}
      />

      {showPasswordModal && (
        <PasswordModal 
          formData={formData} 
          setFormData={setFormData} 
          setShowPasswordModal={setShowPasswordModal} 
          t={t} 
        />
      )}
    </div>
  );
};

export default SettingsPage;
