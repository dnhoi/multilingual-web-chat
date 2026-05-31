import React from 'react';
import { Shield, Mail, Smartphone, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SettingsAccountTab = ({
  currentUser,
  setShowPasswordModal,
  setShowEmailModal,
  setNewEmailInput,
  fetchActiveSessions,
  setShowSessionsModal,
  handleLogout,
  t
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {t('accountActions')}
      </h2>

      <div className="space-y-3">
        <button 
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Shield className="w-5 h-5" />
          <span>{t('changePassword')}</span>
        </button>
        
        {(currentUser?.role?.toUpperCase() === 'ADMIN' || currentUser?.role?.toUpperCase() === 'SYSTEM_ADMIN' || currentUser?.role?.toUpperCase() === 'ROLE_ADMIN') && (
          <button 
            onClick={() => navigate('/admin')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-left text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium"
          >
            <Shield className="w-5 h-5 text-blue-600" />
            <span>{t('adminDashboard') || 'Admin Dashboard'}</span>
          </button>
        )}
        
        <button 
          onClick={() => {
            setNewEmailInput(currentUser?.email || '');
            setShowEmailModal(true);
          }}
          className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Mail className="w-5 h-5" />
          <span>{t('changeEmail') || 'Change Email'}</span>
        </button>
        
        <button 
          onClick={() => {
            fetchActiveSessions();
            setShowSessionsModal(true);
          }}
          className="w-full flex items-center space-x-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Smartphone className="w-5 h-5" />
          <span>{t('manageDevices') || 'Quản lý Thiết bị (Sessions)'}</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsAccountTab;
