import { Bell } from 'lucide-react';

export default function NotificationSettings({ formData, handleNotificationChange, t }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Bell className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          {t('notifications')}
        </h2>
      </div>

      <div className="space-y-4">
        {[
           { key: 'messages', label: t('newMessages'), description: t('newMessagesDesc') },
           { key: 'mentions', label: t('mentions'), description: t('mentionsDesc') },
           { key: 'groupUpdates', label: t('groupUpdates'), description: t('groupUpdatesDesc') },
           { key: 'sound', label: t('soundNotification'), description: t('soundNotificationDesc') },
           { key: 'dnd', label: t('dndMode'), description: t('dndModeDesc') },
           { key: 'preview', label: t('previewMessage'), description: t('previewMessageDesc') }
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">{item.label}</h3>
              <p className="text-sm text-gray-500">{item.description}</p>
            </div>
            <button
              onClick={() => handleNotificationChange(item.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.notifications[item.key] ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
