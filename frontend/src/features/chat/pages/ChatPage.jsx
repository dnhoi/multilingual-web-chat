import { useState, Suspense, lazy, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Video, Settings, Menu, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToast } from '../../../contexts/ToastContext';
import webSocketService from '../../../services/WebSocketService';
import { getAvatarUrl } from '../../../config/api';
import logger from '../../../core/utils/logger';
import * as chatApi from '../api/chat.api';
import { useCallSignaling } from './useCallSignaling';

// Lazy load components
const ConversationList = lazy(() => import('../components/ConversationList'));
const ChatWindow = lazy(() => import('../components/ChatWindow'));
const ChatHeader = lazy(() => import('../components/ChatHeader'));
const ConversationInfo = lazy(() => import('../components/ConversationInfo'));
const LanguageSelector = lazy(() => import('../../../components/common/LanguageSelector'));
const NewConversationModal = lazy(() => import('../components/NewConversationModal'));
const UserProfileModal = lazy(() => import('../../auth/components/UserProfileModal'));
const AddMemberModal = lazy(() => import('../components/AddMemberModal'));
const CallModal = lazy(() => import('../components/CallModal'));
import BroadcastBanner from '../components/BroadcastBanner';
import { filterProfanity, loadBannedKeywords } from '../../../utils/profanityFilter';

const ChatPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  
  const conversationListRef = useRef(null);
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const {
    showCallModal,
    setShowCallModal,
    callType,
    incomingCall,
    incomingSignal,
    callerSdp,
    handleStartCall,
    handleAcceptCall,
    handleDeclineCall,
    handleHangUp,
    handleSendSignal
  } = useCallSignaling(currentUser, selectedConversation);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    loadBannedKeywords();
  }, []);

  const getOtherParticipantOnlineStatus = (conversation) => {
    if (conversation.type === 'group' || conversation.isGroup) {
      return false;
    }

    if (conversation.userProfiles && conversation.userProfiles.length > 0) {
      const otherUser = conversation.userProfiles.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      if (otherUser) {
        return otherUser.online !== undefined ? otherUser.online : true;
      }
    }

    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );
      if (otherParticipant) {
        return otherParticipant.isOnline !== undefined ? otherParticipant.isOnline : true;
      }
    }

    return true;
  };
  const navigate = useNavigate();

  const handleSendMessage = (messageText, attachments = [], extra = {}) => {
    if (!selectedConversation) {
      return;
    }

    const conversationId = selectedConversation.conversationId || selectedConversation.id;
    
    try {
      if (attachments && attachments.length > 0) {
        attachments.forEach(attachment => {
          let messageType = attachment.cloudinaryData?.type || attachment.type || 'FILE';
          if (messageType === 'DOCUMENT') messageType = 'FILE';
          const fileUrl = attachment.cloudinaryData?.url || attachment.url || '';
          const fileName = attachment.name || attachment.cloudinaryData?.originalName || 'Tệp đính kèm';
          const fileSize = attachment.size || attachment.cloudinaryData?.size || 0;
          
          const payload = `${fileUrl}|${fileName}|${fileSize}`;

          const success = webSocketService.sendMessage(
            conversationId,
            payload,
            messageType,
            extra
          );
          if (success) {
            if (selectedConversation.updateWithNewMessage) {
              selectedConversation.updateWithNewMessage(conversationId, {
                type: messageType,
                messageText: payload,
                userId: currentUser?.id || currentUser?.userId,
                timestamp: Date.now(),
                isTranslating: false
              });
              if (selectedConversation.moveToTop) {
                selectedConversation.moveToTop(conversationId);
              }
            } else if (window.updateConversation) {
              window.updateConversation(conversationId, {
                type: messageType,
                messageText: payload,
                userId: currentUser?.id || currentUser?.userId,
                timestamp: Date.now(),
                isTranslating: false
              });
            }
          }
        });
      } else {
        // Support POLL, LOCATION and other special message types
        const messageType = extra.messageType || 'TEXT';
        const { messageType: _ignored, ...restExtra } = extra;
        const isTranslatable = messageType === 'TEXT';
        const finalMessageText = isTranslatable ? filterProfanity(messageText) : messageText;
        const success = webSocketService.sendMessage(
          conversationId,
          finalMessageText,
          messageType,
          restExtra
        );
        if (success) {
          if (selectedConversation.updateWithNewMessage) {
            selectedConversation.updateWithNewMessage(conversationId, {
              type: messageType,
              messageText: finalMessageText,
              userId: currentUser?.id || currentUser?.userId,
              timestamp: Date.now(),
              isTranslating: isTranslatable
            });
            if (selectedConversation.moveToTop) {
              selectedConversation.moveToTop(conversationId);
            }
          } else if (window.updateConversation) {
            window.updateConversation(conversationId, {
              type: messageType,
              messageText: finalMessageText,
              userId: currentUser?.id || currentUser?.userId,
              timestamp: Date.now(),
              isTranslating: isTranslatable
            });
          }
        }
      }
    } catch (error) {
    }
  };

  const handleSelectConversation = (conversation) => {
    if (!conversation) {
      setSelectedConversation(null);
      return;
    }
    const convId = conversation.conversationId || conversation.id;
    const enhancedConversation = {
      ...conversation,
      id: convId,
      conversationId: convId,
      updateWithNewMessage: (cId, msg) => {
        if (window.updateConversationWithNewMessage) {
          window.updateConversationWithNewMessage(cId || convId, msg);
        } else if (conversation.updateWithNewMessage) {
          conversation.updateWithNewMessage(cId || convId, msg);
        }
      },
      moveToTop: (cId) => {
        if (window.moveConversationToTop) {
          window.moveConversationToTop(cId || convId);
        } else if (conversation.moveToTop) {
          conversation.moveToTop(cId || convId);
        }
      }
    };
    
    setSelectedConversation(enhancedConversation);
    setShowSidebar(false);
  };

  const handleNewConversation = (newConversation) => {
    if (window.addConversationToList) {
      window.addConversationToList(newConversation);
    }
    if (conversationListRef.current && conversationListRef.current.addConversationToList) {
      conversationListRef.current.addConversationToList(newConversation);
    }
    handleSelectConversation(newConversation);
    setShowSidebar(false);
    if (conversationListRef.current && conversationListRef.current.refreshConversations) {
      setTimeout(() => {
        conversationListRef.current.refreshConversations();
      }, 500);
    }
  };

  const handleStartDirectChat = async (targetUser) => {
    if (!targetUser) return;
    const targetUserId = targetUser.userId || targetUser.id;
    const currentUserId = currentUser?.userId || currentUser?.id;
    if (!targetUserId || targetUserId === currentUserId) return;

    try {
      setShowUserProfileModal(false);
      setShowInfoPanel(false);

      // Check if conversation already exists in current list
      const existingConversations = conversationListRef.current?.getConversations?.() || [];
      const found = existingConversations.find(conv => {
        if (conv.type === 'group' || conv.isGroup) return false;
        const participants = conv.participants || conv.userProfiles || [];
        return participants.some(p => (p.userId === targetUserId || p.id === targetUserId));
      });

      if (found) {
        handleSelectConversation(found);
        return;
      }

      // Call API to create or retrieve direct conversation
      const apiResult = await chatApi.createDirectConversation(targetUserId);
      const resData = apiResult?.result || apiResult?.data || apiResult;
      const conversationId = resData?.conversationId || resData?.ConversationId || (typeof resData === 'string' ? resData : null);

      if (!conversationId) {
        showToast(t('errorCreatingConversation') || 'Không thể tạo cuộc trò chuyện', 'error');
        return;
      }

      // Check again if the returned conversationId is already in list
      const existingById = existingConversations.find(c => (c.conversationId === conversationId || c.id === conversationId));
      if (existingById) {
        handleSelectConversation(existingById);
        return;
      }

      const newConversation = {
        id: conversationId,
        conversationId,
        type: 'direct',
        isGroup: false,
        participants: [
          {
            userId: targetUserId,
            fullName: targetUser.fullName || targetUser.name || targetUser.username,
            email: targetUser.email,
            avatarUrl: targetUser.avatarUrl || targetUser.avatar,
            locale: targetUser.locale || targetUser.language,
            isOnline: targetUser.isOnline !== undefined ? targetUser.isOnline : false
          }
        ]
      };

      handleNewConversation(newConversation);
    } catch (err) {
      logger.error('Error starting direct chat:', err);
      showToast(t('errorCreatingConversation') || 'Không thể bắt đầu cuộc trò chuyện', 'error');
    }
  };

  const handleUserProfileClick = (user) => {
    setSelectedUser(user);
    setShowUserProfileModal(true);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const toggleInfoPanel = () => {
    setShowInfoPanel(!showInfoPanel);
  };

  const handleLeaveConversation = (conversationId) => {
    if (!conversationId || (selectedConversation && (selectedConversation.id === conversationId || selectedConversation.conversationId === conversationId))) {
      setSelectedConversation(null);
    }
    setShowInfoPanel(false);
  };

  const handleShowLeaveConfirm = () => {
    setShowLeaveConfirm(true);
  };

  const handleLeaveGroup = async () => {
    if (isLeavingGroup || !selectedConversation) return;
    
    try {
      setIsLeavingGroup(true);
      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      
      const result = await chatApi.leaveConversation(conversationId);
      
      if (result && (result.code === 0 || result.message || result.result || result.success)) {
        handleLeaveConversation(conversationId);
        setShowLeaveConfirm(false);
        if (window.removeConversationFromList) {
          window.removeConversationFromList(conversationId);
        }
        if (conversationListRef.current && conversationListRef.current.refreshConversations) {
          conversationListRef.current.refreshConversations();
        }
      }
    } catch (error) {
      console.error('Failed to leave group:', error);
      const conversationId = selectedConversation?.conversationId || selectedConversation?.id;
      if (conversationId) {
        handleLeaveConversation(conversationId);
        setShowLeaveConfirm(false);
        if (window.removeConversationFromList) {
          window.removeConversationFromList(conversationId);
        }
      }
    } finally {
      setIsLeavingGroup(false);
    }
  };

  useEffect(() => {
    window.refreshSelectedConversation = async () => {
      if (!selectedConversation) return;
      const convId = selectedConversation.conversationId || selectedConversation.id;
      if (!convId) return;
      try {
        const res = await chatApi.getConversations(0, 50);
        const list = res?.result || res?.data || (Array.isArray(res) ? res : []);
        const found = list.find(c => (c.conversationId || c.id) === convId);
        if (found && found.userProfiles) {
          setSelectedConversation(prev => {
            if (!prev) return null;
            return {
              ...prev,
              ...found,
              userProfiles: found.userProfiles,
              participants: found.userProfiles
            };
          });
        }
      } catch (err) {
        console.error('Error refreshing selected conversation:', err);
      }
    };
  }, [selectedConversation]);

  return (
    <div className="h-screen-mobile flex flex-col bg-gray-100 safe-top safe-bottom">
      <Suspense fallback={<div className="h-16 bg-white border-b border-gray-200 animate-pulse"></div>}>
        <ChatHeader
          currentUser={currentUser}
          t={t}
          showSidebar={showSidebar}
          toggleSidebar={toggleSidebar}
          navigate={navigate}
        />
      </Suspense>

      <BroadcastBanner />

      <div className="flex-1 flex overflow-hidden relative">
        <div className={`lg:flex lg:w-80 xl:w-96 flex-shrink-0 absolute lg:relative inset-0 z-30 bg-white lg:bg-transparent transform transition-transform duration-300 ease-in-out ${
          showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <Suspense fallback={<div className="w-full h-full bg-gray-200 animate-pulse"></div>}>
            <ConversationList
              ref={conversationListRef}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              onNewConversation={() => setShowNewConversationModal(true)}
            />
          </Suspense>
        </div>

          <Suspense fallback={<div className="flex-1 bg-gray-200 animate-pulse"></div>}>
            <ChatWindow
              selectedConversation={selectedConversation}
              getOtherParticipantOnlineStatus={getOtherParticipantOnlineStatus}
              t={t}
              handleStartCall={handleStartCall}
              toggleInfoPanel={toggleInfoPanel}
              showInfoPanel={showInfoPanel}
              replyMessage={replyMessage}
              setReplyMessage={setReplyMessage}
              handleSendMessage={handleSendMessage}
            />
          </Suspense>

        {showInfoPanel && (
          <div className="fixed inset-0 z-40 lg:relative lg:inset-auto lg:z-10 w-full sm:w-80 flex-shrink-0 flex flex-col bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-2xl lg:shadow-none animate-in slide-in-from-right duration-200">
            <Suspense fallback={<div className="w-full h-full bg-gray-200 animate-pulse"></div>}>
              <ConversationInfo 
                selectedConversation={selectedConversation}
                onClose={() => setShowInfoPanel(false)}
                onUserProfileClick={handleUserProfileClick}
                onAddMemberClick={() => setShowAddMemberModal(true)}
                onLeaveConversation={handleLeaveConversation}
                onShowLeaveConfirm={handleShowLeaveConfirm}
                onUserClick={(user) => {
                  setSelectedUser(user);
                  setShowUserProfileModal(true);
                }}
                onUpdateConversation={(updatedConversation) => {
                  setSelectedConversation(updatedConversation);
                }}
              />
            </Suspense>
          </div>
        )}
      </div>

      {showSidebar && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20 transition-opacity duration-300"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {showInfoPanel && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20 transition-opacity duration-300"
          onClick={() => setShowInfoPanel(false)}
        />
      )}

      <Suspense fallback={null}>
        <NewConversationModal
          isOpen={showNewConversationModal}
          onClose={() => setShowNewConversationModal(false)}
          onCreateConversation={handleNewConversation}
        />

        <UserProfileModal
          isOpen={showUserProfileModal}
          onClose={() => setShowUserProfileModal(false)}
          user={selectedUser}
          onSendMessage={handleStartDirectChat}
        />

        <AddMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          conversation={selectedConversation}
          onAddMembers={async (newMembers, conversationId) => {
            if (selectedConversation) {
              const newParticipants = newMembers.map(user => ({
                userId: user.userId,
                fullName: user.fullName,
                email: user.email,
                avatarUrl: user.avatarUrl,
                locale: user.locale,
                isOnline: true
              }));
              
              const existingParticipants = selectedConversation.userProfiles || selectedConversation.participants || [];
              const existingUserIds = existingParticipants.map(p => p.userId);
              
              const uniqueNewParticipants = newParticipants.filter(user => 
                !existingUserIds.includes(user.userId)
              );
              
              if (uniqueNewParticipants.length === 0) {
                return;
              }
              
              const updatedParticipants = [
                ...existingParticipants,
                ...uniqueNewParticipants
              ];
              
              if (window.updateConversationInfo) {
                window.updateConversationInfo(conversationId, {
                  participants: updatedParticipants,
                  userProfiles: updatedParticipants
                });
              }
              
              setSelectedConversation(prev => ({
                ...prev,
                participants: updatedParticipants,
                userProfiles: updatedParticipants
              }));

              if (window.refreshSelectedConversation) {
                setTimeout(() => {
                  window.refreshSelectedConversation();
                }, 300);
              }
              if (window.refreshConversations) {
                window.refreshConversations();
              }
            }
          }}
        />
      </Suspense>

      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('leaveGroupConfirm') || 'Leave Group?'}
              </h2>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4">
              <p className="text-gray-600 mb-6">
                {t('leaveGroupWarning') || 'Are you sure you want to leave this group? You won\'t be able to see new messages unless someone adds you back.'}
              </p>
            </div>

            <div className="p-4 border-t border-gray-200 flex space-x-3 flex-shrink-0">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {t('cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleLeaveGroup}
                disabled={isLeavingGroup}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLeavingGroup ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('leaving') || 'Leaving...'}</span>
                  </div>
                ) : (
                  t('leaveGroup') || 'Leave Group'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <CallModal
        isOpen={showCallModal}
        onClose={handleHangUp}
        callType={callType}
        recipient={{
          name: selectedConversation?.name || selectedConversation?.participants?.[0]?.fullName || 'User',
          avatarUrl: selectedConversation?.avatarUrl || selectedConversation?.participants?.[0]?.avatarUrl
        }}
        currentUser={currentUser}
        callerSdp={callerSdp}
        onSendSignal={handleSendSignal}
        incomingSignal={incomingSignal}
        onSignalProcessed={() => setIncomingSignal(null)}
      />

      {incomingCall && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-6 border border-gray-200 dark:border-gray-700">
            <div className="relative inline-block">
              <img
                src={getAvatarUrl(incomingCall.callerAvatar, 'user')}
                alt={incomingCall.callerName}
                className="w-24 h-24 rounded-full object-cover mx-auto ring-4 ring-blue-500 animate-pulse"
              />
              <span className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full">
                {incomingCall.callType === 'video' ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {incomingCall.callerName}
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 font-medium">
                Cuộc gọi {incomingCall.callType === 'video' ? 'Video' : 'Thoại'} đang đến...
              </p>
            </div>

            <div className="flex items-center justify-center space-x-6 pt-2">
              <button
                onClick={handleDeclineCall}
                className="flex items-center justify-center w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-transform transform hover:scale-110"
                title="Từ chối"
              >
                <Phone className="w-6 h-6 rotate-[135deg]" />
              </button>

              <button
                onClick={handleAcceptCall}
                className="flex items-center justify-center w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-transform transform hover:scale-110 animate-bounce"
                title="Trả lời"
              >
                <Phone className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
