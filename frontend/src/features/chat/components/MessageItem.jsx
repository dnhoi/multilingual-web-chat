import React, { useState, useEffect } from 'react';
import { Bot, Flag, Phone, PhoneMissed, Video, Pencil, Trash2, CornerUpLeft, Smile } from 'lucide-react';
import { getUserById } from '../../auth/api/auth.api';

if (!window.usersCacheMap) {
  window.usersCacheMap = {};
}

const MessageItem = React.memo(({
  message,
  previousMessage,
  isOwnMessage,
  isSearchMatched,
  getSenderAvatar,
  getSenderName,
  shouldShowDateSeparator,
  formatDateSeparator,
  formatTime,
  renderPollCard,
  renderAttachment,
  t,
  activeActionMenuId,
  setActiveActionMenuId,
  showReactionPickerId,
  setShowReactionPickerId,
  editingMessageId,
  setEditingMessageId,
  editingText,
  setEditingText,
  handleSaveEdit,
  handleDeleteMsg,
  handleSendReactionEmoji,
  setReportingMessage,
  onReplyMessage,
  selectedConversation
}) => {
  const [notificationText, setNotificationText] = useState(message.originalText || message.messageText || '');

  const isWithin24Hours = React.useMemo(() => {
    const rawTime = message.sentDatetime || message.timestamp || message.createdAt;
    if (!rawTime) return true;
    const msgTime = new Date(rawTime).getTime();
    if (isNaN(msgTime)) return true;
    return Date.now() - msgTime <= 24 * 60 * 60 * 1000;
  }, [message.sentDatetime, message.timestamp, message.createdAt]);

  useEffect(() => {
    if (message.type !== 'NOTIFICATION' && message.senderId !== 'SYSTEM') return;

    let rawText = message.originalText || message.messageText || '';
    if (!rawText) return;

    const matches = rawText.match(/US[A-Za-z0-9_-]{5,20}/g);
    if (!matches) {
      setNotificationText(rawText);
      return;
    }

    let isMounted = true;
    const resolveNames = async () => {
      let updatedText = rawText;
      const participantsList = selectedConversation?.participants || selectedConversation?.userProfiles || [];

      for (const uid of matches) {
        let userObj = participantsList.find(p => p.userId === uid || p.id === uid || p.username === uid);

        if (!userObj && window.usersCacheMap[uid]) {
          userObj = window.usersCacheMap[uid];
        }

        if (!userObj) {
          try {
            const res = await getUserById(uid);
            const userData = res?.result || res?.data;
            if (userData) {
              userObj = userData;
              window.usersCacheMap[uid] = userData;
            }
          } catch (err) {
            // lookup fail — keep uid as-is
          }
        }

        if (userObj) {
          const resolvedName = userObj.fullName || userObj.name || userObj.username;
          if (resolvedName) {
            updatedText = updatedText.replaceAll(uid, resolvedName);
          }
        }
      }

      if (isMounted) setNotificationText(updatedText);
    };

    resolveNames();
    return () => { isMounted = false; };
  }, [message.originalText, message.messageText, message.id, selectedConversation]);

  /* ─── System / Notification message ─── */
  if (message.type === 'NOTIFICATION' || message.senderId === 'SYSTEM') {
    return (
      <div id={`msg-item-${message.id}`} className="flex justify-center my-3 w-full">
        <div className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs px-3.5 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <span className="text-xs">ℹ️</span>
          <span>{notificationText}</span>
        </div>
      </div>
    );
  }

  /* ─── Date separator ─── */
  const dateSep = shouldShowDateSeparator(message, previousMessage) && (
    <div className="flex items-center justify-center my-5">
      <div className="bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 text-xs font-medium px-3 py-1 rounded-full">
        {formatDateSeparator(message.timestamp)}
      </div>
    </div>
  );

  /* ─── Call signal bubble ─── */
  const callSignal = message.type === 'CALL_SIGNAL' && (() => {
    const isMissed = !message.originalText ||
      message.originalText.includes('CALL_DECLINE') ||
      message.originalText.includes('CALL_CANCEL');
    const isVideo = message.originalText?.toLowerCase().includes('video');
    return (
      <div className={`inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border font-medium ${
        isMissed
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
          : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
      }`}>
        {isMissed
          ? <PhoneMissed className="w-3.5 h-3.5 flex-shrink-0" />
          : isVideo ? <Video className="w-3.5 h-3.5 flex-shrink-0" /> : <Phone className="w-3.5 h-3.5 flex-shrink-0" />}
        <span>
          {isMissed
            ? (isOwnMessage ? 'Cuộc gọi đã hủy' : 'Cuộc gọi nhỡ')
            : (isVideo ? 'Cuộc gọi video' : 'Cuộc gọi thoại')}
        </span>
      </div>
    );
  })();

  return (
    <>
      {dateSep}
      <div
        id={`msg-item-${message.id}`}
        className={`group relative transition-all ${
          isSearchMatched ? 'ring-2 ring-amber-400 bg-amber-50/60 dark:bg-amber-900/20 p-2 rounded-2xl' : ''
        }`}
      >
        <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}
            style={{ maxWidth: '75%' }}
          >
            {/* Avatar (other) */}
            {!isOwnMessage && (
              <img
                src={getSenderAvatar(message.senderId)}
                alt={getSenderName(message.senderId)}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1 ring-1 ring-zinc-200 dark:ring-zinc-700"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}

            <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} relative`} style={{ maxWidth: '100%' }}>

              {/* Sender name */}
              {!isOwnMessage && (
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 ml-1">
                  {getSenderName(message.senderId)}
                </span>
              )}

              {/* ─── Action toolbar (hover) ─── */}
              {!message.isDeleted && message.type !== 'CALL_SIGNAL' && (
                <div className={`absolute top-0 ${isOwnMessage ? '-left-28' : '-right-28'} ${
                  activeActionMenuId === message.id ? 'flex' : 'hidden group-hover:flex'
                } items-center gap-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg rounded-full px-1.5 py-1 z-10`}>
                  <ActionBtn title="Trả lời" onClick={() => { onReplyMessage?.(message); setActiveActionMenuId(null); }}>
                    <CornerUpLeft className="w-3 h-3" />
                  </ActionBtn>
                  <ActionBtn title="Cảm xúc" onClick={() => { setShowReactionPickerId(showReactionPickerId === message.id ? null : message.id); setActiveActionMenuId(null); }}>
                    <Smile className="w-3 h-3" />
                  </ActionBtn>
                  {!isOwnMessage && (
                    <ActionBtn title="Báo cáo" onClick={() => { setReportingMessage(message); setActiveActionMenuId(null); }} danger>
                      <Flag className="w-3 h-3" />
                    </ActionBtn>
                  )}
                  {isOwnMessage && isWithin24Hours && (
                    <>
                      <ActionBtn title={t('edit') || "Sửa"} onClick={() => { setEditingMessageId(message.id); setEditingText(message.originalText); setActiveActionMenuId(null); }}>
                        <Pencil className="w-3 h-3" />
                      </ActionBtn>
                      <ActionBtn title={t('delete') || "Xóa"} onClick={() => { handleDeleteMsg(message); setActiveActionMenuId(null); }} danger>
                        <Trash2 className="w-3 h-3" />
                      </ActionBtn>
                    </>
                  )}
                </div>
              )}

              {/* ─── Reaction picker ─── */}
              {showReactionPickerId === message.id && (
                <div className="absolute -top-10 z-20 flex gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl rounded-full px-3 py-1.5 text-base">
                  {['👍', '❤️', '😂', '😮', '🔥', '😢'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleSendReactionEmoji(message, emoji)}
                      className="hover:scale-125 transition-transform leading-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* ─── Message bubble ─── */}
              <div
                onContextMenu={(e) => {
                  e.preventDefault();
                  setActiveActionMenuId(activeActionMenuId === message.id ? null : message.id);
                }}
                className={`rounded-2xl cursor-pointer transition-shadow ${
                  isOwnMessage
                    ? message.attachment
                      ? 'bg-transparent'
                      : 'bg-blue-600 text-white px-3.5 py-2 shadow-sm hover:shadow-md'
                    : message.attachment
                      ? 'bg-transparent'
                      : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 px-3.5 py-2 shadow-sm hover:shadow-md'
                }`}
                style={{ maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}
              >
                {/* Reply-to preview */}
                {message.replyToMessageText && (
                  <div className="mb-2 px-2 py-1.5 bg-black/10 dark:bg-white/10 border-l-2 border-amber-400 rounded-lg text-xs">
                    <span className="font-semibold block text-amber-500 dark:text-amber-400 mb-0.5">
                      {message.replyToUserId || 'người dùng'}
                    </span>
                    <span className="truncate block opacity-80">{message.replyToMessageText}</span>
                  </div>
                )}

                {/* Editing mode */}
                {editingMessageId === message.id ? (
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="px-2 py-1.5 text-sm text-zinc-900 bg-white rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      autoFocus
                    />
                    <div className="flex gap-2 text-xs">
                      <button onClick={() => handleSaveEdit(message.id)} className="bg-blue-600 text-white px-3 py-1 rounded-lg font-medium">Lưu</button>
                      <button onClick={() => setEditingMessageId(null)} className="bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded-lg">Hủy</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Text message */}
                    {message.type === 'TEXT' && message.originalText && (
                      <p className={`text-sm break-words whitespace-pre-wrap ${message.isDeleted ? 'italic opacity-50' : ''}`}>
                        {message.originalText}
                        {message.isEdited && !message.isDeleted && (
                          <span className="text-[10px] ml-1.5 opacity-50 italic">(đã sửa)</span>
                        )}
                      </p>
                    )}

                    {/* Call signal */}
                    {callSignal}

                    {/* Poll */}
                    {message.type === 'POLL' && renderPollCard(message)}

                    {/* Attachment */}
                    {message.attachment && (
                      <div className="mt-1.5">{renderAttachment(message.attachment)}</div>
                    )}

                    {/* Translation */}
                    {message.type === 'TEXT' && !message.isDeleted &&
                      (message.originalText && /\p{L}/u.test(message.originalText)) &&
                      message.translatedText &&
                      !message.translatedText.toUpperCase().includes('PLEASE SELECT TWO DISTINCT LANGUAGES') &&
                      !message.translatedText.toUpperCase().includes('MYMEMORY HAS SEEN ALL') && (
                        <div className={`mt-2 pt-2 border-t ${isOwnMessage ? 'border-white/20' : 'border-zinc-200 dark:border-zinc-600'}`}>
                          <div className="flex items-center gap-1 mb-1">
                            <Bot className="w-3 h-3 opacity-60" />
                            <span className="text-[10px] opacity-60 font-medium">
                              {t('translation') || 'Bản dịch'}
                            </span>
                          </div>
                          {!message.translatedText ? (
                            <div className="flex items-center gap-2">
                              {message.isTranslating && (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current opacity-60" />
                              )}
                              <p className="text-xs opacity-60 italic">
                                {message.isTranslating ? (t('translating') || 'Đang dịch...') : (t('noTranslation') || 'Không có bản dịch')}
                              </p>
                            </div>
                          ) : (
                            <p className={`text-xs break-words rounded-lg px-2 py-1 ${
                              isOwnMessage
                                ? 'bg-white/10 text-white/90'
                                : 'bg-zinc-50 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                            }`}>
                              {message.translatedText}
                            </p>
                          )}
                        </div>
                      )}
                  </>
                )}
              </div>

              {/* Reactions */}
              {message.reactions && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {message.reactions.split(';').filter(Boolean).map((item, idx) => {
                    const parts = item.split(':');
                    const emoji = parts[1] || parts[0];
                    return (
                      <span key={idx} className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full px-1.5 py-0.5 text-xs shadow-sm">
                        {emoji}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Timestamp */}
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 mx-1">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

/* ─── Tiny icon action button ─── */
function ActionBtn({ title, onClick, danger, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
        danger
          ? 'text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'
          : 'text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30'
      }`}
    >
      {children}
    </button>
  );
}

export default MessageItem;
