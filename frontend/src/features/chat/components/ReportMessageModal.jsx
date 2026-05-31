import React from 'react';
import { Flag, X, AlertTriangle } from 'lucide-react';

const ReportMessageModal = ({
  reportingMessage,
  setReportingMessage,
  reportingUser,
  setReportingUser,
  reportReason,
  setReportReason,
  isSubmittingReport,
  handleSubmitReport
}) => {
  const isOpen = Boolean(reportingMessage || reportingUser);
  if (!isOpen) return null;

  const handleClose = () => {
    if (setReportingMessage) setReportingMessage(null);
    if (setReportingUser) setReportingUser(null);
    setReportReason('');
  };

  const isUserReport = Boolean(reportingUser && !reportingMessage);
  const targetTitle = isUserReport
    ? `Báo cáo: ${reportingUser.fullName || reportingUser.name || reportingUser.username || 'Người dùng'}`
    : 'Báo cáo tin nhắn';

  const defaultReasons = isUserReport
    ? ['Hành vi quấy rối / đe dọa', 'Spam / Tin nhắn rác', 'Tài khoản giả mạo / Lừa đảo', 'Nội dung phản cảm', 'Khác']
    : ['Nội dung bạo lực', 'Spam / Quảng cáo', 'Ngôn ngữ xúc phạm', 'Thông tin sai lệch', 'Quấy rối', 'Khác'];

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-auto relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center justify-center text-rose-400 flex-shrink-0">
            <Flag className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-zinc-100 truncate">{targetTitle}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Báo cáo sẽ được gửi tới Ban Quản Trị để xử lý</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Details preview */}
        {reportingMessage && (
          <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3 mb-4 text-xs text-zinc-300 max-h-24 overflow-y-auto">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Nội dung tin nhắn:</span>
            <p className="italic text-zinc-200 line-clamp-3">
              "{reportingMessage.originalText?.substring(0, 150) || reportingMessage.messageText || '[Tập tin đính kèm]'}"
            </p>
          </div>
        )}

        {isUserReport && (
          <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3 mb-4 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>
                Bạn đang báo cáo tài khoản: <strong className="text-zinc-100">{reportingUser.fullName || reportingUser.username}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Reason options */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
            Chọn lý do báo cáo <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {defaultReasons.map(r => {
              const isSelected = reportReason === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReportReason(r)}
                  className={`text-xs py-2 px-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-rose-500/50 bg-rose-500/20 text-rose-300 font-semibold shadow-xs'
                      : 'border-zinc-800 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>

          {reportReason === 'Khác' && (
            <textarea
              placeholder="Vui lòng mô tả chi tiết lý do vi phạm..."
              value={reportReason === 'Khác' ? '' : reportReason}
              onChange={e => setReportReason(e.target.value)}
              className="w-full text-xs border border-zinc-700 rounded-xl p-3 bg-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 resize-none"
              rows={3}
              autoFocus
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmitReport}
            disabled={!reportReason.trim() || isSubmittingReport}
            className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-900/30"
          >
            {isSubmittingReport ? 'Đang gửi...' : 'Gửi Báo Cáo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportMessageModal;
