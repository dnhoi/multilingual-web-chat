import React from 'react';
import { HardDrive } from 'lucide-react';

const SettingsStorageTab = ({ formData, handlePrivacyChange, t }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-3 mb-6">
        <HardDrive className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          {t('storageAndData')}
        </h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">{t('autoDownloadMedia')}</h3>
            <p className="text-sm text-gray-500">{t('autoDownloadMediaDesc')}</p>
          </div>
          <button
            onClick={() => handlePrivacyChange('autoDownload')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.privacy.autoDownload !== false ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.privacy.autoDownload !== false ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsStorageTab;
