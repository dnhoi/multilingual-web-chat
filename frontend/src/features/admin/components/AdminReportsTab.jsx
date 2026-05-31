import React, { useState } from 'react';
import { CheckCircle2, Clock, ShieldAlert, Check } from 'lucide-react';

const AdminReportsTab = ({ reportsList, resolveReport, t = (k) => k }) => {
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredReports = reportsList.filter(rep => {
    return statusFilter === 'ALL' || rep.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {t('reportsQueueTitle') || 'Hàng Đợi Kiểm Duyệt Báo Cáo Vi Phạm'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('reportsQueueSubtitle') || 'Xử lý các nội dung và người dùng bị báo cáo vi phạm tiêu chuẩn cộng đồng'}
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 self-start sm:self-auto shadow-2xs"
        >
          <option value="ALL">{t('allReportsStatus') || 'Tất cả Trạng Thái'}</option>
          <option value="PENDING">{t('pendingStatus') || 'PENDING'}</option>
          <option value="RESOLVED">{t('resolvedStatus') || 'RESOLVED'}</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">{t('reportId') || 'Mã Báo Cáo'}</th>
                <th className="px-6 py-4">{t('reportedTarget') || 'Đối Tượng Bị Báo Cáo'}</th>
                <th className="px-6 py-4">{t('violationReason') || 'Lý Do Vi Phạm'}</th>
                <th className="px-6 py-4">{t('reporter') || 'Người Báo Cáo'}</th>
                <th className="px-6 py-4">{t('statusCol') || 'Trạng Thái'}</th>
                <th className="px-6 py-4 text-right">{t('actionsCol') || 'Xử Lý'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-mono text-slate-400 text-[11px]">#{rep.id}</td>
                  <td className="px-6 py-4 font-bold text-rose-600">
                    <div className="flex items-center space-x-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-500" />
                      <span>{rep.reportedUser}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-800 font-medium">{rep.reason}</td>
                  <td className="px-6 py-4 text-slate-500">{rep.reporter}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      rep.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {rep.status === 'PENDING' ? <Clock className="w-3 h-3 text-amber-500" /> : <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      {rep.status === 'PENDING' ? (t('pendingStatus') || 'PENDING') : (t('resolvedStatus') || 'RESOLVED')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {rep.status === 'PENDING' ? (
                      <button
                        onClick={() => resolveReport(rep.id)}
                        className="inline-flex items-center space-x-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-all duration-200"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('resolve') || 'Xử Lý'}</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-medium">{t('allDone') || 'Đã hoàn thành'}</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-xs">
                    {t('noResults') || 'Không có báo cáo nào trong hàng đợi'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReportsTab;
