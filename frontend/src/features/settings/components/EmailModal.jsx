import { useState } from 'react';
import * as authApi from '../../auth/api/auth.api';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function EmailModal({ 
  showEmailModal, 
  setShowEmailModal, 
  newEmailInput, 
  setNewEmailInput, 
  t 
}) {
  const { currentUser, setCurrentUser } = useAuth();
  const { showToast } = useToast();
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const handleSubmit = async () => {
    if (!newEmailInput || !newEmailInput.includes('@')) {
      showToast('Vui lòng nhập địa chỉ email hợp lệ', 'error');
      return;
    }
    try {
      setIsChangingEmail(true);
      const res = await authApi.updateUser({
        fullName: currentUser?.fullName || '',
        email: newEmailInput.trim()
      });
      if (res?.data) {
        setCurrentUser({
          ...currentUser,
          email: res.data.email || newEmailInput.trim()
        });
        showToast('Đã cập nhật email mới thành công!', 'success');
        setTimeout(() => {
          setShowEmailModal(false);
          setNewEmailInput('');
        }, 1200);
      } else {
        showToast('Không thể cập nhật email', 'error');
      }
    } catch (e) {
      showToast(e.message || 'Lỗi khi cập nhật email', 'error');
    } finally {
      setIsChangingEmail(false);
    }
  };

  if (!showEmailModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
           <h3 className="text-lg font-semibold text-gray-900">{t('changeEmail') || 'Change Email'}</h3>
           <p className="text-sm text-gray-600 mt-1">Nhập địa chỉ Email mới của bạn</p>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email hiện tại
            </label>
            <input
              type="text"
              disabled
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg text-sm"
              value={currentUser?.email || 'Chưa cập nhật'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email mới
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-gray-900"
              value={newEmailInput}
              onChange={(e) => setNewEmailInput(e.target.value)}
            />
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex space-x-3">
          <button
            onClick={() => setShowEmailModal(false)}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            {t('cancel')}
          </button>
          <button
            disabled={isChangingEmail || !newEmailInput || newEmailInput === currentUser?.email}
            onClick={handleSubmit}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium ${
              newEmailInput && newEmailInput !== currentUser?.email && !isChangingEmail
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isChangingEmail ? 'Saving…' : (t('save') || 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
}
