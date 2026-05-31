class CloudinaryService {
  constructor() {
    // Cloudinary configuration - set these in your VITE environment variables if available
    this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
    this.uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'your-upload-preset';
    this.apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    this.apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;
    
    this.baseUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}`;
  }

  // Upload file to Cloudinary with automatic Data URL fallback
  async uploadFile(file) {
    const readAsDataUrl = (fileToRead) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(fileToRead);
      });
    };

    // If Cloudinary credentials are default placeholder, fallback to local Data URL immediately
    if (!this.cloudName || this.cloudName === 'your-cloud-name' || !this.uploadPreset || this.uploadPreset === 'your-upload-preset') {
      try {
        const dataUrl = await readAsDataUrl(file);
        const messageType = this.getMessageType(file.type, '');
        return {
          success: true,
          data: {
            publicId: 'local_' + Date.now(),
            url: dataUrl,
            format: file.name ? file.name.split('.').pop() : 'png',
            type: messageType,
            size: file.size,
            name: file.name,
            thumbnail: dataUrl
          }
        };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', 'chat-attachments');
      
      if (file.type.startsWith('image/')) {
        formData.append('quality', 'auto');
        formData.append('fetch_format', 'auto');
        formData.append('flags', 'progressive');
      } else if (file.type.startsWith('video/')) {
        formData.append('quality', 'auto');
        formData.append('fetch_format', 'auto');
      }
      
      // Always use /auto/upload for Cloudinary unsigned uploads to support all file types (images, videos, PDF, DOCX)
      const response = await fetch(`${this.baseUrl}/auto/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: HTTP ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const messageType = this.getMessageType(file.type, result.format);
      
      return {
        success: true,
        data: {
          publicId: result.public_id,
          url: result.secure_url,
          format: result.format,
          type: messageType,
          size: result.bytes,
          width: result.width,
          height: result.height,
          duration: result.duration,
          thumbnail: result.thumbnail_url || result.secure_url
        }
      };
    } catch (error) {
      console.warn("Cloudinary upload failed/unauthorized, falling back to local file reader:", error.message);
      try {
        const dataUrl = await readAsDataUrl(file);
        const messageType = this.getMessageType(file.type, '');
        return {
          success: true,
          data: {
            publicId: 'local_' + Date.now(),
            url: dataUrl,
            format: file.name ? file.name.split('.').pop() : 'png',
            type: messageType,
            size: file.size,
            thumbnail: dataUrl
          }
        };
      } catch (fallbackError) {
        return {
          success: false,
          error: fallbackError.message
        };
      }
    }
  }

  // Determine message type based on file type
  getMessageType(mimeType, format) {
    if (mimeType.startsWith('image/')) {
      return 'IMAGE';
    } else if (mimeType.startsWith('video/')) {
      return 'VIDEO';
    } else if (mimeType.startsWith('audio/')) {
      return 'AUDIO';
    } else {
      return 'FILE';
    }
  }

  // Get file size in human readable format
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Validate file before upload
  validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 10MB limit'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported'
      };
    }

    return {
      valid: true,
      error: null
    };
  }

  // Delete file from Cloudinary (if needed)
  async deleteFile(publicId) {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = this.generateSignature(publicId, timestamp);
      
      const response = await fetch(`${this.baseUrl}/delete_by_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: signature,
          public_id: publicId
        })
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Generate signature for delete operation
  generateSignature(publicId, timestamp) {
    // This would need to be implemented on your backend for security
    // Frontend shouldn't have access to API secret
    return '';
  }
}

export default new CloudinaryService();
