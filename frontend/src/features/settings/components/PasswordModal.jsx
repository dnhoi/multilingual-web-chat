import { useState } from 'react';
import * as authApi from '../../auth/api/auth.api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function PasswordModal({ 
  formData, setFormData, 
  setShowPasswordModal, 
  t 
}) {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const isGoogleUser = Boolean(currentUser?.googleId);

  const handleSubmit = async () => {
    if (isChangingPassword) return;
    if (!isGoogleUser && !formData.currentPassword?.trim()) {
      showToast(t('enterCurrentPasswordRequired') || 'Vui lòng nhập mật khẩu hiện tại', 'error');
      return;
    }
    if (!formData.newPassword) return;
    if (formData.newPassword !== formData.confirmNewPassword) {
      showToast(t('passwordsDoNotMatch') || 'Passwords do not match', 'error');
      return;
    }
    
    if (formData.newPassword.length < 8) {
      showToast(t('passwordTooShort') || 'Password must be at least 8 characters', 'error');
      return;
    }
    
    const hasUpper = /[A-Z]/.test(formData.newPassword);
    const hasLower = /[a-z]/.test(formData.newPassword);
    const hasNumber = /\d/.test(formData.newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(formData.newPassword);
    
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      showToast(t('passwordRequirements') || 'Password must contain uppercase, lowercase, number, and special character (e.g. TestPass123!)', 'error');
      return;
    }
    try {
      setIsChangingPassword(true);
      const res = await authApi.updatePassword(formData.currentPassword || '', formData.newPassword);
      const msg = res?.message || '';
      if (res?.success) {
        showToast(msg || 'Change password successfully', 'success');
        setFormData({ ...formData, currentPassword: '', newPassword: '', confirmNewPassword: '' });
        setTimeout(() => {
          setShowPasswordModal(false);
        }, 1200);
      } else {
        showToast(msg || 'Failed to change password', 'error');
      }
    } catch (e) {
      const errorMsg = e.response?.data?.message || e.message || 'Failed to change password';
      showToast(errorMsg, 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const isFormValid = (isGoogleUser || Boolean(formData.currentPassword)) &&
    Boolean(formData.newPassword) &&
    Boolean(formData.confirmNewPassword) &&
    formData.newPassword === formData.confirmNewPassword &&
    !isChangingPassword;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
           <h3 className="text-lg font-semibold text-gray-900">{t('changePassword')}</h3>
           <p className="text-sm text-gray-600 mt-1">{t('enterCurrentPasswordAndNew')}</p>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('currentPassword')} {isGoogleUser && <span className="text-xs text-blue-600 font-normal">(Tài khoản Google: không bắt buộc)</span>}
            </label>
            <input
              type="password"
              placeholder={isGoogleUser ? "Tài khoản Google không cần nhập MK cũ" : t('enterCurrentPassword')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.currentPassword || ''}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('newPassword')}
            </label>
            <input
              type="password"
              placeholder={t('enterNewPassword')}
              minLength="8"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.newPassword || ''}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('confirmNewPassword')}
            </label>
            <input
              type="password"
              placeholder={t('confirmNewPasswordPlaceholder')}
              minLength="8"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.confirmNewPassword || ''}
              onChange={(e) => setFormData({ ...formData, confirmNewPassword: e.target.value })}
            />
            {formData.newPassword && formData.confirmNewPassword && formData.newPassword !== formData.confirmNewPassword && (
              <p className="text-xs text-red-600 mt-1">{t('passwordsDoNotMatch')}</p>
            )}

          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
          <button
            onClick={() => setShowPasswordModal(false)}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            disabled={!isFormValid}
            onClick={handleSubmit}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
              isFormValid
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-gray-300 cursor-not-allowed'
            } ${isChangingPassword ? 'cursor-wait' : ''}`}
          >
            {t('changePassword')}
          </button>
        </div>
      </div>
    </div>
  );
}
