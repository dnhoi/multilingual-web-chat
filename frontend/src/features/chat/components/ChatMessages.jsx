import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, FileText, Search, X, MapPin, BarChart2, Phone, PhoneOff, PhoneMissed, Video, Flag } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import * as chatApi from '../api/chat.api';
import * as settingsApi from '../../settings/api/settings.api';
import { API_CONFIG, getAvatarUrl } from '../../../config/api';
import webSocketService from '../../../services/WebSocketService';
import MessageItem from './MessageItem';
import ImagePreviewModal from './ImagePreviewModal';
import ReportMessageModal from './ReportMessageModal';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import PollCard from './PollCard';
import { useChatMessages } from './useChatMessages';
import MessageAttachment from './MessageAttachment';
import { formatTime, formatDateSeparator, shouldShowDateSeparator } from '../../../utils/chatUtils';

const ChatMessages = ({ selectedConversation, onReplyMessage }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  const {
    messages,
    isLoading,
    error,
    hasMore,
    isLoadingMore,
    typingUser,
    messagesEndRef,
    chatContainerRef,
    handleScroll,
    fetchMessages,
    setMessages
  } = useChatMessages(selectedConversation, currentUser);

  const [selectedImage, setSelectedImage] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [showReactionPickerId, setShowReactionPickerId] = useState(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportingMessage, setReportingMessage] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ isOpen: false, messageId: null });

  const getSenderName = useCallback((senderId) => {
    if (!selectedConversation) return t('unknownUser');
    if (selectedConversation.participants) {
      const participant = selectedConversation.participants.find(p => 
        p.userId === senderId || p.id === senderId
      );
      if (participant) {
        return participant.fullName || participant.name || participant.username || t('unknownUser');
      }
    }
    
    if (senderId === currentUser?.id || senderId === currentUser?.userId) {
      return currentUser.fullName || currentUser.name || currentUser.username || t('you');
    }
    
    if (selectedConversation.userProfiles) {
      const userProfile = selectedConversation.userProfiles.find(p => 
        p.userId === senderId
      );
      if (userProfile) {
        return userProfile.fullName || t('unknownUser');
      }
    }
    
    return t('unknownUser');
  }, [selectedConversation, currentUser, t]);

  const getSenderAvatar = useCallback((senderId) => {
    if (!selectedConversation) return getAvatarUrl(null, 'user');
    if (selectedConversation.participants) {
      const participant = selectedConversation.participants.find(p => 
        p.userId === senderId || p.id === senderId
      );
      if (participant?.avatarUrl) {
        return getAvatarUrl(participant.avatarUrl, 'user');
      }
    }
    
    if (senderId === currentUser?.id || senderId === currentUser?.userId) {
      return getAvatarUrl(currentUser.avatarUrl || currentUser.avatar, 'user');
    }
    
    if (selectedConversation.userProfiles) {
      const userProfile = selectedConversation.userProfiles.find(p => 
        p.userId === senderId
      );
      if (userProfile?.avatarUrl) {
        return getAvatarUrl(userProfile.avatarUrl, 'user');
      }
    }
    
    return getAvatarUrl(null, 'user');
  }, [selectedConversation, currentUser]);

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('selectConversation')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t('selectConversationToStart')}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">{t('loadingMessages')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-4">
          <p className="text-sm text-red-500 mb-2">{error}</p>
          <button
            onClick={() => {
              const conversationId = selectedConversation.conversationId || selectedConversation.id;
              fetchMessages(conversationId, 0, false);
            }}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  const renderAttachment = (attachment) => {
    return <MessageAttachment attachment={attachment} setSelectedImage={setSelectedImage} t={t} />;
  };



  const handleSaveEdit = (messageId) => {
    if (!editingText.trim()) return;

    // Kiểm tra giới hạn 24 giờ khi chỉnh sửa tin nhắn
    const targetMsg = messages.find(m => String(m.id) === String(messageId));
    if (targetMsg) {
      const rawTime = targetMsg.sentDatetime || targetMsg.timestamp || targetMsg.createdAt;
      if (rawTime) {
        const msgTime = new Date(rawTime).getTime();
        if (!isNaN(msgTime) && Date.now() - msgTime > 24 * 60 * 60 * 1000) {
          showToast(t('cannotEditAfter24h') || "Không thể chỉnh sửa tin nhắn đã gửi quá 24 giờ", 'error');
          setEditingMessageId(null);
          setEditingText('');
          return;
        }
      }
    }

    const cid = selectedConversation.conversationId || selectedConversation.id;

    // Optimistic UI Update: update message in local state immediately
    setMessages(prev => prev.map(m => 
      String(m.id) === String(messageId)
        ? { ...m, originalText: editingText.trim(), isEdited: true }
        : m
    ));

    webSocketService.editMessage(cid, messageId, editingText.trim());
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleDeleteMsg = (message) => {
    // Kiểm tra giới hạn 24 giờ khi thu hồi / xóa tin nhắn
    const rawTime = message.sentDatetime || message.timestamp || message.createdAt;
    if (rawTime) {
      const msgTime = new Date(rawTime).getTime();
      if (!isNaN(msgTime) && Date.now() - msgTime > 24 * 60 * 60 * 1000) {
        showToast(t('cannotDeleteAfter24h') || "Không thể thu hồi/xóa tin nhắn đã gửi quá 24 giờ", 'error');
        return;
      }
    }
    setDeleteConfirmDialog({ isOpen: true, messageId: message.id });
  };

  const handleOptimisticDelete = (messageId) => {
    setMessages(prev => prev.map(m =>
      String(m.id) === String(messageId)
        ? { ...m, originalText: 'Tin nhắn đã bị xóa', isDeleted: true, translatedText: null }
        : m
    ));
  };

  const handleSendReactionEmoji = (message, emoji) => {
    const cid = selectedConversation.conversationId || selectedConversation.id;
    const userId = currentUser?.id || currentUser?.userId || currentUser?.username;

    // Optimistic UI Update: update reactions in local state immediately
    setMessages(prev => prev.map(m => {
      if (String(m.id) !== String(message.id)) return m;
      let existingReactions = m.reactions ? m.reactions.split(';').filter(Boolean) : [];
      const userIndex = existingReactions.findIndex(r => r.startsWith(userId + ':'));
      if (userIndex !== -1) {
        const [, currentEmoji] = existingReactions[userIndex].split(':');
        if (currentEmoji === emoji) {
          existingReactions.splice(userIndex, 1);
        } else {
          existingReactions[userIndex] = `${userId}:${emoji}`;
        }
      } else {
        existingReactions.push(`${userId}:${emoji}`);
      }
      return { ...m, reactions: existingReactions.join(';') };
    }));

    webSocketService.sendReaction(cid, message.id, emoji);
    setShowReactionPickerId(null);
  };

  const handleSubmitReport = async () => {
    if (!reportingMessage || !reportReason.trim()) return;
    setIsSubmittingReport(true);
    try {
      const senderTarget = reportingMessage.senderName || reportingMessage.senderId || 'Unknown User';
      const snippet = reportingMessage.originalText?.substring(0, 100) || reportingMessage.messageText?.substring(0, 100) || '[Đính kèm]';
      await settingsApi.createReport({
        reportedUser: senderTarget,
        reason: `[Tin nhắn #${reportingMessage.id || ''}: "${snippet}"] - ${reportReason.trim()}`
      });
      setReportingMessage(null);
      setReportReason('');
      showToast('Đã gửi báo cáo tin nhắn đến Quản trị viên thành công!', 'success');
    } catch (err) {
      showToast('Không thể gửi báo cáo: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleVote = (message, optionIndex) => {
    let pollData = null;
    try { pollData = JSON.parse(message.originalText || '{}'); } catch { return; }
    if (!pollData?.options) return;
    
    const userId = currentUser?.id || currentUser?.userId || currentUser?.username;
    if (!userId) return;

    let hasChanged = false;
    
    pollData.options.forEach((opt, idx) => {
      opt.voters = opt.voters || [];
      const votedIdx = opt.voters.findIndex(id => String(id).toLowerCase() === String(userId).toLowerCase());
      
      if (idx === optionIndex) {
        if (votedIdx !== -1) {
          // Toggle off
          opt.voters.splice(votedIdx, 1);
          opt.votes = Math.max(0, (opt.votes || 1) - 1);
          hasChanged = true;
        } else {
          // Toggle on
          opt.voters.push(userId);
          opt.votes = (opt.votes || 0) + 1;
          hasChanged = true;
        }
      } else {
        if (votedIdx !== -1) {
          // Remove previous vote from other options
          opt.voters.splice(votedIdx, 1);
          opt.votes = Math.max(0, (opt.votes || 1) - 1);
          hasChanged = true;
        }
      }
    });

    if (hasChanged) {
      const cid = selectedConversation.conversationId || selectedConversation.id;

      // Optimistic UI Update: update poll data in local state immediately
      setMessages(prev => prev.map(m =>
        String(m.id) === String(message.id)
          ? { ...m, originalText: JSON.stringify(pollData) }
          : m
      ));

      webSocketService.editMessage(cid, message.id, JSON.stringify(pollData));
    }
  };

  const renderPollCard = (message) => {
    return <PollCard message={message} handleVote={handleVote} currentUser={currentUser} />;
  };



  const scrollToMessage = (msgId) => {
    const elem = document.getElementById(`msg-item-${msgId}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      elem.classList.add('ring-2', 'ring-amber-500', 'rounded-lg', 'transition-all', 'duration-500');
      setTimeout(() => {
        elem.classList.remove('ring-2', 'ring-amber-500');
      }, 2000);
    }
  };

  return (
    <div 
      ref={chatContainerRef}
      className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 relative" 
      style={{ direction: 'ltr', maxWidth: '100%', overflowX: 'hidden' }}
      onScroll={handleScroll}
    >
      {/* Announcement Banner */}
      {selectedConversation?.announcement && (
        <div className="sticky top-0 z-40 mb-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs rounded-lg px-4 py-2.5 flex items-start space-x-2 shadow-md">
          <span className="text-base leading-none mt-0.5">📢</span>
          <div className="flex-1">
            <span className="font-bold block text-[11px] opacity-80 uppercase tracking-wide mb-0.5">Thông báo nhóm</span>
            <span className="leading-snug">{selectedConversation.announcement}</span>
          </div>
        </div>
      )}

      {/* Search Bar for Searching Messages inside Chat */}
      <div className="sticky top-0 z-30 mb-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 flex items-center space-x-2 shadow-sm">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm tin nhắn trong cuộc trò chuyện..."
          className="w-full text-xs bg-transparent border-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isLoadingMore && (
        <div className="text-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-xs text-gray-500 mt-1">{t('loadingMore')}</p>
        </div>
      )}

      {!hasMore && messages.filter(m => m.type !== 'CALL_SIGNAL' && m.Type !== 'CALL_SIGNAL').length > 0 && (
        <div className="text-center py-2">
          <p className="text-xs text-gray-400">{t('endOfMessages')}</p>
        </div>
      )}

      <div className="space-y-4" style={{ maxWidth: '100%' }}>
        {(() => {
          const displayableMessages = messages.filter(m => {
            const msgType = m.type || m.Type || 'TEXT';
            if (msgType !== 'CALL_SIGNAL') return true;
            if (!m.originalText) return false;
            return m.originalText.includes('CALL_OFFER') || 
                   m.originalText.includes('CALL_DECLINE') || 
                   m.originalText.includes('CALL_END') || 
                   m.originalText.includes('CALL_CANCEL');
          });
          return displayableMessages.map((message, index) => {
            const isOwnMessage = message.senderId === currentUser?.id || 
                                message.senderId === currentUser?.userId ||
                                message.senderId === currentUser?.username;
            
            const isSearchMatched = searchQuery.trim().length > 0 && (
              (message.originalText && message.originalText.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (message.translatedText && message.translatedText.toLowerCase().includes(searchQuery.toLowerCase()))
            );

            return (
              <MessageItem
                key={`message-${message.id || index}`}
                message={message}
                index={index}
                previousMessage={displayableMessages[index - 1]}
                isOwnMessage={isOwnMessage}
                isSearchMatched={isSearchMatched}
                getSenderAvatar={getSenderAvatar}
                getSenderName={getSenderName}
                shouldShowDateSeparator={shouldShowDateSeparator}
                formatDateSeparator={(ts) => formatDateSeparator(ts, t)}
                formatTime={formatTime}
                renderPollCard={renderPollCard}
                renderAttachment={renderAttachment}
                t={t}
                activeActionMenuId={activeActionMenuId}
                setActiveActionMenuId={setActiveActionMenuId}
                showReactionPickerId={showReactionPickerId}
                setShowReactionPickerId={setShowReactionPickerId}
                editingMessageId={editingMessageId}
                setEditingMessageId={setEditingMessageId}
                editingText={editingText}
                setEditingText={setEditingText}
                handleSaveEdit={handleSaveEdit}
                handleDeleteMsg={handleDeleteMsg}
                handleSendReactionEmoji={handleSendReactionEmoji}
                setReportingMessage={setReportingMessage}
                onReplyMessage={onReplyMessage}
                selectedConversation={selectedConversation}
              />
            );
          });
      })()}
      </div>
      
      {typingUser && (
        <div className="flex items-center space-x-2 my-2 text-xs text-gray-500 dark:text-gray-400 italic">
          <div className="flex space-x-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
          <span>{typingUser} đang gõ...</span>
        </div>
      )}

      <div ref={messagesEndRef} style={{ height: '1px' }} />
      
      <ImagePreviewModal 
        selectedImage={selectedImage} 
        setSelectedImage={setSelectedImage} 
      />

      <ReportMessageModal 
        reportingMessage={reportingMessage}
        setReportingMessage={setReportingMessage}
        reportReason={reportReason}
        setReportReason={setReportReason}
        isSubmittingReport={isSubmittingReport}
        handleSubmitReport={handleSubmitReport}
      />

      <DeleteConfirmDialog
        deleteConfirmDialog={deleteConfirmDialog}
        setDeleteConfirmDialog={setDeleteConfirmDialog}
        selectedConversation={selectedConversation}
        onOptimisticDelete={handleOptimisticDelete}
      />
    </div>
  );
};

export default ChatMessages;
