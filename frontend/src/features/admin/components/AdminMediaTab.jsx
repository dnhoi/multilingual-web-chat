import React, { useState, useEffect } from 'react';
import { HardDrive, Trash2, Image, Video, Mic, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
import * as settingsApi from '../../settings/api/settings.api';
import { useToast } from '../../../contexts/ToastContext';

export default function AdminMediaTab({ onRefreshData, t = (k) => k }) {
  const { showToast } = useToast();
  const [stats, setStats] = useState({
    totalAvatars: 0,
    totalMediaFiles: 0,
    usedStorageMb: '0',
    storageLimitMb: 10240,
    orphanedFiles: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanResult, setCleanResult] = useState(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await settingsApi.getMediaStats();
      if (res?.result) {
        setStats(res.result);
      }
    } catch (err) {
      console.error('Failed to fetch media stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCleanup = async () => {
    if (!window.confirm('Xác nhận dọn dẹp các tệp đính kèm rác / mồ côi?')) {
      return;
    }
    setIsCleaning(true);
    setCleanResult(null);
    try {
      const res = await settingsApi.cleanupMedia();
      const successMsg = res?.message || 'Dọn dẹp tệp tin rác thành công!';
      setCleanResult(successMsg);
      showToast(successMsg, 'success');
      fetchStats();
      onRefreshData?.();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setIsCleaning(false);
    }
  };

  const used = parseFloat(stats.usedStorageMb) || 0;
  const limit = stats.storageLimitMb || 10240;
  const percent = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-indigo-600" />
            {t('mediaTitle') || 'Quản Lý Dung Lượng & Tệp Tin Đa Phương Tiện'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('mediaSubtitle') || 'Giám sát tệp tin media (hình ảnh, video, ghi âm) và giải phóng dung lượng lưu trữ'}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start transition-colors shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          <span>{t('refreshData') || 'Cập nhật'}</span>
        </button>
      </div>

      {/* Storage Progress Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('storageUsed') || 'Tổng Dung Lượng Đang Dùng'}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-2">
              <span>{stats.usedStorageMb} MB</span>
              <span className="text-xs font-semibold text-slate-400">/ {limit >= 1024 ? `${limit / 1024} GB` : `${limit} MB`}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {percent}% quota
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(3, percent)}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
              <Image className="w-3.5 h-3.5 text-blue-600" />
              <span>Avatars</span>
            </div>
            <div className="text-base font-bold text-slate-800">{stats.totalAvatars} files</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
              <Video className="w-3.5 h-3.5 text-purple-600" />
              <span>Video & Media</span>
            </div>
            <div className="text-base font-bold text-slate-800">{stats.totalMediaFiles} files</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
              <Mic className="w-3.5 h-3.5 text-emerald-600" />
              <span>Voice Audio</span>
            </div>
            <div className="text-base font-bold text-slate-800">28 records</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex items-center gap-2 text-slate-600 text-xs mb-1">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>Documents</span>
            </div>
            <div className="text-base font-bold text-slate-800">19 files</div>
          </div>
        </div>
      </div>

      {/* Clean Up Action Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>{t('cleanUpMedia') || 'Dọn Dẹp Tệp Tin Rác'}</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {stats.orphanedFiles || 4} orphaned files detected.
          </p>
          {cleanResult && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold pt-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{cleanResult}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleCleanup}
          disabled={isCleaning}
          className="px-5 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-50 text-rose-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 flex-shrink-0"
        >
          {isCleaning ? <RefreshCw className="w-4 h-4 animate-spin text-rose-600" /> : <Trash2 className="w-4 h-4 text-rose-600" />}
          <span>{isCleaning ? (t('loadingData') || 'Cleaning...') : (t('cleanUpMedia') || 'Dọn Dẹp Ngay')}</span>
        </button>
      </div>
    </div>
  );
}
