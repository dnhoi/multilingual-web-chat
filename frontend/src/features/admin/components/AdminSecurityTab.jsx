import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, UserX, CheckCircle, RefreshCw, Lock, Radio } from 'lucide-react';
import * as settingsApi from '../../settings/api/settings.api';
import { useToast } from '../../../contexts/ToastContext';

export default function AdminSecurityTab({ usersList, toggleBanUser, onRefreshData, t = (k) => k }) {
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const res = await settingsApi.getSecurityAlerts();
      if (res?.result) {
        setAlerts(res.result);
      }
    } catch (err) {
      console.error('Failed to fetch security alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleQuickBan = async (targetUsername) => {
    const user = usersList.find(u => u.username === targetUsername || u.id === targetUsername);
    if (!user) {
      showToast(`Không tìm thấy người dùng: '${targetUsername}'`, 'error');
      return;
    }
    if (window.confirm(`Xác nhận khóa tài khoản '${user.fullName || user.username}'?`)) {
      try {
        await toggleBanUser(user.userId || user.id);
        fetchAlerts();
        onRefreshData?.();
      } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
      }
    }
  };

  const highRiskCount = alerts.filter(a => a.type === 'HIGH' || a.type === 'CRITICAL').length;

  const formatTarget = (target) => {
    if (!target) return '';
    if (target.includes('Dọn dẹp bộ nhớ') || target.includes('tệp tin rác') || target === 'STORAGE_CLEANUP') {
      return t('storageCleanupTarget') || target;
    }
    return target;
  };

  const formatAlertTitle = (title) => {
    if (!title) return '';
    if (title.includes('Nhật ký quản trị đặc quyền') || title.includes('Privileged Admin')) {
      return t('privilegedAdminLog') || title;
    }
    if (title.includes('báo cáo vi phạm') || title.includes('violation reports')) {
      return t('multipleReportsAlert') || title;
    }
    if (title.includes('bị khóa hệ thống') || title.includes('banned by system')) {
      return t('accountBannedAlert') || title;
    }
    return title;
  };

  const formatAlertDesc = (desc) => {
    if (!desc) return '';
    if (desc.includes('thực hiện:') || desc.includes('thực hiện')) {
      const match = desc.match(/Admin\s+([^\s]+)\s+thực hiện:?\s*([A-Z_]+)\s*\((.*)\)/i);
      if (match) {
        const [, adminName, actionName, targetName] = match;
        return `Admin ${adminName} ${t('performedAction') || 'thực hiện'}: ${actionName} (${formatTarget(targetName)})`;
      }
    }
    return desc;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            {t('securityTitle') || 'Cảnh Báo Bảo Mật & Đăng Nhập Bất Thường'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('securitySubtitle') || 'Tự động phát hiện các mối đe dọa, tài khoản bị báo cáo hoặc hoạt động đáng ngờ'}
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={isLoading}
          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start transition-colors shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>{t('refreshData') || 'Làm mới'}</span>
        </button>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl flex items-center gap-3.5 shadow-xs">
          <div className={`p-3 rounded-xl ${highRiskCount > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">{t('criticalRisk') || 'Cảnh Báo Mức Độ Cao'}</div>
            <div className={`text-xl font-black ${highRiskCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {highRiskCount}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl flex items-center gap-3.5 shadow-xs">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">{t('activeSessions') || 'Phiên Đăng Nhập Hoạt Động'}</div>
            <div className="text-xl font-black text-slate-900">
              {Math.max(1, usersList.length)}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200/90 rounded-2xl flex items-center gap-3.5 shadow-xs">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">JWT Security</div>
            <div className="text-xl font-black text-emerald-600">
              HS512 / Auth
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {t('auditLogsTitle') || 'Nhật Ký Sự Kiện An Ninh & Cảnh Báo'}
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {alerts.length} records
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {alerts.map((alert) => {
            const isCritical = alert.type === 'CRITICAL';
            const isHigh = alert.type === 'HIGH';
            const isMed = alert.type === 'MEDIUM';

            return (
              <div key={alert.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`p-2 rounded-xl mt-0.5 flex-shrink-0 ${
                    isCritical
                      ? 'bg-rose-100 text-rose-700 animate-pulse'
                      : isHigh
                      ? 'bg-rose-50 text-rose-600'
                      : isMed
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{formatAlertTitle(alert.title)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isCritical
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : isHigh
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : isMed
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {alert.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{formatAlertDesc(alert.description)}</p>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      {t('target') || 'Mục tiêu'}: {formatTarget(alert.target)} • {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                {alert.target && alert.target !== 'Hệ thống' && alert.target !== 'System' && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleQuickBan(alert.target)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs"
                      title={t('quickBan') || 'Khóa nhanh'}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>{t('quickBan') || 'Khóa nhanh (Ban)'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {alerts.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
              <span>{t('healthy') || 'Hệ thống an toàn! Không có cảnh báo bất thường nào.'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
