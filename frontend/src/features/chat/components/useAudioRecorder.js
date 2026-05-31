import { useState, useRef } from 'react';
import cloudinaryService from '../../../services/CloudinaryService';

export const useAudioRecorder = (onSendMessage, setIsUploading, showToast) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioStreamRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
          audioStreamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new window.File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        setIsUploading(true);
        try {
          const res = await cloudinaryService.uploadFile(file);
          if (res.success) {
            onSendMessage('', [{ uploaded: true, cloudinaryData: res.data }]);
          }
        } catch (err) {
          showToast('Không thể tải tin nhắn thoại lên máy chủ Cloudinary!', 'error');
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      showToast('Không thể kết nối hoặc truy cập Microphone của bạn!', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error("Error stopping media recorder:", err);
      }
      setIsRecording(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording
  };
};
