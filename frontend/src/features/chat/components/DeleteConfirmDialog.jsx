import { X } from 'lucide-react';
import webSocketService from '../../../services/WebSocketService';

const DeleteConfirmDialog = ({ deleteConfirmDialog, setDeleteConfirmDialog, selectedConversation, onOptimisticDelete }) => {
  if (!deleteConfirmDialog.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Xóa tin nhắn
          </h2>
          <button
            onClick={() => setDeleteConfirmDialog({ isOpen: false, messageId: null })}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 p-4">
          <p className="text-gray-600 dark:text-gray-300 text-sm">Bạn có chắc chắn muốn xóa tin nhắn này?</p>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex space-x-3 flex-shrink-0">
          <button
            onClick={() => setDeleteConfirmDialog({ isOpen: false, messageId: null })}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              if (deleteConfirmDialog.messageId) {
                const cid = selectedConversation.conversationId || selectedConversation.id;
                if (onOptimisticDelete) {
                  onOptimisticDelete(deleteConfirmDialog.messageId);
                }
                webSocketService.deleteMessage(cid, deleteConfirmDialog.messageId);
              }
              setDeleteConfirmDialog({ isOpen: false, messageId: null });
            }}
            className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog;
