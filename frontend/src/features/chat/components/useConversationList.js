import { useState, useEffect, useCallback, useRef } from 'react';
import * as chatApi from '../api/chat.api';
import { API_CONFIG, getAvatarUrl } from '../../../config/api';

const PAGE_SIZE = API_CONFIG.DEFAULT_PAGE_SIZE;

export const useConversationList = (currentUser, onSelectConversation) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [subscribedConversations, setSubscribedConversations] = useState(new Set());
  
  const observerRef = useRef();
  const lastConversationRef = useRef();

  const transformMessageToConversation = (message) => {
    const isGroup = (message.conversationType && message.conversationType.toUpperCase() === 'GROUP') 
      || message.type === 'GROUP' 
      || message.isGroup 
      || Boolean(message.groupAvtUrl) 
      || (Boolean(message.conversationName) && message.conversationName !== 'Direct Message' && (message.userProfiles?.length || 0) >= 1);
    
    let conversationName = null;
    let avatarUrl = null;
    
    if (isGroup) {
      conversationName = message.conversationName || 'Group Chat';
      avatarUrl = getAvatarUrl(message.groupAvtUrl || message.avatarGroupUrl, 'group');
    } else {
      const otherParticipant = message.userProfiles?.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      ) || message.userProfiles?.[0];
      conversationName = otherParticipant?.fullName || otherParticipant?.username || 'Direct Message';
      avatarUrl = getAvatarUrl(otherParticipant?.avatarUrl, 'user');
    }
    
    return {
      id: message.conversationId || `conv_${message.userId}`,
      type: isGroup ? 'group' : 'direct',
      name: conversationName,
      participants: message.userProfiles || [],
      userProfiles: message.userProfiles || [],
      lastMessage: (() => {
        const rawText = message.messageText || '';
        const msgType = message.type || 'TEXT';
        let displayText = rawText;
        
        if (msgType === 'POLL' || rawText.includes('"question":') || rawText.includes('"options":')) {
          displayText = '📊 [Cuộc thăm dò]';
        } else if (msgType === 'LOCATION' || rawText.includes('"latitude":') || rawText.includes('"longitude":')) {
          displayText = '📍 [Vị trí]';
        } else if (msgType === 'CALL_SIGNAL') {
          displayText = '📞 [Cuộc gọi]';
        } else if (msgType === 'IMAGE' || rawText.startsWith('data:image')) {
          displayText = '📷 [Ảnh]';
        } else if (msgType === 'VIDEO' || rawText.startsWith('data:video')) {
          displayText = '🎬 [Video]';
        } else if (msgType === 'AUDIO' || rawText.startsWith('data:audio')) {
          displayText = '🎵 [Audio]';
        } else if (msgType === 'FILE') {
          displayText = '📎 [File]';
        } else if (rawText.startsWith('http') && (rawText.includes('/image/') || rawText.match(/\.(jpg|jpeg|png|gif|webp)$/i))) {
          displayText = '📷 [Ảnh]';
        }
        
        return {
          senderId: message.userId,
          originalText: displayText,
          translatedText: message.messageTextTranslate || null,
          timestamp: new Date(message.sentDatetime || Date.now())
        };
      })(),
      unreadCount: 0,
      avatarUrl: avatarUrl,
      isGroup: isGroup,
      userId: message.userId,
      conversationId: message.conversationId,
      sentDatetime: message.sentDatetime,
      conversationName: message.conversationName,
      groupAvtUrl: message.groupAvtUrl,
      avatarGroupUrl: message.avatarGroupUrl,
      groupLocale: message.groupLocale
    };
  };

  const fetchConversations = async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const result = await chatApi.getConversations(pageNum, PAGE_SIZE);
      const rawData = result?.result || result?.data || (Array.isArray(result) ? result : []);
      
      if (!Array.isArray(rawData)) {
        if (append) {
          setHasMore(false);
        } else {
          setConversations([]);
          setHasMore(false);
        }
        return;
      }
      
      const newConversations = rawData.map(transformMessageToConversation);
      
      if (append) {
        setConversations(prev => [...prev, ...newConversations]);
      } else {
        setConversations(newConversations);
      }
      
      setHasMore(newConversations.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (error) {
      setError(error.message || 'Failed to load conversations');
      if (!append) {
        setConversations([]);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreConversations = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      fetchConversations(page + 1, true);
    }
  }, [page, hasMore, isLoadingMore]);

  const lastConversationElementRef = useCallback(node => {
    if (isLoadingMore) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreConversations();
      }
    });
    
    if (node) observerRef.current.observe(node);
    lastConversationRef.current = node;
  }, [isLoadingMore, hasMore, loadMoreConversations]);

  useEffect(() => {
    if (currentUser) {
      fetchConversations(0, false);
    }
  }, [currentUser]);

  const handleRefresh = () => {
    setPage(0);
    setHasMore(true);
    fetchConversations(0, false);
  };

  const addConversationToList = useCallback((newConversation) => {
    if (!newConversation) return;
    const convId = newConversation.conversationId || newConversation.id;
    setConversations(prev => {
      const exists = prev.some(c => c.conversationId === convId || c.id === convId);
      if (exists) return prev;

      const isGroup = newConversation.type === 'group' || newConversation.isGroup;
      const otherParticipant = newConversation.participants?.find(p => 
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      ) || newConversation.participants?.[0] || newConversation.userProfiles?.find(p =>
        p.userId !== currentUser?.id && p.userId !== currentUser?.userId
      );

      const name = isGroup 
        ? (newConversation.conversationName || newConversation.name || 'Group Chat')
        : (otherParticipant?.fullName || otherParticipant?.username || 'Direct Message');

      const avatarUrl = isGroup
        ? getAvatarUrl(newConversation.groupAvtUrl || newConversation.avatarGroupUrl, 'group')
        : getAvatarUrl(otherParticipant?.avatarUrl, 'user');

      const formatted = {
        id: convId,
        conversationId: convId,
        type: isGroup ? 'group' : 'direct',
        name: name,
        avatarUrl: avatarUrl,
        participants: newConversation.participants || newConversation.userProfiles || [],
        userProfiles: newConversation.participants || newConversation.userProfiles || [],
        lastMessage: newConversation.lastMessage || null,
        unreadCount: 0,
        isGroup: isGroup
      };
      return [formatted, ...prev];
    });
  }, [currentUser]);

  const updateConversationWithNewMessage = useCallback((conversationId, messageData) => {
    setConversations(prev => {
      const convIndex = prev.findIndex(conv => conv.conversationId === conversationId || conv.id === conversationId);
      
      if (convIndex === -1) {
        const newConv = transformMessageToConversation({
          ...messageData,
          conversationId: conversationId || messageData.conversationId
        });
        setTimeout(() => fetchConversations(0, false), 500);
        return [newConv, ...prev];
      }

      const conv = prev[convIndex];
      let messageText = '';
      const msgType = messageData.type || 'TEXT';
      const rawText = messageData.messageText || messageData.MessageText || '';
      
      if (msgType === 'POLL' || rawText.includes('"question":') || rawText.includes('"options":')) {
        messageText = '📊 [Cuộc thăm dò]';
      } else if (msgType === 'LOCATION' || rawText.includes('"latitude":') || rawText.includes('"longitude":')) {
        messageText = '📍 [Vị trí]';
      } else if (msgType === 'CALL_SIGNAL') {
        messageText = '📞 [Cuộc gọi]';
      } else if (msgType === 'IMAGE' || rawText.startsWith('data:image')) {
        messageText = '📷 [Ảnh]';
      } else if (msgType === 'VIDEO' || rawText.startsWith('data:video')) {
        messageText = '🎬 [Video]';
      } else if (msgType === 'AUDIO' || rawText.startsWith('data:audio')) {
        messageText = '🎵 [Audio]';
      } else if (msgType === 'FILE') {
        messageText = '📎 [File]';
      } else {
        messageText = rawText;
      }

      const isFromCurrentUser = messageData.userId === currentUser?.id || 
                               messageData.userId === currentUser?.userId ||
                               messageData.senderId === currentUser?.id ||
                               messageData.senderId === currentUser?.userId;
      
      const updatedConversation = {
        ...conv,
        userProfiles: messageData.userProfiles || conv.userProfiles,
        participants: messageData.userProfiles || conv.participants,
        groupAvtUrl: messageData.groupAvtUrl || conv.groupAvtUrl,
        avatarUrl: messageData.groupAvtUrl ? getAvatarUrl(messageData.groupAvtUrl, 'group') : conv.avatarUrl,
        lastMessage: {
          senderId: messageData.userId || messageData.senderId || 'currentUser',
          originalText: messageText,
          translatedText: messageData.messageTextTranslate || messageData.translatedText || null,
          timestamp: new Date(messageData.sentDatetime || messageData.timestamp || Date.now())
        },
        unreadCount: isFromCurrentUser ? 0 : (conv.unreadCount || 0) + 1
      };

      // Move updated conversation to top of list immediately
      const newConversations = [
        updatedConversation,
        ...prev.slice(0, convIndex),
        ...prev.slice(convIndex + 1)
      ];
      
      return newConversations;
    });
  }, [currentUser]);

  const updateConversationInfo = useCallback((conversationId, updates) => {
    setConversations(prev => {
      const updatedConversations = prev.map(conv => {
        if (conv.conversationId === conversationId || conv.id === conversationId) {
          const updatedConv = {
            ...conv,
            ...updates
          };
          
          if (updates.participants || updates.userProfiles) {
            updatedConv.participants = updates.participants || updates.userProfiles;
            updatedConv.userProfiles = updates.userProfiles || updates.participants;
          }

          if (updatedConv.type === 'group' || updatedConv.isGroup) {
            if (updates.groupAvtUrl || updates.avatarUrl) {
              updatedConv.avatarUrl = getAvatarUrl(updates.groupAvtUrl || updates.avatarUrl, 'group');
              updatedConv.groupAvtUrl = updates.groupAvtUrl || updates.avatarUrl;
            }
            
            if (updates.name || updates.conversationName) {
              updatedConv.name = updates.name || updates.conversationName;
              updatedConv.conversationName = updates.conversationName || updates.name;
            }
            
            if (updates.groupLocale) {
              updatedConv.groupLocale = updates.groupLocale;
            }
          }
          
          return updatedConv;
        }
        return conv;
      });
      return updatedConversations;
    });
  }, []);

  const moveConversationToTop = useCallback((conversationId) => {
    setConversations(prev => {
      const conversationIndex = prev.findIndex(conv => 
        conv.conversationId === conversationId || conv.id === conversationId
      );
      
      if (conversationIndex === -1) {
        return prev;
      }
      
      const conversation = { ...prev[conversationIndex] };
      
      if (conversation.lastMessage && 
          (conversation.lastMessage.senderId !== currentUser?.id && 
           conversation.lastMessage.senderId !== currentUser?.userId)) {
        const oldUnreadCount = conversation.unreadCount || 0;
        conversation.unreadCount = oldUnreadCount + 1;
      }
      
      const newConversations = [
        conversation,
        ...prev.slice(0, conversationIndex),
        ...prev.slice(conversationIndex + 1)
      ];
      
      return newConversations;
    });
  }, [currentUser]);

  const markConversationAsRead = useCallback((conversationId) => {
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.conversationId === conversationId || conv.id === conversationId) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      });
    });
  }, []);

  const handlePresenceUpdate = useCallback((presenceData) => {
    const { userId, online } = presenceData;
    setConversations(prev => {
      return prev.map(conv => {
        if (!conv.isGroup && conv.participants) {
          const updatedParticipants = conv.participants.map(p => {
            if (p.userId === userId || p.id === userId) {
              return { ...p, online };
            }
            return p;
          });
          return { ...conv, participants: updatedParticipants };
        }
        return conv;
      });
    });
  }, []);

  const removeConversationFromList = useCallback((conversationId) => {
    setConversations(prev => prev.filter(conv => conv.conversationId !== conversationId && conv.id !== conversationId));
  }, []);

  useEffect(() => {
    window.addConversationToList = addConversationToList;
    window.updateConversationWithNewMessage = updateConversationWithNewMessage;
    window.moveConversationToTop = moveConversationToTop;
    window.removeConversationFromList = removeConversationFromList;
    window.refreshConversations = handleRefresh;
  }, [addConversationToList, updateConversationWithNewMessage, moveConversationToTop, removeConversationFromList, handleRefresh]);

  useEffect(() => {
    if (window.webSocketService && window.webSocketService.connected) {
      window.webSocketService.subscribeToPresence(handlePresenceUpdate);
    }
  }, [window.webSocketService?.connected, handlePresenceUpdate]);

  useEffect(() => {
    if (onSelectConversation) {
      const enhancedOnSelectConversation = (conversation) => {
        const enhancedConversation = {
          ...conversation,
          updateWithNewMessage: updateConversationWithNewMessage,
          updateConversationInfo: updateConversationInfo,
          moveToTop: moveConversationToTop,
          removeConversationFromList: removeConversationFromList
        };
        
        onSelectConversation(enhancedConversation);
      };
      
      window.enhancedOnSelectConversation = enhancedOnSelectConversation;
      window.updateConversationInfo = updateConversationInfo;
      window.updateConversationWithNewMessage = updateConversationWithNewMessage;
      window.moveConversationToTop = moveConversationToTop;
    }
  }, [onSelectConversation, updateConversationWithNewMessage, updateConversationInfo, moveConversationToTop, removeConversationFromList]);

  useEffect(() => {
    if (window.webSocketService && window.webSocketService.connected && conversations.length > 0) {
      const recentConversations = conversations.slice(0, 20);
      recentConversations.forEach(conversation => {
        const conversationId = conversation.conversationId || conversation.id;
        if (conversationId && !subscribedConversations.has(conversationId)) {
          window.webSocketService.subscribeToConversation(conversationId, (message) => {
            updateConversationWithNewMessage(conversationId, message);
            moveConversationToTop(conversationId);
          });
          
          setSubscribedConversations(prev => new Set([...prev, conversationId]));
        }
      });
    }
  }, [conversations, updateConversationWithNewMessage, moveConversationToTop, subscribedConversations]);

  return {
    conversations,
    isLoading,
    error,
    hasMore,
    isLoadingMore,
    lastConversationElementRef,
    handleRefresh,
    markConversationAsRead,
    addConversationToList
  };
};
