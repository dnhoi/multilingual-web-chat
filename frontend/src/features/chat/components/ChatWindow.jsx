import { Suspense, lazy, useState } from 'react';
import { Phone, Video, Settings, Flag } from 'lucide-react';
import { getAvatarUrl } from '../../../config/api';
import webSocketService from '../../../services/WebSocketService';
import * as settingsApi from '../../settings/api/settings.api';
import { useToast } from '../../../contexts/ToastContext';
import ReportMessageModal from './ReportMessageModal';

const ChatMessages = lazy(() => import('./ChatMessages'));
const MessageInput = lazy(() => import('./MessageInput'));

const ChatWindow = ({
  selectedConversation,
  getOtherParticipantOnlineStatus,
  t,
  handleStartCall,
  toggleInfoPanel,
  showInfoPanel,
  replyMessage,
  setReplyMessage,
  handleSendMessage
}) => {
  const { showToast } = useToast();
  const [showReportModal, setShowReportModal] = useState(false);
  const [userReportReason, setUserReportReason] = useState('');
  const [isSubmittingUserReport, setIsSubmittingUserReport] = useState(false);

  const handleUserReportSubmit = async () => {
    if (!userReportReason.trim()) return;
    setIsSubmittingUserReport(true);
    try {
      const targetName = selectedConversation.type === 'group'
        ? (selectedConversation.name || 'Group Chat')
        : (selectedConversation.participants?.[0]?.fullName || selectedConversation.participants?.[0]?.username || 'Direct User');
      await settingsApi.createReport({
        reportedUser: targetName,
        reason: `[Báo cáo ${selectedConversation.type === 'group' ? 'Nhóm' : 'Người dùng'} #${selectedConversation.conversationId || selectedConversation.id || ''}] - ${userReportReason.trim()}`
      });
      setShowReportModal(false);
      setUserReportReason('');
      showToast('Đã gửi báo cáo đến Quản trị viên thành công!', 'success');
    } catch (err) {
      showToast('Không thể gửi báo cáo: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setIsSubmittingUserReport(false);
    }
  };
  return (
    <div className="flex-1 flex flex-col min-w-0">
      {selectedConversation ? (
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between transition-colors">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={getAvatarUrl(selectedConversation.avatarUrl, selectedConversation.type === 'group' ? 'group' : 'user')}
                alt={selectedConversation.type === 'group' ? selectedConversation.name : 'User'}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20"
                onError={(e) => {
                  e.target.src = getAvatarUrl(null, selectedConversation.type === 'group' ? 'group' : 'user');
                }}
              />
              {selectedConversation.type !== 'group' && !selectedConversation.isGroup && (
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
                  getOtherParticipantOnlineStatus(selectedConversation) ? 'bg-emerald-500' : 'bg-gray-400'
                }`}></div>
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
                {selectedConversation.type === 'group' 
                  ? selectedConversation.name 
                  : (selectedConversation.participants?.[0]?.fullName || 'Direct Message')
                }
              </h2>
              {selectedConversation.type !== 'group' && !selectedConversation.isGroup && (
                <p className={`text-xs font-medium ${
                  getOtherParticipantOnlineStatus(selectedConversation) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-zinc-400'
                }`}>
                  {getOtherParticipantOnlineStatus(selectedConversation) ? t('online') : t('offline')}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleStartCall('voice')}
              className="p-2 text-gray-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              title="Gọi thoại (Voice Call)"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleStartCall('video')}
              className="p-2 text-gray-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              title="Gọi Video (Video Call)"
            >
              <Video className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowReportModal(true)}
              className="p-2 text-gray-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              title="Báo cáo người dùng / cuộc trò chuyện này"
            >
              <Flag className="w-5 h-5" />
            </button>
            
            <button
              onClick={toggleInfoPanel}
              className={`p-2 rounded-xl transition-all duration-200 ${
                showInfoPanel 
                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400 ring-1 ring-blue-500/30' 
                  : 'text-gray-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
              title={showInfoPanel ? "Đóng thông tin & cài đặt nhóm" : "Mở thông tin & cài đặt nhóm"}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 py-6 flex items-center justify-center">
          <p className="text-gray-500 dark:text-zinc-400 text-sm">{t('selectConversationToStart')}</p>
        </div>
      )}

      <Suspense fallback={<div className="flex-1 bg-gray-200 animate-pulse"></div>}>
        <ChatMessages
          selectedConversation={selectedConversation}
          onReplyMessage={(msg) => setReplyMessage(msg)}
        />
      </Suspense>

      <Suspense fallback={<div className="h-16 bg-gray-200 animate-pulse"></div>}>
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!selectedConversation}
          replyMessage={replyMessage}
          onCancelReply={() => setReplyMessage(null)}
          onTyping={() => {
            if (selectedConversation) {
              const cid = selectedConversation.conversationId || selectedConversation.id;
              webSocketService.sendTyping(cid);
            }
          }}
        />
      </Suspense>

      {showReportModal && selectedConversation && (
        <ReportMessageModal
          reportingUser={{
            fullName: selectedConversation.type === 'group'
              ? (selectedConversation.name || 'Group Chat')
              : (selectedConversation.participants?.[0]?.fullName || selectedConversation.participants?.[0]?.username || 'Người dùng'),
            username: selectedConversation.type === 'group' ? 'Group' : selectedConversation.participants?.[0]?.username
          }}
          setReportingUser={() => setShowReportModal(false)}
          reportReason={userReportReason}
          setReportReason={setUserReportReason}
          isSubmittingReport={isSubmittingUserReport}
          handleSubmitReport={handleUserReportSubmit}
        />
      )}
    </div>
  );
};

export default ChatWindow;
