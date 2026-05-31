import { Shield } from 'lucide-react';

export default function PrivacySettings({ formData, handlePrivacyChange, t }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          {t('privacy')}
        </h2>
      </div>

      <div className="space-y-4">
        {[
           { key: 'showOnlineStatus', label: t('showOnlineStatus'), description: t('showOnlineStatusDesc') },
           { key: 'showLastSeen', label: t('showLastSeen'), description: t('showLastSeenDesc') },
           { key: 'allowGroupInvites', label: t('allowGroupInvites'), description: t('allowGroupInvitesDesc') },
           { key: 'readReceipts', label: t('readReceipts'), description: t('readReceiptsDesc') },
           { key: 'phoneVisibility', label: t('showPhoneNumber'), description: t('showPhoneNumberDesc') }
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">{item.label}</h3>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <button
              onClick={() => handlePrivacyChange(item.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.privacy[item.key] ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.privacy[item.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
