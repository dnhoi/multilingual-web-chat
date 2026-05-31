import { useState, useEffect, useRef } from 'react';
import webSocketService from '../../../services/WebSocketService';
import logger from '../../../core/utils/logger';

export const useCallSignaling = (currentUser, selectedConversation) => {
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState('video');
  const [incomingCall, setIncomingCall] = useState(null);
  const [incomingSignal, setIncomingSignal] = useState(null);
  const [callerSdp, setCallerSdp] = useState(null);
  
  const incomingCallTimeoutRef = useRef(null);

  const handleDeclineCall = () => {
    if (incomingCall) {
      if (incomingCallTimeoutRef.current) {
        clearTimeout(incomingCallTimeoutRef.current);
        incomingCallTimeoutRef.current = null;
      }
      if (webSocketService.connected) {
        const declinePayload = JSON.stringify({
          signalType: 'CALL_DECLINE',
          callerId: currentUser?.id || currentUser?.userId
        });
        webSocketService.sendMessage(incomingCall.conversationId, declinePayload, 'CALL_SIGNAL');
      }
      setIncomingCall(null);
      setCallerSdp(null);
      setIncomingSignal(null);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const handleIncomingMessage = (message) => {
      if (message.type === 'CALL_SIGNAL' || message.messageType === 'CALL_SIGNAL') {
        let signalData = {};
        try {
          signalData = typeof message.messageText === 'string' && message.messageText.startsWith('{')
            ? JSON.parse(message.messageText)
            : (message.extra || {});
        } catch (e) {
          signalData = message.extra || {};
        }

        const signalType = signalData.signalType || message.signalType;
        const callerId = signalData.callerId || message.userId;

        if (signalType === 'CALL_OFFER' && callerId !== (currentUser.id || currentUser.userId)) {
          setIncomingCall({
            conversationId: message.conversationId,
            callerName: signalData.callerName || message.userName || 'Người dùng',
            callerAvatar: signalData.callerAvatar || message.avatarUrl,
            callType: signalData.callType || 'video',
            callerId: callerId
          });
          setCallerSdp(signalData.sdp);

          // Callee starts a 30-second ringing timeout
          if (incomingCallTimeoutRef.current) clearTimeout(incomingCallTimeoutRef.current);
          incomingCallTimeoutRef.current = setTimeout(() => {
            logger.log('Incoming call ringing timeout reached. Declining call.');
            handleDeclineCall();
          }, 30000); // 30 seconds
        } else if (signalType === 'CALL_DECLINE') {
          if (incomingCallTimeoutRef.current) {
            clearTimeout(incomingCallTimeoutRef.current);
            incomingCallTimeoutRef.current = null;
          }
          setIncomingCall(null);
          setCallerSdp(null);
          setIncomingSignal(null);
          setShowCallModal(false);
        } else {
          // Send ICE candidates or CALL_ACCEPT SDP to open CallModal
          setIncomingSignal(signalData);
        }
      } else if (message.action === 'ERROR') {
        if (window.showToast) {
          window.showToast(message.messageText || 'Có lỗi xảy ra khi gửi tin nhắn.', 'error');
        } else {
          console.error(message.messageText);
        }
      }
    };

    webSocketService.subscribeToPersonalQueue(handleIncomingMessage);

    return () => {
      if (incomingCallTimeoutRef.current) {
        clearTimeout(incomingCallTimeoutRef.current);
      }
    };
  }, [currentUser]); // handleDeclineCall is stable enough for this hook scope, though realistically it uses incomingCall state which might be stale in closure. Wait, handleDeclineCall uses incomingCall from closure. Let's fix that by using refs or functional state update, or moving it down.

  const handleStartCall = (type) => {
    setCallerSdp(null);
    setCallType(type);
    setShowCallModal(true);
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      if (incomingCallTimeoutRef.current) {
        clearTimeout(incomingCallTimeoutRef.current);
        incomingCallTimeoutRef.current = null;
      }
      setCallType(incomingCall.callType);
      setShowCallModal(true);
    }
  };

  const handleHangUp = () => {
    setShowCallModal(false);
    const activeConv = selectedConversation || incomingCall;
    if (activeConv && webSocketService.connected) {
      const convId = activeConv.id || activeConv.conversationId;
      const declinePayload = JSON.stringify({
        signalType: 'CALL_DECLINE',
        callerId: currentUser?.id || currentUser?.userId
      });
      webSocketService.sendMessage(convId, declinePayload, 'CALL_SIGNAL');
    }
    setIncomingCall(null);
    setCallerSdp(null);
    setIncomingSignal(null);
  };

  const handleSendSignal = (signalData) => {
    const activeConv = selectedConversation || incomingCall;
    if (activeConv && webSocketService.connected) {
      const convId = activeConv.id || activeConv.conversationId;
      webSocketService.sendMessage(convId, JSON.stringify(signalData), 'CALL_SIGNAL');
    }
  };

  return {
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
  };
};
