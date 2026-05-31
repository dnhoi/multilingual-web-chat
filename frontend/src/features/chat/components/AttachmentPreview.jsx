import React from 'react';
import { X, FileText } from 'lucide-react';
import cloudinaryService from '../../../services/CloudinaryService';

const AttachmentPreview = ({ attachments, setAttachments }) => {
  if (attachments.length === 0) return null;

  const removeAttachment = (id, index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {attachments.length} file(s) selected
        </span>
        <button
          type="button"
          onClick={() => setAttachments([])}
          className="text-sm text-red-500 hover:text-red-700"
        >
          Clear all
        </button>
      </div>
      
      <div className="space-y-2">
        {attachments.map((attachment, index) => (
          <div key={index} className="flex items-center space-x-3 p-2 bg-white dark:bg-gray-700 rounded border">
            <div className="flex-shrink-0">
              {attachment.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(attachment.file)}
                  alt={attachment.name}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : attachment.type.startsWith('video/') ? (
                <video
                  src={URL.createObjectURL(attachment.file)}
                  className="w-12 h-12 object-cover rounded"
                  muted
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                  <FileText className="w-6 h-6 text-gray-500" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {attachment.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {cloudinaryService.formatFileSize(attachment.size)}
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => removeAttachment(attachment.id, index)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentPreview;
