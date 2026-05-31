import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield, Settings, Globe, Search, X } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import * as chatApi from '../api/chat.api';
import { getAvatarUrl } from '../../../config/api';
import ConversationListItem from './ConversationListItem';
import { useConversationList } from './useConversationList';

const ConversationList = forwardRef(({ selectedConversation, onSelectConversation, onNewConversation }, ref) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const {
    conversations,
    isLoading,
    error,
    hasMore,
    isLoadingMore,
    lastConversationElementRef,
    handleRefresh,
    markConversationAsRead,
    addConversationToList
  } = useConversationList(currentUser, onSelectConversation);

  useImperativeHandle(ref, () => ({
    refreshConversations: handleRefresh,
    addConversationToList: addConversationToList,
    getConversations: () => conversations
  }), [handleRefresh, addConversationToList, conversations]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (diffInHours < 48) {
      return t('yesterday');
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getConversationName = (conversation) => {
    if (conversation.type === 'group' || conversation.isGroup) {
      return conversation.conversationName || conversation.name || t('groupChat');
    }
    
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      return otherParticipant?.fullName || otherParticipant?.username || t('unknownUser');
    }
    
    return t('unknownUser');
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.type === 'group' || conversation.isGroup) {
      return conversation.avatarUrl || '/default-group-avatar.svg';
    }
    
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      return getAvatarUrl(otherParticipant?.avatarUrl, 'user');
    }
    
    return getAvatarUrl(null, 'user');
  };

  const getOtherParticipantOnlineStatus = (conversation) => {
    if (conversation.type === 'group' || conversation.isGroup) {
      return true;
    }
    
    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      return otherParticipant?.online !== undefined ? otherParticipant.online : false;
    }
    
    return false;
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {t('directMessage')}
          </h2>
          <button
            onClick={onNewConversation}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title={t('newConversation')}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-xs text-zinc-500">{t('loadingConversations')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {t('directMessage')}
          </h2>
          <button
            onClick={onNewConversation}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title={t('newConversation')}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-sm text-red-500 mb-2">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 truncate">
          {t('directMessage') || 'Tin nhắn'}
        </h2>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {(currentUser?.role?.toUpperCase() === 'ADMIN' || currentUser?.role?.toUpperCase() === 'SYSTEM_ADMIN' || currentUser?.role?.toUpperCase() === 'ROLE_ADMIN') && (
            <button
              onClick={() => navigate('/admin')}
              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Admin Dashboard"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => navigate('/settings')}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title={t('settings')}
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title={t('refresh')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={onNewConversation}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title={t('newConversation')}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1.5">
        {(() => {
          if (conversations.length === 0) {
            return (
              <div className="p-6 text-center">
                <div className="mb-4">
                  <svg className="w-14 h-14 mx-auto text-zinc-300 dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  {t('noConversations') || 'Chưa có cuộc trò chuyện'}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
                  Bắt đầu cuộc trò chuyện mới để nhắn tin
                </p>
                <button
                  onClick={onNewConversation}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('startConversation') || 'Tạo cuộc trò chuyện'}
                </button>
              </div>
            );
          }

          return (
            <div className="space-y-0.5">
              {conversations.map((conversation, index) => {
                const isSelected = selectedConversation && selectedConversation.id === conversation.id;
                const isLastConversation = index === conversations.length - 1;
                
                return (
                  <ConversationListItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={isSelected}
                    isLastConversation={isLastConversation}
                    lastConversationElementRef={lastConversationElementRef}
                    onClick={() => {
                      if (conversation.unreadCount > 0) {
                        markConversationAsRead(conversation.id);
                      }
                      
                      if (window.enhancedOnSelectConversation) {
                        window.enhancedOnSelectConversation(conversation);
                      } else {
                        onSelectConversation(conversation);
                      }
                    }}
                    getConversationAvatar={getConversationAvatar}
                    getConversationName={getConversationName}
                    getOtherParticipantOnlineStatus={getOtherParticipantOnlineStatus}
                    currentUser={currentUser}
                    t={t}
                    formatTime={formatTime}
                  />
                );
              })}
              
              {isLoadingMore && (
                <div className="px-4 py-3 text-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">{t('loadingMore')}</p>
                </div>
              )}
              
              {!hasMore && conversations.length > 0 && (
                <div className="px-4 py-3 text-center">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">{t('endOfConversations')}</p>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
});

ConversationList.displayName = 'ConversationList';

export default ConversationList;
