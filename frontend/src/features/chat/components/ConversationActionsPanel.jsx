import React from 'react';
import { Trash2, LogOut } from 'lucide-react';

const ConversationActionsPanel = ({
  selectedConversation,
  isOwnerOrAdmin,
  handleDeleteConversation,
  onShowLeaveConfirm,
  t
}) => {
  const isGroup = selectedConversation.type === 'group' || selectedConversation.isGroup;

  return (
    <div className="p-4 border-t border-gray-200 space-y-2">
      {(isGroup && isOwnerOrAdmin) || !isGroup ? (
        <button
          onClick={handleDeleteConversation}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>{isGroup ? (t ? t('disbandGroup') : 'Giải Tán Nhóm') : (t ? t('deleteConversation') : 'Xóa Cuộc Trò Chuyện')}</span>
        </button>
      ) : null}
      
      {isGroup && (
        <button
          onClick={() => onShowLeaveConfirm && onShowLeaveConfirm()}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition-colors font-medium text-sm border border-red-200"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('leaveGroup') || 'Rời Nhóm'}</span>
        </button>
      )}
    </div>
  );
};

export default ConversationActionsPanel;
