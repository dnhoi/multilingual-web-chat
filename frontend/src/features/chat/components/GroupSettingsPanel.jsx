import React from 'react';
import { Globe } from 'lucide-react';
import AILanguageSelector from '../../../components/common/AILanguageSelector';

const GroupSettingsPanel = ({
  selectedConversation,
  isOwnerOrAdmin,
  groupLocale,
  handleGroupLocaleChange,
  t
}) => {
  if (!(selectedConversation.type === 'group' || selectedConversation.isGroup)) {
    return null;
  }

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/60">
      <Globe className="w-4 h-4 text-blue-500" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {t ? t('groupAITranslationLanguage') : 'Ngôn ngữ dịch AI của Nhóm'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isOwnerOrAdmin ? (groupLocale || 'EN') : (t ? t('adminOnlySettings') : '🔒 Chỉ Admin nhóm mới có quyền đổi')}
        </p>
      </div>
      {isOwnerOrAdmin ? (
        <div className="w-32">
          <AILanguageSelector
            selectedLanguage={groupLocale}
            onLanguageChange={handleGroupLocaleChange}
            className="w-full"
          />
        </div>
      ) : (
        <span className="text-xs font-semibold px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md border border-gray-300 dark:border-gray-600">
          🔒 {groupLocale || 'EN'}
        </span>
      )}
    </div>
  );
};

export default GroupSettingsPanel;
