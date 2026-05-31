// WebSocketService.js
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_CONFIG } from '../config/api';
import logger from '../core/utils/logger';

/**
 * Quản lý kết nối STOMP qua WebSocket/SockJS, điều phối đăng ký kênh và gửi nhận tin nhắn thời gian thực.
 */
class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.subscriptions = new Map();    // Mã hội thoại (conversationId) -> đối tượng subscription STOMP
    this.messageHandlers = new Map();  // Mã hội thoại -> callback xử lý tin nhắn (lưu đệm trước khi kết nối)
    this.personalSub = null;
    this.personalHandler = null;
    this.token = null;

    this.offlineQueue = [];
    this.maxReconnectAttempts = 5;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.presenceSub = null;
    this.presenceHandler = null;
  }

  get connected() {
    return !!this.stompClient?.connected;
  }

  flushOfflineQueue() {
    if (this.offlineQueue.length > 0 && this.connected) {
      logger.log(`Flushing ${this.offlineQueue.length} offline queued messages...`);
      while (this.offlineQueue.length > 0) {
        const item = this.offlineQueue.shift();
        this.sendMessage(item.conversationId, item.messageText, item.messageType, item.extra);
      }
    }
  }

  connect(token, onConnect, onError) {
    // Nếu đã kết nối thì bỏ qua
    if (this.connected) {
      onConnect?.();
      return;
    }
    
    this.token = token;

    this.stompClient = new Client({
      // SockJS dùng http/https, KHÔNG dùng ws/wss
      webSocketFactory: () => {
        return new SockJS(API_CONFIG.WEBSOCKET_URL);
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.stompClient.onConnect = (frame) => {
      this.reconnectAttempts = 0;

      // resubscribe tất cả phòng đã lưu handler
      this._resubscribeAllInternal();

      // subscribe kênh cá nhân nếu đã đăng ký trước
      if (this.personalHandler) {
        this._subscribePersonalInternal(this.personalHandler);
      }

      // subscribe kênh trạng thái online nếu đã đăng ký trước
      if (this.presenceHandler) {
        this.subscribeToPresence(this.presenceHandler);
      }

      // Gửi lại các tin nhắn còn tồn đọng khi mất kết nối (offline queue)
      this.flushOfflineQueue();

      onConnect?.(frame);
    };

    this.stompClient.onStompError = (frame) => {
      logger.error('STOMP error:', {
        message: frame.headers?.message,
        description: frame.body,
        command: frame.command
      });
      onError?.(frame);
    };

    this.stompClient.onWebSocketError = (err) => {
      logger.error('WebSocket connection error:', {
        message: err.message,
        type: err.type,
        target: err.target?.url
      });
      onError?.(err);
    };

    this.stompClient.onWebSocketClose = () => {
      console.warn('WS closed');
      if (this.stompClient && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        this.stompClient.reconnectDelay =
          this.reconnectDelay * this.reconnectAttempts;
      }
    };

    this.stompClient.activate();
  }

  // --- Conversation topic ---
  subscribeToConversation(conversationId, messageHandler) {
    const topic = `/topic/${conversationId}`;

    // LƯU handler trước để có thể resubscribe sau khi connect
    this.messageHandlers.set(conversationId, messageHandler);

    if (!this.connected) {
      console.warn('WS not connected, will subscribe after connect');
      return null;
    }

    // Hủy sub cũ nếu có
    this.unsubscribeFromConversation(conversationId);

    try {
      const sub = this.stompClient.subscribe(topic, (message) => {
        try {
          const data = JSON.parse(message.body);
          messageHandler?.(data);
        } catch (e) {
          console.error('Parse message error:', e);
        }
      });

      this.subscriptions.set(conversationId, sub);
      return sub;
    } catch (error) {
      console.error('Error subscribing to conversation:', error);
      return null;
    }
  }

  unsubscribeFromConversation(conversationId) {
    const sub = this.subscriptions.get(conversationId);
    if (sub) sub.unsubscribe();
    this.subscriptions.delete(conversationId);
    // Giữ messageHandler hay xoá? → tuỳ bạn.
    // Nếu muốn khi mở lại tab tự nhận tiếp, giữ lại handler:
    // this.messageHandlers.delete(conversationId);
  }

  _resubscribeAllInternal() {
    if (!this.connected) return;
    for (const [conversationId, handler] of this.messageHandlers) {
      try {
        const topic = `/topic/${conversationId}`;
        try {
          this.subscriptions.get(conversationId)?.unsubscribe();
        } catch (e) {}

        const sub = this.stompClient.subscribe(topic, (message) => {
          try {
            const data = JSON.parse(message.body);
            handler?.(data);
          } catch (e) {
            console.error('Parse message error:', e);
          }
        });

        this.subscriptions.set(conversationId, sub);
      } catch (e) {
        console.error('Error resubscribing conversation:', conversationId, e);
      }
    }
  }

  // --- Personal queue ---
  subscribeToPersonalQueue(messageHandler) {
    // KHÔNG kèm userId, vì server map theo Principal với prefix /user
    this.personalHandler = messageHandler;

    if (!this.connected) {
      console.warn('WS not connected, will subscribe personal after connect');
      return null;
    }
    return this._subscribePersonalInternal(messageHandler);
  }

  _subscribePersonalInternal(handler) {
    if (!this.connected) return null;
    const dest = '/user/queue/messages';
    try {
      if (this.personalSub) {
        try { this.personalSub.unsubscribe(); } catch(e) {}
      }
      this.personalSub = this.stompClient.subscribe(dest, (message) => {
        try {
          const data = JSON.parse(message.body);
          handler?.(data);
        } catch (e) {
          console.error('Parse personal message error:', e);
        }
      });
      return this.personalSub;
    } catch (e) {
      console.error('Error subscribing to personal queue:', e);
      return null;
    }
  }

  // --- Presence topic ---
  subscribeToPresence(presenceHandler) {
    this.presenceHandler = presenceHandler;

    if (!this.connected) {
      console.warn('WS not connected, will subscribe presence after connect');
      return null;
    }

    const dest = '/topic/presence';
    try {
      if (this.presenceSub) {
        try { this.presenceSub.unsubscribe(); } catch(e) {}
      }
      this.presenceSub = this.stompClient.subscribe(dest, (message) => {
        try {
          const data = JSON.parse(message.body);
          presenceHandler?.(data);
        } catch (e) {
          console.error('Parse presence message error:', e);
        }
      });
      return this.presenceSub;
    } catch (e) {
      console.error('Error subscribing to presence:', e);
      return null;
    }
  }

  // --- Send ---
  sendMessage(conversationId, messageText, messageType = 'TEXT', extra = {}) {
    if (!this.connected) {
      console.warn('WS not connected, buffering to offlineQueue');
      this.offlineQueue.push({ conversationId, messageText, messageType, extra });
      return false;
    }
    
    // Khớp với MessageRequest format của backend
    const payload = {
      messageText: messageText,
      conversationId: conversationId,
      type: messageType.toUpperCase(), // TEXT, IMAGE, FILE, VIDEO
      action: extra.action || 'SEND',
      messageId: extra.messageId,
      replyToMessageId: extra.replyToMessageId,
      replyToMessageText: extra.replyToMessageText,
      replyToUserId: extra.replyToUserId,
      reaction: extra.reaction
    };
    
    // Khớp @MessageMapping("/chat") trên BE
    this.stompClient.publish({
      destination: `/app/chat`,
      headers: { Authorization: `Bearer ${this.token}` },
      body: JSON.stringify(payload),
    });
    
    return true;
  }

  sendTyping(conversationId) {
    return this.sendMessage(conversationId, '', 'TEXT', { action: 'TYPING' });
  }

  sendReaction(conversationId, messageId, reaction) {
    return this.sendMessage(conversationId, '', 'TEXT', { action: 'REACT', messageId, reaction });
  }

  editMessage(conversationId, messageId, newText) {
    return this.sendMessage(conversationId, newText, 'TEXT', { action: 'EDIT', messageId });
  }

  deleteMessage(conversationId, messageId) {
    return this.sendMessage(conversationId, '', 'TEXT', { action: 'DELETE', messageId });
  }

  pinMessage(conversationId, messageId, isPinned) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/chat',
        headers: { Authorization: `Bearer ${this.token}` },
        body: JSON.stringify({
          conversationId,
          messageId,
          action: isPinned ? 'PIN' : 'UNPIN'
        })
      });
    }
  }

  sendReadReceipt(conversationId, messageId) {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.publish({
        destination: '/app/chat',
        headers: { Authorization: `Bearer ${this.token}` },
        body: JSON.stringify({
          conversationId,
          messageId,
          action: 'SEEN'
        })
      });
    }
  }

  // --- Disconnect ---
  disconnect() {
    // huỷ sub phòng
    for (const sub of this.subscriptions.values()) {
      sub.unsubscribe();
    }
    this.subscriptions.clear();

    // huỷ sub personal
    this.personalSub?.unsubscribe?.();
    this.personalSub = null;

    // huỷ sub presence
    this.presenceSub?.unsubscribe?.();
    this.presenceSub = null;
    this.presenceHandler = null;

    this.stompClient?.deactivate();
    this.stompClient = null;
  }

  getConnectionStatus() {
    const status = {
      connected: this.connected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      stompClient: !!this.stompClient,
      subscriptions: this.subscriptions.size,
      messageHandlers: this.messageHandlers.size
    };
    
    return status;
  }
}

const webSocketService = new WebSocketService();

// Export ra window để ConversationList có thể truy cập
if (typeof window !== 'undefined') {
  window.webSocketService = webSocketService;
}

export default webSocketService;
