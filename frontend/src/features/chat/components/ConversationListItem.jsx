import { getAvatarUrl } from '../../../config/api';

/* ─── Badge cho type group ─── */
function TypeBadge() {
  return (
    <span
      className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full leading-none bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300"
    >
      Group
    </span>
  );
}

/* ─── Tin nhắn cuối dạng text gọn ─── */
function getLastMessagePreview(msg, currentUser) {
  if (!msg) return '';
  const type = msg?.type;
  const text = msg?.originalText || '';

  if (type === 'POLL' || text.includes('"question":') || text.includes('"options":')) return '📊 Cuộc thăm dò';
  if (type === 'LOCATION' || text.includes('"latitude":') || text.includes('"longitude":')) return '📍 Vị trí';
  if (type === 'IMAGE' || text.startsWith('📷')) return '🖼️ Hình ảnh';
  if (type === 'VIDEO' || text.startsWith('🎥') || text.startsWith('🎬')) return '🎥 Video';
  if (type === 'AUDIO' || text.startsWith('🎵')) return '🎵 Âm thanh';
  if (type === 'FILE' || type === 'DOCUMENT' || text.startsWith('📎')) {
    const fileName = text.includes('|') ? text.split('|')[1] : null;
    return fileName ? `📎 ${fileName}` : '📎 Tệp đính kèm';
  }
  if (type === 'CALL_SIGNAL' || text.startsWith('📞')) return '📞 Cuộc gọi';
  if (text.startsWith('http://') || text.startsWith('https://')) {
    const fileName = text.includes('|') ? text.split('|')[1] : null;
    return fileName ? `📎 ${fileName}` : '📎 Tệp đính kèm';
  }
  return text;
}

const ConversationListItem = ({
  conversation,
  isSelected,
  isLastConversation,
  lastConversationElementRef,
  onClick,
  getConversationAvatar,
  getConversationName,
  getOtherParticipantOnlineStatus,
  currentUser,
  t,
  formatTime
}) => {
  const isGroup = conversation.type === 'group' || conversation.isGroup;
  const isOnline = !isGroup && getOtherParticipantOnlineStatus(conversation);
  const hasUnread = conversation.unreadCount > 0;

  /* Resolve last message sender prefix for groups */
  const senderPrefix = (() => {
    if (!isGroup || !conversation.lastMessage?.senderId) return '';
    const senderId = conversation.lastMessage.senderId;
    if (senderId === currentUser?.id || senderId === currentUser?.userId) return 'Tôi: ';
    const sender = conversation.participants?.find(p => p.userId === senderId || p.id === senderId);
    if (sender) return (sender.fullName || sender.name || 'Unknown') + ': ';
    return '';
  })();

  const preview = getLastMessagePreview(conversation.lastMessage, currentUser);

  return (
    <div
      ref={isLastConversation ? lastConversationElementRef : null}
      onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-xl mx-2 transition-all duration-150 ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/20 shadow-sm'
          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
      }`}
    >
      {/* Selected indicator bar */}
      {isSelected && (
        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-blue-500" />
      )}

      {/* Avatar with online badge */}
      <div className="relative flex-shrink-0">
        <img
          src={getConversationAvatar(conversation)}
          alt={getConversationName(conversation)}
          className={`w-11 h-11 rounded-full object-cover ring-2 ${
            isSelected ? 'ring-blue-200 dark:ring-blue-800' : 'ring-zinc-200 dark:ring-zinc-700'
          }`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.target.src = getAvatarUrl(null, isGroup ? 'group' : 'user');
          }}
        />
        {!isGroup && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${
              isOnline ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-600'
            }`}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name row */}
        <div className="flex items-baseline justify-between gap-1 mb-0.5">
          <div className="flex items-center min-w-0">
            <span className={`text-sm truncate ${hasUnread ? 'font-semibold text-zinc-900 dark:text-zinc-50' : 'font-medium text-zinc-700 dark:text-zinc-200'}`}>
              {getConversationName(conversation)}
            </span>
            {isGroup && <TypeBadge type={conversation.type} id={conversation.id} />}
          </div>
          <span className={`text-[11px] flex-shrink-0 ${hasUnread ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-zinc-400 dark:text-zinc-500'}`}>
            {conversation.lastMessage?.timestamp ? formatTime(conversation.lastMessage.timestamp) : ''}
          </span>
        </div>

        {/* Preview row */}
        <div className="flex items-center justify-between gap-1">
          <p className={`text-xs truncate flex-1 ${hasUnread ? 'font-medium text-zinc-700 dark:text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'}`}>
            {senderPrefix && <span className="text-zinc-400">{senderPrefix}</span>}
            {preview || <span className="italic text-zinc-400">{t('noMessages') || 'Chưa có tin nhắn'}</span>}
          </p>

          {/* Unread badge */}
          {hasUnread && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-blue-500 text-white rounded-full flex-shrink-0">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>

        {/* Translation preview */}
        {conversation.lastMessage?.translatedText && (
          <p className={`text-[11px] truncate mt-0.5 ${hasUnread ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'}`}>
            🤖 {conversation.lastMessage.translatedText}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConversationListItem;
