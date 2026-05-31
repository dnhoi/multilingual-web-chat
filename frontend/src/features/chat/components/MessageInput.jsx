import { useState, useRef } from 'react';
import { Paperclip, Smile, Send, X, File, Image, Video, Music, FileText, Mic, Square, BarChart2 } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToast } from '../../../contexts/ToastContext';
import cloudinaryService from '../../../services/CloudinaryService';

import { API_CONFIG } from '../../../config/api';
import EmojiPicker from './EmojiPicker';
import PollModal from './PollModal';
import AttachmentPreview from './AttachmentPreview';
import { useAudioRecorder } from './useAudioRecorder';

const MessageInput = ({ onSendMessage, disabled = false, replyMessage = null, onCancelReply = null, onTyping = null }) => {
  const { showToast } = useToast();
  const [message, setMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const lastTypingTimeRef = useRef(0);
  const { t } = useLanguage();

  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isSendingLocation, setIsSendingLocation] = useState(false);

  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording
  } = useAudioRecorder(onSendMessage, setIsUploading, showToast);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    const now = Date.now();
    if (now - lastTypingTimeRef.current > 2000) {
      lastTypingTimeRef.current = now;
      onTyping?.();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((message.trim() || attachments.length > 0) && !disabled && !isUploading) {
      const extra = replyMessage ? {
        replyToMessageId: replyMessage.id,
        replyToMessageText: replyMessage.originalText,
        replyToUserId: replyMessage.senderId
      } : {};

      if (attachments.length > 0) {
        setIsUploading(true);
        try {
          const uploadedAttachments = await Promise.all(
            attachments.map(async (attachment, index) => {
              if (attachment.uploaded) {
                return attachment;
              } else {
                const result = await cloudinaryService.uploadFile(attachment.file);
                if (result.success) {
                  return {
                    ...attachment,
                    uploaded: true,
                    cloudinaryData: result.data
                  };
                } else {
                  throw new Error(`Failed to upload ${attachment.file.name}: ${result.error}`);
                }
              }
            })
          );

          onSendMessage(message.trim(), uploadedAttachments, extra);
          setMessage('');
          setAttachments([]);
          onCancelReply?.();
        } catch (error) {
          showToast(`Tải file lên thất bại: ${error.message}`, 'error');
        } finally {
          setIsUploading(false);
        }
      } else {
        onSendMessage(message.trim(), [], extra);
        setMessage('');
        onCancelReply?.();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    const oversizedFiles = files.filter(file => file.size > API_CONFIG.MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      showToast(`File ${oversizedFiles[0].name} quá lớn! Kích thước tối đa: ${API_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`, 'error');
      return;
    }
    
    const validFiles = files.filter(file => 
      API_CONFIG.ALLOWED_FILE_TYPES.some(type => {
        if (type.endsWith('/*')) {
          const prefix = type.slice(0, -2);
          return file.type.startsWith(prefix);
        }
        return file.type === type;
      })
    );
    
    if (validFiles.length !== files.length) {
      showToast('Chỉ cho phép gửi ảnh, video, audio và tài liệu (PDF, Word, Excel, PowerPoint, Text)!', 'error');
      return;
    }
    
    const newAttachments = validFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded: false
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (type.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    return cloudinaryService.formatFileSize(bytes);
  };

  // Handled by PollModal now

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const oversizedFiles = files.filter(file => file.size > API_CONFIG.MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      showToast(`File ${oversizedFiles[0].name} quá lớn! Kích thước tối đa: ${API_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`, 'error');
      return;
    }

    const validFiles = files.filter(file =>
      API_CONFIG.ALLOWED_FILE_TYPES.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -2));
        }
        return file.type === type;
      })
    );

    if (validFiles.length !== files.length) {
      showToast('Chỉ cho phép gửi ảnh, video, audio và tài liệu (PDF, Word, Excel, PowerPoint, Text)!', 'error');
      return;
    }

    const newAttachments = validFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded: false
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors ${
        isDragging ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 border-2 border-dashed' : ''
      }`}
    >
      <PollModal
        showPollModal={showPollModal}
        setShowPollModal={setShowPollModal}
        pollQuestion={pollQuestion}
        setPollQuestion={setPollQuestion}
        pollOptions={pollOptions}
        setPollOptions={setPollOptions}
        onSendMessage={onSendMessage}
      />

      {replyMessage && (
        <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded flex items-center justify-between">
          <div className="flex flex-col text-xs text-gray-700 dark:text-gray-200">
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              Replying to {replyMessage.senderId}
            </span>
            <span className="truncate max-w-xs italic text-gray-500 dark:text-gray-400">
              {replyMessage.originalText || 'Attachment message'}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <AttachmentPreview 
        attachments={attachments}
        setAttachments={setAttachments}
      />

      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title={t('attachments.attach')}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar"
            className="hidden"
          />
        </div>

        <div className="flex-1">
          <textarea
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={t('typeMessage')}
            disabled={disabled || isUploading}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            rows="1"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title={t('attachments.emoji')}
          >
            <Smile className="w-5 h-5" />
          </button>
          
          <EmojiPicker
            isOpen={isEmojiPickerOpen}
            onClose={() => setIsEmojiPickerOpen(false)}
            onEmojiSelect={handleEmojiSelect}
          />
        </div>

        {/* Poll & Location buttons */}
        <button
          type="button"
          onClick={() => setShowPollModal(true)}
          disabled={disabled}
          className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          title="Tạo cuộc bình chọn (Poll)"
        >
          <BarChart2 className="w-5 h-5" />
        </button>


        <div>
          {isRecording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 animate-pulse transition-colors"
              title="Dừng & Gửi ghi âm"
            >
              <Square className="w-4 h-4 fill-current" />
              <span className="text-xs font-mono font-semibold">
                {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:{String(recordingTime % 60).padStart(2, '0')}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled || isUploading}
              className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Ghi âm tin nhắn thoại"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={(!message.trim() && attachments.length === 0) || disabled || isUploading}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={isUploading ? t('attachments.uploading') : t('attachments.send')}
        >
          {isUploading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="text-xs">Uploading...</span>
            </div>
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
