import React from 'react';
import { Globe } from 'lucide-react';
import AILanguageSelector from '../../../components/common/AILanguageSelector';
import * as authApi from '../../auth/api/auth.api';

const SettingsLanguageTab = ({
  formData,
  setFormData,
  currentLanguage,
  handleLanguageChange,
  currentUser,
  setCurrentUser,
  t,
  showToast
}) => {
  const setAiLocaleMessage = (msg) => { 
    if (msg) showToast(msg, msg.toLowerCase().includes('fail') ? 'error' : 'success'); 
  };

  const handleUpdateLocale = async (languageCode) => {
    const selected = (languageCode || 'EN').toUpperCase();
    const normalized = selected;
    try {
      setAiLocaleMessage('');
      const res = await authApi.updateUser({ fullName: currentUser?.fullName || '', email: currentUser?.email || '', locale: normalized });
      if (res?.data) {
        setCurrentUser({
          ...currentUser,
          ...res.data,
          id: res.data.userId || currentUser?.id
        });
      }
      setAiLocaleMessage(t('saved') || 'Saved');
    } catch (e) {
      setAiLocaleMessage(e.message || 'Failed');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Globe className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          {t('languageAndAI')}
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t('interfaceLanguage')}
          </label>
          <div className="space-y-2">
            {[
              { code: 'en', name: 'English' },
              { code: 'vi', name: 'Tiếng Việt' },
              { code: 'es', name: 'Español' }
            ].map((language) => (
              <label key={language.code} className="flex items-center">
                <input
                  type="radio"
                  name="language"
                  value={language.code}
                  checked={currentLanguage === language.code}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700">
                  {language.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('aiTranslationLanguage')}
          </label>
          <div className="relative">
            <AILanguageSelector
              selectedLanguage={formData.aiLanguage}
              onLanguageChange={async (lang) => {
                setFormData({ ...formData, aiLanguage: lang });
                await handleUpdateLocale(lang);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLanguageTab;
