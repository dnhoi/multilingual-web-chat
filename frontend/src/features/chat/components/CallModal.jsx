import { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, Monitor, Disc } from 'lucide-react';
import { API_CONFIG, getAvatarUrl } from '../../../config/api';
import logger from '../../../core/utils/logger';

const CallModal = ({ isOpen, onClose, callType = 'video', recipient = null, currentUser = null, callerSdp = null, onSendSignal, incomingSignal = null, onSignalProcessed }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('Calling...');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const peerConnectionRef = useRef(null);
  const ringingTimeoutRef = useRef(null);

  // Handle incoming signaling messages
  useEffect(() => {
    if (!isOpen || !incomingSignal) return;

    const handleIncomingSignal = async (signal) => {
      try {
        const signalType = signal.signalType;
        
        if (signalType === 'CALL_ACCEPT' && !callerSdp) {
          // Caller receives SDP answer from callee
          if (peerConnectionRef.current && signal.sdp) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            setCallStatus('Connected');
            if (ringingTimeoutRef.current) {
              clearTimeout(ringingTimeoutRef.current);
              ringingTimeoutRef.current = null;
            }
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(() => {
              setCallDuration(prev => prev + 1);
            }, 1000);
          }
        } else if (signalType === 'ICE_CANDIDATE') {
          if (peerConnectionRef.current && signal.candidate) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
      } catch (err) {
        console.error('Error handling incoming WebRTC signal:', err);
      } finally {
        onSignalProcessed?.();
      }
    };

    handleIncomingSignal(incomingSignal);
  }, [incomingSignal, isOpen, callerSdp, onSignalProcessed]);

  const createPeerConnection = (stream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local tracks to WebRTC peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle remote tracks added by the other peer
    pc.ontrack = (event) => {
      logger.log('WebRTC received remote stream track:', event.streams[0]);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play?.().catch(() => {});
        }
      }
    };

    // Send generated ICE candidates to the other peer via WebSocket
    pc.onicecandidate = (event) => {
      if (event.candidate && onSendSignal) {
        onSendSignal({
          signalType: 'ICE_CANDIDATE',
          candidate: event.candidate,
          callerId: currentUser?.id || currentUser?.userId
        });
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Sync video streams to video elements whenever available
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current && callType === 'video' && !isVideoOff) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play?.().catch(() => {});
    }
  }, [isOpen, callType, isVideoOff, localStreamRef.current]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play?.().catch(() => {});
    }
  }, [remoteStream, callStatus, isVideoOff]);

  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;
    setCallStatus(callerSdp ? 'Connecting...' : 'Calling...');
    setErrorMessage(null);

    const startLocalStream = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Trình duyệt không hỗ trợ WebRTC hoặc yêu cầu kết nối bảo mật (HTTPS/localhost).');
        }

        let stream;
        const wantVideo = callType === 'video';

        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: wantVideo,
            audio: true
          });
        } catch (mediaErr) {
          if (wantVideo) {
            console.warn('Video device not available or denied, trying audio fallback:', mediaErr);
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: true
              });
              setIsVideoOff(true);
              setErrorMessage('Không tìm thấy camera hoặc bị từ chối, chuyển sang gọi thoại.');
            } catch (audioErr) {
              throw audioErr;
            }
          } else {
            throw mediaErr;
          }
        }

        if (!isSubscribed) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        
        if (localVideoRef.current && callType === 'video' && !isVideoOff) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play?.().catch(() => {});
        }

        const pc = createPeerConnection(stream);

        if (!callerSdp) {
          // 1. Caller generates local SDP offer
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (onSendSignal) {
            onSendSignal({
              signalType: 'CALL_OFFER',
              sdp: offer,
              callType: callType,
              callerName: currentUser?.fullName || currentUser?.username,
              callerAvatar: currentUser?.avatarUrl,
              callerId: currentUser?.id || currentUser?.userId
            });
          }
          if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
          ringingTimeoutRef.current = setTimeout(() => {
            logger.log('Call ringing timeout reached. Automatically hanging up.');
            if (onSendSignal) {
              onSendSignal({
                signalType: 'CALL_DECLINE',
                callerId: currentUser?.id || currentUser?.userId
              });
            }
            onClose?.();
          }, 30000); // 30 seconds
        } else {
          // 2. Callee sets remote SDP offer, generates local SDP answer
          await pc.setRemoteDescription(new RTCSessionDescription(callerSdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          if (onSendSignal) {
            onSendSignal({
              signalType: 'CALL_ACCEPT',
              sdp: answer,
              callerId: currentUser?.id || currentUser?.userId
            });
          }
          setCallStatus('Connected');
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
          }, 1000);
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setCallStatus('Media Error');
        setErrorMessage(err.message || 'Không thể truy cập Microphone/Camera. Vui lòng cấp quyền trong trình duyệt.');
      }
    };

    startLocalStream();

    return () => {
      isSubscribed = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (ringingTimeoutRef.current) clearTimeout(ringingTimeoutRef.current);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      setRemoteStream(null);
    };
  }, [isOpen, callType, callerSdp, currentUser]);

  if (!isOpen || !recipient) return null;

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current && callType === 'video') {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = () => {
    setCallStatus('Ended');
    if (timerRef.current) clearInterval(timerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = displayStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = displayStream;
        }
        setIsScreenSharing(true);
        displayStream.getVideoTracks()[0].onended = () => {
          if (localStreamRef.current) {
            if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = localStreamRef.current;
          }
          setIsScreenSharing(false);
          screenStreamRef.current = null;
        };
      } else {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }
        if (localStreamRef.current) {
          if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = localStreamRef.current;
        }
        setIsScreenSharing(false);
      }
    } catch (err) {
      console.error('Screen share error:', err);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      const streamToRecord = localStreamRef.current;
      if (!streamToRecord) return;
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamToRecord);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Call_Recording_${Date.now()}.webm`;
        a.click();
      };
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl w-full max-w-2xl h-[550px] relative overflow-hidden flex flex-col justify-between">
        <div className="p-4 z-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center space-x-3">
            <img
              src={getAvatarUrl(recipient.avatarUrl, 'user')}
              alt={recipient.name || recipient.fullName || 'User'}
              className="w-10 h-10 rounded-full object-cover border border-gray-700"
            />
            <div>
              <h3 className="font-semibold text-sm">
                {recipient.name || recipient.fullName || recipient.username || 'User'}
              </h3>
              <p className="text-xs text-green-400">
                {callStatus === 'Connected' ? formatDuration(callDuration) : callStatus}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs bg-gray-800/80 px-3 py-1.5 rounded-full border border-gray-700">
            <Volume2 className="w-4 h-4 text-blue-400" />
            <span>{callType === 'video' ? 'Video Call' : 'Voice Call'}</span>
          </div>
        </div>

        <div className="absolute inset-0 bg-gray-950 flex items-center justify-center">
          {callType === 'video' && !isVideoOff && callStatus === 'Connected' && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center animate-pulse px-4 z-0">
              <img
                src={getAvatarUrl(recipient.avatarUrl, 'user')}
                alt=""
                className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-4 border-gray-800 shadow-2xl"
              />
              <p className="text-lg font-semibold text-white">{recipient.name || recipient.fullName || recipient.username || 'User'}</p>
              <p className="text-sm text-blue-400 mt-1 font-medium">
                {callStatus === 'Calling...' ? (callType === 'video' ? 'Đang gọi video...' : 'Đang gọi thoại...') : callStatus}
              </p>
              {errorMessage && (
                <p className="text-xs text-amber-300 mt-3 bg-amber-950/70 border border-amber-800 px-3.5 py-1.5 rounded-xl max-w-sm mx-auto shadow-sm">
                  ⚠️ {errorMessage}
                </p>
              )}
            </div>
          )}

          {callType === 'video' && !isVideoOff && (
            <div className="absolute bottom-20 right-4 w-36 h-48 bg-black rounded-xl overflow-hidden border-2 border-gray-700 shadow-xl z-20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div className="p-6 z-10 flex items-center justify-center space-x-4 bg-gradient-to-t from-black/80 to-transparent">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-colors ${
              isMuted ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
            }`}
            title={isMuted ? 'Bật micro' : 'Tắt micro'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-colors ${
                isVideoOff ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
              }`}
              title={isVideoOff ? 'Bật Camera' : 'Tắt Camera'}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}

          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-colors ${
              isScreenSharing ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
            }`}
            title="Chia sẻ màn hình"
          >
            <Monitor className="w-6 h-6" />
          </button>

          <button
            onClick={toggleRecording}
            className={`p-4 rounded-full transition-colors ${
              isRecording ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
            }`}
            title={isRecording ? 'Dừng ghi âm/video' : 'Ghi âm cuộc gọi'}
          >
            <Disc className="w-6 h-6" />
          </button>

          <button
            onClick={handleEndCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transition-transform hover:scale-105"
            title="Kết thúc cuộc gọi"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
