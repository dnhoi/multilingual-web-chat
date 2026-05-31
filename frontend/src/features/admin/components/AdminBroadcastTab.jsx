import React, { useState, useEffect } from 'react';
import { Megaphone, ShieldAlert, Check, RefreshCw, Plus, X } from 'lucide-react';
import * as settingsApi from '../../settings/api/settings.api';
import { useToast } from '../../../contexts/ToastContext';

export default function AdminBroadcastTab({ systemConfigs, handleConfigChange, saveSystemConfigs, onRefreshData, t = (k) => k }) {
  const { showToast } = useToast();
  const [broadcastEnabled, setBroadcastEnabled] = useState(true);
  const [broadcastType, setBroadcastType] = useState('INFO');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSavingBroadcast, setIsSavingBroadcast] = useState(false);

  // Banned keywords
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    // Parse broadcast config
    const bcCfg = systemConfigs.find(c => c.key === 'broadcast_announcement');
    if (bcCfg?.value) {
      try {
        const parsed = JSON.parse(bcCfg.value);
        setBroadcastEnabled(Boolean(parsed.enabled));
        setBroadcastType(parsed.type || 'INFO');
        setBroadcastMessage(parsed.message || '');
      } catch {
        setBroadcastMessage(bcCfg.value);
      }
    }

    // Parse banned keywords
    const kwCfg = systemConfigs.find(c => c.key === 'banned_keywords');
    if (kwCfg?.value) {
      setKeywords(kwCfg.value.split(',').map(k => k.trim()).filter(Boolean));
    }
  }, [systemConfigs]);

  const handleSaveBroadcast = async (e) => {
    e?.preventDefault();
    setIsSavingBroadcast(true);
    try {
      await settingsApi.updateBroadcast({
        enabled: broadcastEnabled,
        type: broadcastType,
        message: broadcastMessage.trim()
      });
      showToast((t('broadcastTitle') || 'Thông Báo Nổi') + ': ' + (t('configSaveSuccess') || 'Đã cập nhật cấu hình hệ thống thành công!'), 'success');
      onRefreshData?.();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    } finally {
      setIsSavingBroadcast(false);
    }
  };

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (!trimmed || keywords.includes(trimmed)) return;
    const updated = [...keywords, trimmed];
    setKeywords(updated);
    setNewKeyword('');
    handleConfigChange('banned_keywords', updated.join(', '));
  };

  const handleRemoveKeyword = (kwToRemove) => {
    const updated = keywords.filter(k => k !== kwToRemove);
    setKeywords(updated);
    handleConfigChange('banned_keywords', updated.join(', '));
  };

  const handleSaveKeywords = async () => {
    try {
      await saveSystemConfigs();
    } catch (err) {
      showToast('Lỗi: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Megaphone className="w-5 h-5 text-blue-600" />
          {t('broadcastTitle') || 'Thông Báo Nổi Toàn Hệ Thống'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('broadcastSubtitle') || 'Cấu hình banner hiển thị trực tiếp trên đầu màn hình chat của người dùng'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Broadcast Announcement Panel */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Megaphone className="w-4 h-4 text-amber-500" />
              <span>{t('broadcastTitle') || 'Biểu Ngữ Thông Báo'}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={broadcastEnabled}
                onChange={(e) => setBroadcastEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-2 text-xs font-semibold text-slate-600">
                {broadcastEnabled ? (t('activeStatus') || 'Bật') : (t('bannedStatus') || 'Tắt')}
              </span>
            </label>
          </div>

          <form onSubmit={handleSaveBroadcast} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('bannerType') || 'Loại Thông Báo'}</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'INFO', label: 'Info', color: 'border-blue-300 bg-blue-50 text-blue-700' },
                  { id: 'WARNING', label: 'Warn', color: 'border-amber-300 bg-amber-50 text-amber-700' },
                  { id: 'CRITICAL', label: 'Urgent', color: 'border-rose-300 bg-rose-50 text-rose-700' }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setBroadcastType(type.id)}
                    className={`py-2 px-2 text-[11px] font-bold rounded-xl border text-center transition-all ${
                      broadcastType === type.id
                        ? `${type.color} ring-2 ring-blue-500/20 shadow-xs`
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {t('bannerContent') || 'Nội dung thông báo'}
              </label>
              <textarea
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Nhập thông báo gửi đến toàn bộ người dùng..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none transition-colors"
              />
            </div>

            {/* Live Preview */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Preview:</span>
              <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                broadcastType === 'CRITICAL'
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : broadcastType === 'WARNING'
                  ? 'bg-amber-50 border border-amber-200 text-amber-700'
                  : 'bg-blue-50 border border-blue-200 text-blue-700'
              }`}>
                <Megaphone className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{broadcastMessage || 'Chưa có nội dung thông báo'}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingBroadcast}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              {isSavingBroadcast ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{isSavingBroadcast ? (t('saving') || 'Đang lưu...') : (t('saveBanner') || 'Lưu Thông Báo')}</span>
            </button>
          </form>
        </div>

        {/* 2. Banned Words Management Panel */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>{t('bannedKeywordsTitle') || 'Bộ Lọc Từ Cấm'}</span>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                {keywords.length} keywords
              </span>
            </div>

            <p className="text-xs text-slate-500">
              {t('bannedKeywordsSubtitle') || 'Tin nhắn chứa các từ khóa này sẽ tự động được che chắn bằng dấu ***'}
            </p>

            {/* Add new keyword */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('addKeywordPlaceholder') || 'Nhập từ cấm mới...'}
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('addKeyword') || 'Thêm'}</span>
              </button>
            </div>

            {/* Keywords tags list */}
            <div className="min-h-[140px] max-h-[190px] overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1.5 content-start">
              {keywords.map(kw => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 group"
                >
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(kw)}
                    className="text-rose-400 hover:text-rose-700 rounded-full p-0.5 hover:bg-rose-100 transition-colors"
                    title="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {keywords.length === 0 && (
                <div className="w-full text-center py-8 text-xs text-slate-400">
                  No banned keywords yet.
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveKeywords}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('saveConfig') || 'Lưu Cấu Hình'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
