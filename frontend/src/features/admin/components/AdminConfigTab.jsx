import React from 'react';
import { Settings, Save } from 'lucide-react';

const AdminConfigTab = ({ systemConfigs, handleConfigChange, saveSystemConfigs, t = (k) => k }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            {t('systemConfigTitle') || 'Cấu Hình Hạn Mức & Chế Độ Hệ Thống'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('systemConfigSubtitle') || 'Tùy chỉnh thông số giới hạn bộ nhớ, số lượng kết nối và trạng thái bảo trì'}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 space-y-6 shadow-xs">
        <div className="space-y-4 divide-y divide-slate-100">
          {systemConfigs.map((cfg) => (
            <div key={cfg.key} className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-800 capitalize">
                  {t('cfg_key_' + cfg.key) || cfg.key.replace(/_/g, ' ')}
                </h4>
                <p className="text-xs text-slate-400">{t('cfg_desc_' + cfg.key) || cfg.description}</p>
              </div>

              <div className="flex items-center space-x-3">
                {cfg.key === 'maintenance_mode' ? (
                  <select
                    value={cfg.value}
                    onChange={(e) => handleConfigChange(cfg.key, e.target.value)}
                    className={`px-4 py-2 border rounded-xl text-xs font-bold focus:outline-none transition-colors shadow-2xs ${
                      cfg.value === 'ON'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <option value="OFF">{t('maintenance_off') || 'OFF (Normal)'}</option>
                    <option value="ON">{t('maintenance_on') || 'ON (Maintenance)'}</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={cfg.value}
                    onChange={(e) => handleConfigChange(cfg.key, e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-600 w-52 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-2xs"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {systemConfigs.length > 0 && (
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={saveSystemConfigs}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all duration-200"
            >
              <Save className="w-4 h-4" />
              <span>{t('saveConfig') || 'Lưu Cấu Hình'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConfigTab;
