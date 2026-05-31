import { X, Smartphone } from 'lucide-react';

export default function SessionManagerModal({ 
  showSessionsModal, 
  setShowSessionsModal, 
  isFetchingSessions, 
  sessionsError, 
  activeSessions, 
  handleRevokeSession,
  t
}) {
  if (!showSessionsModal) return null;

  const tr = (key, fallback) => (t ? t(key) : fallback) || fallback;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
           <div>
             <h3 className="text-lg font-bold text-gray-900">
               {tr('manageDevicesTitle', 'Quản lý Thiết bị')}
             </h3>
             <p className="text-xs text-gray-500 mt-0.5">
               {tr('manageDevicesSubtitle', 'Các thiết bị đang hoạt động trên tài khoản của bạn')}
             </p>
           </div>
           <button 
             onClick={() => setShowSessionsModal(false)}
             className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
        </div>
        
        <div className="px-6 py-4 max-h-[350px] overflow-y-auto space-y-4">
          {isFetchingSessions ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-xs text-gray-500 mt-2">Loading...</p>
            </div>
          ) : sessionsError ? (
            <p className="text-sm text-red-500 text-center py-4">{sessionsError}</p>
          ) : activeSessions.length <= 1 ? (
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-2 uppercase">{tr('currentDevice', 'Thiết bị hiện tại')}</p>
              {activeSessions.map((session) => (
                <div key={session.sessionId} className="py-2 flex items-start space-x-3">
                  <div className="p-2 bg-blue-50 rounded-xl text-blue-600 mt-0.5">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-955">
                      {session.deviceInfo || tr('thisDevice', 'Thiết bị này')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      IP: {session.ipAddress} • {new Date(session.lastActive).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <p className="text-sm text-gray-500 text-center py-4 mt-2">{tr('noOtherDevices', 'Không có thiết bị hoạt động nào khác.')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 font-semibold uppercase">{tr('deviceList', 'Danh sách thiết bị')}</p>
              <div className="divide-y divide-gray-100">
                {activeSessions.map((session) => {
                  const isCurrent = session.deviceInfo?.includes('Current') || activeSessions[0]?.sessionId === session.sessionId;
                  return (
                    <div key={session.sessionId} className="py-3 flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600 mt-0.5">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-955 flex items-center gap-1.5">
                            {session.deviceInfo || tr('unknownDevice', 'Thiết bị không xác định')}
                            {isCurrent && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-800">
                                {tr('currentDevice', 'Hiện tại')}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            IP: {session.ipAddress} • {new Date(session.lastActive).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(session.sessionId)}
                          className="px-2.5 py-1 text-xs text-red-600 hover:text-white border border-red-200 hover:border-red-600 hover:bg-red-600 rounded-lg transition-all font-medium"
                        >
                          {tr('logoutDevice', 'Đăng xuất')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={() => setShowSessionsModal(false)}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm transition-colors"
          >
            {tr('close', 'Đóng')}
          </button>
        </div>
      </div>
    </div>
  );
}
