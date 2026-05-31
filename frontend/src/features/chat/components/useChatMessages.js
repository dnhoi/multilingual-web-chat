import { useState, useEffect, useRef, useCallback } from 'react';
import * as chatApi from '../api/chat.api';
import webSocketService from '../../../services/WebSocketService';
import { API_CONFIG } from '../../../config/api';

const MESSAGES_PER_PAGE = API_CONFIG.MESSAGES_PER_PAGE;

export const useChatMessages = (selectedConversation, currentUser) => {
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [webSocketSubscription, setWebSocketSubscription] = useState(null);
  const [typingUser, setTypingUser] = useState(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId, pageNum = 0, append = false) => {
    if (!conversationId) return;
    
    setIsLoadingMore(true);
    try {
      const result = await chatApi.getMessages(conversationId, pageNum, MESSAGES_PER_PAGE);
      const newMessages = result?.result || result?.data || (Array.isArray(result) ? result : []);
      
      const processedMessages = newMessages.map(message => {
        let messageContent = message.messageText || message.MessageText || message.originalText || '';
        let attachment = null;
        let messageType = message.type || message.Type || 'TEXT';
        
        const isUrlMedia = messageContent.startsWith('http://') || messageContent.startsWith('https://') || messageContent.startsWith('data:');
        const isAttachmentType = messageType === 'IMAGE' || messageType === 'VIDEO' || messageType === 'AUDIO' || messageType === 'FILE' || messageType === 'DOCUMENT';

        if ((isAttachmentType || isUrlMedia) && messageContent && !messageContent.includes('"question":')) {
          let actualUrl = messageContent.trim();
          let actualName = '';
          let actualSize = null;

          if (actualUrl.includes('|')) {
            const parts = actualUrl.split('|');
            actualUrl = parts[0];
            actualName = parts[1] || '';
            actualSize = parts[2] ? parseInt(parts[2], 10) : null;
          } else if (actualUrl.startsWith('{') && actualUrl.includes('"url"')) {
            try {
              const parsed = JSON.parse(actualUrl);
              actualUrl = parsed.url;
              actualName = parsed.name || parsed.originalName || '';
              actualSize = parsed.size || parsed.originalSize || null;
            } catch (e) {}
          }

          if (!actualName) {
            const rawName = actualUrl.split('/').pop()?.split('?')[0] || '';
            try {
              actualName = decodeURIComponent(rawName);
            } catch (e) {
              actualName = rawName;
            }
          }

          let actualType = messageType;
          const isDocExtension = actualUrl.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt)(\?.*)?$/i);

          if (isDocExtension || actualType === 'FILE' || actualType === 'DOCUMENT') {
            actualType = 'FILE';
          } else if (actualType === 'TEXT' || !actualType) {
            if (actualUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) || actualUrl.startsWith('data:image')) {
              actualType = 'IMAGE';
            } else if (actualUrl.match(/\.(mp4|webm|avi|mov)(\?.*)?$/i) || actualUrl.startsWith('data:video')) {
              actualType = 'VIDEO';
            } else if (actualUrl.match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/i) || actualUrl.startsWith('data:audio')) {
              actualType = 'AUDIO';
            } else {
              actualType = 'FILE';
            }
          }

          attachment = {
            url: actualUrl,
            type: actualType,
            name: actualName || 'Tệp đính kèm',
            size: actualSize,
            format: actualType === 'IMAGE' ? 'jpg' : actualType === 'VIDEO' ? 'mp4' : actualType === 'AUDIO' ? 'webm' : 'file'
          };
          messageType = actualType;
          messageContent = '';
        }
        
        const origText = message.isDeleted ? 'Tin nhắn đã bị xóa' : messageContent;
        let transText = message.isDeleted ? null : (message.messageTextTranslate || message.translatedText || null);
        if (transText) {
          const upperT = transText.toUpperCase();
          if (upperT.includes('PLEASE SELECT TWO DISTINCT LANGUAGES') ||
              upperT.includes('MYMEMORY HAS SEEN ALL') ||
              upperT.includes('QUERY LENGTH LIMIT') ||
              upperT.includes('INVALID TARGET')) {
            transText = origText;
          }
        } else if (!message.isDeleted && messageType === 'TEXT' && origText && /\p{L}/u.test(origText)) {
          transText = origText;
        }
        
        const msgTimestamp = new Date(message.sentDatetime || message.timestamp || Date.now());
        const isRecentMsg = (Date.now() - msgTimestamp.getTime()) < 15000;
        
        return {
            id: message.messageId || message.id,
            senderId: message.userId || message.senderId,
            originalText: origText,
            translatedText: transText,
            timestamp: msgTimestamp,
            type: messageType,
            attachment: attachment,
            replyToMessageId: message.replyToMessageId,
            replyToMessageText: message.replyToMessageText,
            replyToUserId: message.replyToUserId,
            isEdited: message.isEdited || false,
            isDeleted: message.isDeleted || false,
            isPinned: message.isPinned || false,
            reactions: message.reactions || '',
            isTranslating: messageType === 'TEXT' && messageContent && !transText && isRecentMsg
          };
      });
      
      if (append) {
        const reversedNewMessages = processedMessages.reverse();
        const chatContainer = chatContainerRef.current;
        const currentScrollTop = chatContainer?.scrollTop || 0;
        const currentScrollHeight = chatContainer?.scrollHeight || 0;

        setMessages(prev => {
          const allMessages = [...reversedNewMessages, ...prev];
          return allMessages.sort((a, b) => a.timestamp - b.timestamp);
        });

        setTimeout(() => {
          if (chatContainer) {
            const newScrollHeight = chatContainer.scrollHeight;
            const heightDifference = newScrollHeight - currentScrollHeight;
            chatContainer.scrollTop = currentScrollTop + heightDifference;
          }
        }, 100);
      } else {
        const reversedNewMessages = processedMessages.reverse();
        setMessages(reversedNewMessages);
      }
      
      setHasMore(newMessages.length === MESSAGES_PER_PAGE);
      setPage(pageNum);
    } catch (error) {
      setError('Error fetching messages');
    } finally {
      setIsLoadingMore(false);
    }
  }, []);

  const loadMoreMessages = useCallback(() => {
    if (!isLoadingMore && hasMore && selectedConversation) {
      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      fetchMessages(conversationId, page + 1, true);
    }
  }, [page, hasMore, isLoadingMore, selectedConversation, fetchMessages]);

  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current || isLoadingMore || !hasMore) return;

    const { scrollTop } = chatContainerRef.current;
    if (scrollTop === 0) {
      loadMoreMessages();
    }
  }, [loadMoreMessages, isLoadingMore, hasMore]);

  const handleWebSocketMessage = useCallback((messageData) => {
    if (messageData.action === 'TYPING') {
      if (messageData.userId !== currentUser?.id && messageData.userId !== currentUser?.userId) {
        setTypingUser(messageData.userId);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      }
      return;
    }

    if (messageData.type === 'NOTIFICATION' || messageData.userProfiles) {
      if (window.refreshSelectedConversation) {
        window.refreshSelectedConversation();
      }
      if (window.refreshConversations) {
        window.refreshConversations();
      }
    }

    const messageId = messageData.messageId || messageData.id;
    
    setMessages(prev => {
      const existingMessageIndex = prev.findIndex(msg => String(msg.id) === String(messageId));
      
      if (existingMessageIndex !== -1) {
        const updatedMessages = [...prev];
        const existing = updatedMessages[existingMessageIndex];
        let updatedTrans = messageData.isDeleted ? null : (messageData.messageTextTranslate !== undefined ? messageData.messageTextTranslate : existing.translatedText);
        if (updatedTrans) {
          const upperT = updatedTrans.toUpperCase();
          if (upperT.includes('PLEASE SELECT TWO DISTINCT LANGUAGES') ||
              upperT.includes('MYMEMORY HAS SEEN ALL') ||
              upperT.includes('QUERY LENGTH LIMIT') ||
              upperT.includes('INVALID TARGET')) {
            updatedTrans = existing.originalText;
          }
        } else if (!messageData.isDeleted && existing.originalText && /\p{L}/u.test(existing.originalText)) {
          updatedTrans = existing.originalText;
        }
        updatedMessages[existingMessageIndex] = {
          ...existing,
          originalText: messageData.isDeleted ? 'Tin nhắn đã bị xóa' : (messageData.messageText || existing.originalText),
          translatedText: updatedTrans,
          isEdited: messageData.isEdited !== undefined ? messageData.isEdited : existing.isEdited,
          isDeleted: messageData.isDeleted !== undefined ? messageData.isDeleted : existing.isDeleted,
          isPinned: messageData.isPinned !== undefined ? messageData.isPinned : existing.isPinned,
          reactions: messageData.reactions !== undefined ? messageData.reactions : existing.reactions,
          isTranslating: false
        };
        return updatedMessages;
      } else {
        let messageContent = messageData.messageText || messageData.MessageText || messageData.originalText || '';
        let attachment = null;
        let messageType = messageData.type || messageData.Type || 'TEXT';
        
        const isUrlMedia = messageContent.startsWith('http://') || messageContent.startsWith('https://') || messageContent.startsWith('data:');
        const isAttachmentType = messageType === 'IMAGE' || messageType === 'VIDEO' || messageType === 'AUDIO' || messageType === 'FILE' || messageType === 'DOCUMENT';

        if ((isAttachmentType || isUrlMedia) && messageContent && !messageContent.includes('"question":')) {
          let actualUrl = messageContent.trim();
          let actualName = '';
          let actualSize = null;

          if (actualUrl.includes('|')) {
            const parts = actualUrl.split('|');
            actualUrl = parts[0];
            actualName = parts[1] || '';
            actualSize = parts[2] ? parseInt(parts[2], 10) : null;
          } else if (actualUrl.startsWith('{') && actualUrl.includes('"url"')) {
            try {
              const parsed = JSON.parse(actualUrl);
              actualUrl = parsed.url;
              actualName = parsed.name || parsed.originalName || '';
              actualSize = parsed.size || parsed.originalSize || null;
            } catch (e) {}
          }

          if (!actualName) {
            const rawName = actualUrl.split('/').pop()?.split('?')[0] || '';
            try {
              actualName = decodeURIComponent(rawName);
            } catch (e) {
              actualName = rawName;
            }
          }

          let actualType = messageType;
          const isDocExtension = actualUrl.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt)(\?.*)?$/i);

          if (isDocExtension || actualType === 'FILE' || actualType === 'DOCUMENT') {
            actualType = 'FILE';
          } else if (actualType === 'TEXT' || !actualType) {
            if (actualUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) || actualUrl.startsWith('data:image')) {
              actualType = 'IMAGE';
            } else if (actualUrl.match(/\.(mp4|webm|avi|mov)(\?.*)?$/i) || actualUrl.startsWith('data:video')) {
              actualType = 'VIDEO';
            } else if (actualUrl.match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/i) || actualUrl.startsWith('data:audio')) {
              actualType = 'AUDIO';
            } else {
              actualType = 'FILE';
            }
          }

          attachment = {
            url: actualUrl,
            type: actualType,
            name: actualName || 'Tệp đính kèm',
            size: actualSize,
            format: actualType === 'IMAGE' ? 'jpg' : actualType === 'VIDEO' ? 'mp4' : actualType === 'AUDIO' ? 'webm' : 'file'
          };
          messageType = actualType;
          messageContent = '';
        }
        
        const newMsgTimestamp = new Date(messageData.sentDatetime || messageData.timestamp || Date.now());
        const isRecentNewMsg = (Date.now() - newMsgTimestamp.getTime()) < 15000;

        let newMsgTrans = messageData.messageTextTranslate || messageData.translatedText || null;
        if (newMsgTrans) {
          const upperT = newMsgTrans.toUpperCase();
          if (upperT.includes('PLEASE SELECT TWO DISTINCT LANGUAGES') ||
              upperT.includes('MYMEMORY HAS SEEN ALL') ||
              upperT.includes('QUERY LENGTH LIMIT') ||
              upperT.includes('INVALID TARGET')) {
            newMsgTrans = messageContent;
          }
        } else if (!messageData.isDeleted && messageType === 'TEXT' && messageContent && /\p{L}/u.test(messageContent)) {
          newMsgTrans = messageContent;
        }

        const newMessage = {
          id: messageId,
          senderId: messageData.userId || messageData.senderId,
          originalText: messageContent,
          translatedText: newMsgTrans,
          timestamp: newMsgTimestamp,
          type: messageType,
          attachment: attachment,
          replyToMessageId: messageData.replyToMessageId,
          replyToMessageText: messageData.replyToMessageText,
          replyToUserId: messageData.replyToUserId,
          isEdited: messageData.isEdited || false,
          isDeleted: messageData.isDeleted || false,
          isPinned: messageData.isPinned || false,
          reactions: messageData.reactions || '',
          isTranslating: messageType === 'TEXT' && messageContent && !newMsgTrans && isRecentNewMsg
        };
        
        return [...prev, newMessage];
      }
    });
    
    setTimeout(() => {
      scrollToBottom();
    }, 100);
  }, [currentUser, scrollToBottom]);

  useEffect(() => {
    if (selectedConversation) {
      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      setMessages([]);
      setPage(0);
      setHasMore(true);
      setError(null);
      fetchMessages(conversationId, 0, false);
    }
  }, [selectedConversation, fetchMessages]);

  useEffect(() => {
    if (selectedConversation && webSocketService.connected) {
      const conversationId = selectedConversation.conversationId || selectedConversation.id;
      const subscription = webSocketService.subscribeToConversation(conversationId, handleWebSocketMessage);
      setWebSocketSubscription(subscription);
      
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [selectedConversation, webSocketService.connected, handleWebSocketMessage]);

  useEffect(() => {
    if (messages.length > 0 && !isLoading && page === 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, isLoading, page, scrollToBottom]);

  return {
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
  };
};
