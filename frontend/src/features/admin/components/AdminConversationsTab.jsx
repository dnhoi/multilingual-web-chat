import React, { useState } from 'react';
import { 
  Search, MessageSquare, Users, User, Clock, Eye, X, Loader2, 
  MessageCircle, Trash2, Download, AlertTriangle, Phone, PhoneMissed, 
  PhoneOff, Video, FileText, Image as ImageIcon, ExternalLink, Volume2,
  FileSpreadsheet, Archive, FileCode
} from 'lucide-react';
import * as chatApi from '../../chat/api/chat.api';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useToast } from '../../../contexts/ToastContext';

const AdminConversationsTab = ({ conversationsList, onRefreshData, usersList = [], t: propT }) => {
  const { t: contextT } = useLanguage();
  const { showToast } = useToast();
  const t = propT || contextT;
  const [localConvs, setLocalConvs] = useState(conversationsList || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingConvId, setDeletingConvId] = useState(null);

  // Synchronize local list if prop updates
  React.useEffect(() => {
    setLocalConvs(conversationsList || []);
  }, [conversationsList]);

  // Resolve sender display name accurately
  const getSenderDisplayName = (msg) => {
    if (!msg) return 'Hệ thống';

    if (msg.type === 'NOTIFICATION' || msg.senderId === 'SYSTEM' || msg.userId === 'SYSTEM') {
      return 'Hệ thống';
    }

    const rawText = msg.messageText || msg.originalText || msg.text || '';

    // Check if the message is a WebRTC Call Signal containing callerName or callerId
    if (rawText.startsWith('{') && rawText.includes('"caller')) {
      try {
        const parsed = JSON.parse(rawText);
        if (parsed.callerName) return parsed.callerName;
        if (parsed.callerId) {
          const user = usersList?.find(u => 
            String(u.id) === String(parsed.callerId) || 
            String(u.userId) === String(parsed.callerId) || 
            (u.username && u.username.toLowerCase() === String(parsed.callerId).toLowerCase())
          );
          if (user) return user.fullName || user.username;
          return parsed.callerId;
        }
      } catch (e) {}
    }

    const senderId = msg.userId || msg.senderId || msg.senderName;
    if (!senderId) return 'Hệ thống';

    // 1. Look in msg.userProfiles if provided
    if (Array.isArray(msg.userProfiles)) {
      const profile = msg.userProfiles.find(p => 
        (p.userId && String(p.userId) === String(senderId)) || 
        (p.username && p.username.toLowerCase() === String(senderId).toLowerCase())
      );
      if (profile && (profile.fullName || profile.username)) {
        return profile.fullName || profile.username;
      }
    }

    // 2. Look in selected conversation participants / userProfiles
    const convParticipants = selectedConv?.participants || selectedConv?.userProfiles || [];
    const participant = convParticipants.find(p => 
      (p.userId && String(p.userId) === String(senderId)) || 
      (p.id && String(p.id) === String(senderId)) || 
      (p.username && p.username.toLowerCase() === String(senderId).toLowerCase())
    );
    if (participant && (participant.fullName || participant.name || participant.username)) {
      return participant.fullName || participant.name || participant.username;
    }

    // 3. Look in usersList (prop from AdminDashboardPage)
    if (Array.isArray(usersList)) {
      const user = usersList.find(u => 
        (u.id && String(u.id) === String(senderId)) || 
        (u.userId && String(u.userId) === String(senderId)) || 
        (u.username && u.username.toLowerCase() === String(senderId).toLowerCase())
      );
      if (user && (user.fullName || user.username)) {
        return user.fullName || user.username;
      }
    }

    return senderId;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const parseAttachment = (rawText, msgType) => {
    let cleanText = (rawText || '').trim();
    if (cleanText.startsWith('[') && cleanText.endsWith(']')) {
      const inner = cleanText.slice(1, -1);
      if (inner.includes(': ')) {
        cleanText = inner.slice(inner.indexOf(': ') + 2);
      }
    }

    let url = cleanText;
    let name = '';
    let size = null;

    if (url.includes('|')) {
      const parts = url.split('|');
      url = parts[0]?.trim() || '';
      name = parts[1]?.trim() || '';
      size = parts[2] ? parseInt(parts[2], 10) : null;
    } else if (url.startsWith('{') && url.includes('"url"')) {
      try {
        const parsed = JSON.parse(url);
        url = parsed.url || '';
        name = parsed.name || parsed.originalName || '';
        size = parsed.size || parsed.originalSize || null;
      } catch (e) {}
    }

    if (!name && url) {
      const rawName = url.split('/').pop()?.split('?')[0] || '';
      try {
        name = decodeURIComponent(rawName);
      } catch (e) {
        name = rawName;
      }
    }

    let type = (msgType || '').toUpperCase();
    if (type === 'IMAGE' || url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
      type = 'IMAGE';
    } else if (type === 'AUDIO' || url.match(/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i) || (url.includes('/video/upload/') && (name.endsWith('.webm') || name.endsWith('.mp3') || name.endsWith('.wav') || name.includes('Ghi âm') || name.includes('audio')))) {
      type = 'AUDIO';
    } else if (type === 'VIDEO' || url.match(/\.(mp4|webm|mov|avi)(\?.*)?$/i)) {
      type = 'VIDEO';
    } else if (type === 'FILE' || type === 'DOCUMENT' || url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt|csv)(\?.*)?$/i)) {
      type = 'FILE';
    } else if (!type || type === 'TEXT') {
      type = 'FILE';
    }

    return {
      url,
      name: name || (type === 'IMAGE' ? 'Hình ảnh' : type === 'AUDIO' ? 'Ghi âm' : type === 'VIDEO' ? 'Video' : 'Tệp đính kèm'),
      size,
      type
    };
  };

  // Format message text and handle Call Signals / Attachments nicely
  const formatMessageInfo = (msg) => {
    if (!msg) return { type: 'text', displayText: '', isCall: false };

    if (msg.isDeleted) {
      return { type: 'deleted', displayText: 'Tin nhắn đã bị xóa', isCall: false };
    }

    const rawText = msg.messageText || msg.originalText || msg.text || '';
    const msgType = (msg.type || msg.Type || 'TEXT').toUpperCase();

    // Detect WebRTC Call Signals
    const isCallSignal = msgType === 'CALL_SIGNAL' || (rawText.startsWith('{') && (rawText.includes('"signalType"') || rawText.includes('CALL_')));

    if (isCallSignal) {
      let signalType = '';
      let callType = 'voice';
      let callerName = '';

      try {
        const parsed = JSON.parse(rawText);
        signalType = parsed.signalType || '';
        callType = parsed.callType || 'voice';
        callerName = parsed.callerName || '';
      } catch (e) {
        if (rawText.includes('CALL_DECLINE')) signalType = 'CALL_DECLINE';
        else if (rawText.includes('CALL_CANCEL')) signalType = 'CALL_CANCEL';
        else if (rawText.includes('CALL_OFFER')) signalType = 'CALL_OFFER';
        else if (rawText.includes('CALL_END')) signalType = 'CALL_END';
        if (rawText.includes('"video"')) callType = 'video';
      }

      const isVideo = callType === 'video';
      const typeLabel = isVideo ? 'Cuộc gọi video' : 'Cuộc gọi thoại';

      if (signalType === 'CALL_OFFER') {
        return {
          type: 'call',
          isCall: true,
          isVideo,
          callStatus: 'offer',
          displayText: `📞 Bắt đầu ${typeLabel.toLowerCase()}`,
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      } else if (signalType === 'CALL_DECLINE') {
        return {
          type: 'call',
          isCall: true,
          isVideo,
          callStatus: 'decline',
          displayText: `📞 Đã từ chối ${typeLabel.toLowerCase()}`,
          badgeColor: 'bg-red-50 text-red-700 border-red-200'
        };
      } else if (signalType === 'CALL_CANCEL') {
        return {
          type: 'call',
          isCall: true,
          isVideo,
          callStatus: 'cancel',
          displayText: `📞 Đã hủy ${typeLabel.toLowerCase()}`,
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      } else if (signalType === 'CALL_END') {
        return {
          type: 'call',
          isCall: true,
          isVideo,
          callStatus: 'end',
          displayText: `⏹️ ${typeLabel} đã kết thúc`,
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200'
        };
      } else {
        return {
          type: 'call',
          isCall: true,
          isVideo,
          callStatus: 'signal',
          displayText: `📞 Tín hiệu cuộc gọi (${signalType || 'CALL'})`,
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
        };
      }
    }

    // Media & File attachments
    const isUrlMedia = rawText.startsWith('http://') || rawText.startsWith('https://') || rawText.startsWith('data:') || (rawText.startsWith('[') && (rawText.includes('Hình ảnh:') || rawText.includes('Tệp tin:') || rawText.includes('Ghi âm:') || rawText.includes('Video:')));
    const isMediaMsgType = ['IMAGE', 'FILE', 'DOCUMENT', 'VIDEO', 'AUDIO'].includes(msgType);
    const hasMediaRegex = rawText.match(/\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|txt|csv|mp4|webm|mov|mp3|wav|ogg|m4a)(\?.*)?$/i);

    if ((isMediaMsgType || isUrlMedia || hasMediaRegex) && !rawText.includes('"question":') && !rawText.includes('"callType":')) {
      const att = parseAttachment(rawText, msgType);
      return {
        type: att.type.toLowerCase(),
        isCall: false,
        isMedia: true,
        attachment: att,
        displayText: att.type === 'IMAGE' ? `[Hình ảnh: ${att.name || att.url}]` :
                     att.type === 'AUDIO' ? `[Ghi âm: ${att.name || att.url}]` :
                     att.type === 'VIDEO' ? `[Video: ${att.name || att.url}]` :
                     `[Tệp tin: ${att.name || att.url}]`
      };
    }

    return {
      type: 'text',
      isCall: false,
      isMedia: false,
      displayText: rawText
    };
  };

  const handleOpenMessagesModal = async (conv) => {
    setSelectedConv(conv);
    setIsModalOpen(true);
    setIsLoadingMessages(true);
    try {
      const res = await chatApi.getMessages(conv.id, 0, 100);
      const msgData = res?.result || res?.data || (Array.isArray(res) ? res : []);
      setMessages(msgData);
    } catch (err) {
      console.error("Lỗi khi tải lịch sử tin nhắn:", err);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tin nhắn vi phạm này khỏi hệ thống?")) return;
    try {
      await chatApi.deleteMessageByAdmin(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId && m.messageId !== messageId));
      showToast("Đã xóa tin nhắn vi phạm thành công!", "success");
    } catch (err) {
      showToast("Xóa tin nhắn thất bại: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const handleDeleteConversation = async (convId, convName) => {
    if (!window.confirm(`XÁC NHẬN: Bạn có chắc chắn muốn XÓA HOÀN TOÀN cuộc trò chuyện "${convName}" (#${convId})?`)) return;
    setDeletingConvId(convId);
    try {
      await chatApi.deleteConversation(convId);
      setLocalConvs(prev => prev.filter(c => c.id !== convId));
      if (onRefreshData) onRefreshData();
      showToast(`Đã xóa cuộc trò chuyện "${convName}" thành công.`, "success");
    } catch (err) {
      showToast("Xóa cuộc trò chuyện thất bại: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setDeletingConvId(null);
    }
  };

  const handleExportChatLog = () => {
    if (!selectedConv || messages.length === 0) return;
    let textContent = `--- NHẬT KÝ CHAT - HỘI THOẠI #${selectedConv.id} (${selectedConv.name}) ---\n`;
    textContent += `Loại phòng: ${selectedConv.type} | Ngày xuất: ${new Date().toLocaleString('vi-VN')}\n\n`;

    messages.forEach((msg, idx) => {
      const time = msg.sentDatetime ? new Date(msg.sentDatetime).toLocaleString('vi-VN') : '';
      const sender = getSenderDisplayName(msg);
      const msgInfo = formatMessageInfo(msg);
      textContent += `[${idx + 1}] [${time}] ${sender}: ${msgInfo.displayText}\n`;
    });

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChatLog_${selectedConv.name}_${selectedConv.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredConversations = localConvs.filter(conv => {
    const matchesSearch = (conv.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (conv.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || conv.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {t('conversationsTitle') || 'Hội Thoại & Phòng Chat Nhóm'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('conversationsSubtitle') || 'Tổng số phòng chat hoạt động'}: <strong className="text-blue-600 font-bold">{localConvs.length}</strong> {t('totalRoomsSuffix') || 'phòng'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchRoomPlaceholder') || 'Tìm theo tên phòng hoặc ID...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
          >
            <option value="ALL">{t('allRoomTypes') || 'Tất cả Loại Phòng'}</option>
            <option value="GROUP">{t('groupType') || 'GROUP (Nhóm)'}</option>
            <option value="DIRECT">{t('directType') || 'DIRECT (Chat 1-1)'}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">{t('chatRoomCol') || 'Phòng Chat'}</th>
                <th className="px-6 py-4">{t('roomTypeCol') || 'Loại Phòng'}</th>
                <th className="px-6 py-4">{t('membersCol') || 'Thành Viên'}</th>
                <th className="px-6 py-4">{t('lastActiveCol') || 'Lần Hoạt Động Cuối'}</th>
                <th className="px-6 py-4 text-center">{t('adminActionsCol') || 'Hành Động Admin'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConversations.map((conv) => (
                <tr key={conv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center text-white ${
                        conv.type === 'GROUP' ? 'bg-blue-600 text-white shadow-xs' : 'bg-indigo-600 text-white shadow-xs'
                      }`}>
                        {conv.type === 'GROUP' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <div>{conv.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">#{conv.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      conv.type === 'GROUP' 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}>
                      {conv.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-800 font-semibold">{conv.membersCount} {t('membersCountSuffix') || 'thành viên'}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{String(conv.lastActive)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleOpenMessagesModal(conv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold border border-blue-200 transition-colors shadow-xs"
                        title={t('viewChat') || 'Xem Chat'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t('viewChat') || 'Xem Chat'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteConversation(conv.id, conv.name)}
                        disabled={deletingConvId === conv.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold border border-red-200 transition-colors shadow-xs disabled:opacity-50"
                        title={t('deleteConv') || 'Xóa'}
                      >
                        {deletingConvId === conv.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>{t('deleteConv') || 'Xóa'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredConversations.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-xs">
                    {t('noConversationsData') || 'Chưa có hội thoại nào trong cơ sở dữ liệu'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal View Chat Messages & Inspection */}
      {isModalOpen && selectedConv && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {t('chatLogTitle') || 'Nhật Ký Tin Nhắn'}: {selectedConv.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">ID: #{selectedConv.id}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportChatLog}
                  disabled={messages.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
                  title={t('exportChatFile') || 'Xuất File'}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('exportChatFile') || 'Xuất File'}</span>
                </button>
                
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4 bg-slate-50/50">
              {isLoadingMessages ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                  <span className="text-xs">{t('loadingChatLog') || 'Đang tải nhật ký tin nhắn...'}</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <MessageCircle className="w-10 h-10 stroke-1 text-slate-300" />
                  <span className="text-xs">{t('noMessagesInChat') || 'Không có tin nhắn nào trong đoạn chat này'}</span>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const senderDisplayName = getSenderDisplayName(msg);
                  const msgInfo = formatMessageInfo(msg);
                  const isSystem = senderDisplayName === 'Hệ thống' || senderDisplayName === 'System' || senderDisplayName === 'Sistema' || msg.type === 'NOTIFICATION';

                  return (
                    <div key={msg.id || msg.messageId || idx} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 group hover:border-slate-300 transition-colors">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold ${isSystem ? 'text-slate-500' : 'text-blue-700'}`}>
                            {isSystem ? (t('systemSender') || 'Hệ thống') : senderDisplayName}
                          </span>
                          {isSystem && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-semibold border border-slate-200">
                              {t('systemSender') || 'Hệ thống'}
                            </span>
                          )}
                          {!isSystem && (msg.userId || msg.senderId) && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              @{msg.userId || msg.senderId}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] text-slate-400 font-mono">
                            {msg.sentDatetime ? new Date(msg.sentDatetime).toLocaleString() : ''}
                          </span>
                          
                          <button
                            onClick={() => handleDeleteMessage(msg.id || msg.messageId)}
                            className="text-slate-300 hover:text-red-600 p-1 transition-colors"
                            title={t('confirmDeleteMessage') || 'Xóa tin nhắn này'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      {msgInfo.isCall ? (
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${msgInfo.badgeColor}`}>
                          {msgInfo.callStatus === 'decline' ? (
                            <PhoneMissed className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                          ) : msgInfo.callStatus === 'cancel' ? (
                            <PhoneOff className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                          ) : msgInfo.isVideo ? (
                            <Video className="w-3.5 h-3.5 flex-shrink-0 text-blue-600" />
                          ) : (
                            <Phone className="w-3.5 h-3.5 flex-shrink-0 text-blue-600" />
                          )}
                          <span>{msgInfo.displayText}</span>
                        </div>
                      ) : msgInfo.isMedia && msgInfo.attachment ? (
                        <div className="pt-1">
                          {msgInfo.type === 'image' && (
                            <div className="space-y-1.5">
                              <div className="relative inline-block group/img">
                                <img
                                  src={msgInfo.attachment.url}
                                  alt={msgInfo.attachment.name}
                                  className="max-h-56 max-w-full rounded-xl object-contain border border-slate-200 shadow-xs cursor-pointer hover:opacity-95 transition-opacity"
                                  onClick={() => window.open(msgInfo.attachment.url, '_blank')}
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                                <span className="font-medium text-slate-700 truncate max-w-xs">{msgInfo.attachment.name}</span>
                                {msgInfo.attachment.size ? <span>• {formatFileSize(msgInfo.attachment.size)}</span> : null}
                                <a
                                  href={msgInfo.attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> Xem ảnh gốc
                                </a>
                              </div>
                            </div>
                          )}

                          {msgInfo.type === 'audio' && (
                            <div className="space-y-1.5 max-w-md">
                              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
                                <Volume2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <audio
                                  src={msgInfo.attachment.url}
                                  controls
                                  className="w-full h-8 accent-blue-600"
                                />
                              </div>
                              <div className="flex items-center space-x-2 text-[11px] text-slate-500 px-1">
                                <span className="font-medium text-slate-700">{msgInfo.attachment.name || 'Ghi âm'}</span>
                                {msgInfo.attachment.size ? <span>• {formatFileSize(msgInfo.attachment.size)}</span> : null}
                                <a
                                  href={msgInfo.attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={msgInfo.attachment.name || 'audio.webm'}
                                  className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1 ml-auto"
                                >
                                  <Download className="w-3 h-3" /> Tải về
                                </a>
                              </div>
                            </div>
                          )}

                          {msgInfo.type === 'video' && (
                            <div className="space-y-1.5 max-w-md">
                              <video
                                src={msgInfo.attachment.url}
                                controls
                                className="max-h-56 max-w-full rounded-xl border border-slate-200 shadow-xs"
                              />
                              <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                                <span className="font-medium text-slate-700 truncate max-w-xs">{msgInfo.attachment.name}</span>
                                {msgInfo.attachment.size ? <span>• {formatFileSize(msgInfo.attachment.size)}</span> : null}
                                <a
                                  href={msgInfo.attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-semibold inline-flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> Mở video
                                </a>
                              </div>
                            </div>
                          )}

                          {msgInfo.type === 'file' && (
                            <div className="max-w-md">
                              <div className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex items-center justify-between gap-3 transition-colors">
                                <div className="flex items-center space-x-3 min-w-0">
                                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
                                    {msgInfo.attachment.name.match(/\.(xls|xlsx|csv)$/i) ? (
                                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                                    ) : msgInfo.attachment.name.match(/\.(zip|rar|7z)$/i) ? (
                                      <Archive className="w-5 h-5 text-purple-600" />
                                    ) : msgInfo.attachment.name.match(/\.(pdf)$/i) ? (
                                      <FileText className="w-5 h-5 text-red-600" />
                                    ) : (
                                      <FileText className="w-5 h-5 text-blue-600" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 truncate" title={msgInfo.attachment.name}>
                                      {msgInfo.attachment.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                      {formatFileSize(msgInfo.attachment.size) || 'Tệp đính kèm'}
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={msgInfo.attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={msgInfo.attachment.name}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex-shrink-0 cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Tải về</span>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className={`text-xs whitespace-pre-wrap leading-relaxed ${msg.isDeleted ? 'italic text-slate-400' : 'text-slate-800'}`}>
                          {msgInfo.displayText}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>{t('totalMessagesCount') || 'Tổng số'}: <strong className="text-slate-800 font-semibold">{messages.length}</strong> {t('messagesCountSuffix') || 'tin nhắn'}</span>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                {t('closeModal') || 'Đóng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConversationsTab;
