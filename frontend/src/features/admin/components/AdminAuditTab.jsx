import React, { useState } from 'react';
import { Search, Terminal, Clock, User } from 'lucide-react';

const AdminAuditTab = ({ auditLogs, t = (k) => k }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    return (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (log.target || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (log.admin || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTarget = (target) => {
    if (!target) return '';
    if (target.includes('Dọn dẹp bộ nhớ') || target.includes('tệp tin rác') || target === 'STORAGE_CLEANUP') {
      return t('storageCleanupTarget') || target;
    }
    return target;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-600" />
            {t('auditLogsTitle') || 'Nhật Ký Kiểm Toán Hệ Thống'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('auditLogsSubtitle') || 'Truy vết và giám sát hoạt động của các quản trị viên'}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchUserPlaceholder') || 'Lọc nhật ký...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono shadow-2xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3 font-mono shadow-xs">
        {filteredLogs.map((log) => (
          <div key={log.id} className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                [{log.action}]
              </span>
              <div className="text-slate-700">
                {t('target') || 'Mục tiêu'}: <span className="font-bold text-amber-700">{formatTarget(log.target)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end space-x-4 text-slate-500 text-[11px]">
              <div className="flex items-center space-x-1 text-emerald-700 font-medium">
                <User className="w-3.5 h-3.5" />
                <span>Admin: <strong>{log.admin}</strong></span>
              </div>
              <div className="flex items-center space-x-1 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{log.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs">
            {t('noResults') || 'Chưa ghi nhận nhật ký thao tác nào'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditTab;
