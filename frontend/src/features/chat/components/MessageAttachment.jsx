import React from 'react';
import { FileText, Download, FileSpreadsheet, Archive, FileCode, File } from 'lucide-react';
import cloudinaryService from '../../../services/CloudinaryService';

const getFileDetails = (fileName = '') => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') {
    return {
      ext: 'PDF',
      bgColor: 'bg-red-500/10 dark:bg-red-500/20',
      textColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800/40',
      icon: <FileCode className="w-6 h-6 text-red-500" />
    };
  }
  if (ext === 'doc' || ext === 'docx') {
    return {
      ext: 'DOCX',
      bgColor: 'bg-blue-500/10 dark:bg-blue-500/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800/40',
      icon: <FileText className="w-6 h-6 text-blue-500" />
    };
  }
  if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') {
    return {
      ext: 'XLSX',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800/40',
      icon: <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
    };
  }
  if (ext === 'zip' || ext === 'rar' || ext === '7z') {
    return {
      ext: 'ZIP',
      bgColor: 'bg-purple-500/10 dark:bg-purple-500/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800/40',
      icon: <Archive className="w-6 h-6 text-purple-500" />
    };
  }
  return {
    ext: ext.toUpperCase() || 'FILE',
    bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-200 dark:border-indigo-800/40',
    icon: <File className="w-6 h-6 text-indigo-500" />
  };
};

const MessageAttachment = ({ attachment, setSelectedImage, t }) => {
  if (!attachment) return null;

  const handleDownloadFile = async (e, fileUrl, fileName) => {
    e.preventDefault();
    if (!fileUrl) return;

    // Handle Data URLs or Blob URLs
    if (fileUrl.startsWith('data:') || fileUrl.startsWith('blob:')) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // List of candidate URLs to try for Cloudinary (prefer .jpg conversion first to avoid 401 console logs)
    const candidateUrls = [];
    if (fileUrl.includes('cloudinary.com') && fileUrl.match(/\.pdf$/i)) {
      candidateUrls.push(fileUrl.replace(/\.pdf$/i, '.jpg'));
      candidateUrls.push(fileUrl.replace(/\.pdf$/i, '.png'));
    }
    candidateUrls.push(fileUrl);

    for (const url of candidateUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName || 'download';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
          return;
        }
      } catch (err) {
        // Try next candidate
      }
    }

    const fallbackUrl = fileUrl.includes('cloudinary.com') && fileUrl.match(/\.pdf$/i)
      ? fileUrl.replace(/\.pdf$/i, '.jpg')
      : fileUrl;

    const link = document.createElement('a');
    link.href = fallbackUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    if (fileName) {
      link.setAttribute('download', fileName);
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  switch (attachment.type) {
    case 'IMAGE':
      return (
        <div className="relative inline-block my-1">
          <img
            src={attachment.url}
            alt="Image attachment"
            className="max-w-full max-h-96 object-contain rounded-xl cursor-pointer hover:opacity-95 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700"
            onClick={() => setSelectedImage(attachment.url)}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        </div>
      );
    
    case 'VIDEO':
      return (
        <div className="relative inline-block my-1">
          <video
            controls
            className="max-w-full max-h-96 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
            poster={attachment.thumbnail}
          >
            <source src={attachment.url} type={`video/${attachment.format}`} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    
    case 'AUDIO':
      return (
        <div className="p-2.5 bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm min-h-[60px] flex items-center my-1">
          <audio 
            src={attachment.url} 
            controls 
            className="w-full min-w-[240px] sm:min-w-[300px] h-9 accent-blue-500"
          />
        </div>
      );
    
    case 'DOCUMENT':
    case 'FILE': {
      const fileInfo = getFileDetails(attachment.name);
      return (
        <div className={`my-1.5 p-3 bg-white dark:bg-gray-800/95 backdrop-blur-md rounded-xl border ${fileInfo.borderColor} shadow-sm hover:shadow-md transition-all duration-200 group max-w-sm`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg ${fileInfo.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
              {fileInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                {attachment.name || 'Tệp đính kèm'}
              </p>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${fileInfo.bgColor} ${fileInfo.textColor}`}>
                  {fileInfo.ext}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {attachment.size ? cloudinaryService.formatFileSize(attachment.size) : 'Tệp dữ liệu'}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => handleDownloadFile(e, attachment.url, attachment.name)}
              className="flex items-center space-x-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-3 py-1.5 rounded-lg shadow-sm hover:shadow active:scale-95 transition-all duration-150 cursor-pointer flex-shrink-0"
              title="Tải tệp về máy"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t && typeof t === 'function' && t('attachments.download') && t('attachments.download') !== 'attachments.download' ? t('attachments.download') : 'Tải về'}</span>
            </button>
          </div>
        </div>
      );
    }
    
    default:
      return null;
  }
};

export default MessageAttachment;
