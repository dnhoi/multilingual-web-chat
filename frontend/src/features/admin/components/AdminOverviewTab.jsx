import React from 'react';
import { Users, MessageSquare, Activity, AlertTriangle, CheckCircle2, Server, Database, Radio, ArrowUpRight, ArrowRight } from 'lucide-react';

const AdminOverviewTab = ({ stats, setActiveTab, onNavigateTab, t = (k) => k }) => {
  const handleNav = (tabId) => {
    if (typeof setActiveTab === 'function') {
      setActiveTab(tabId);
    } else if (typeof onNavigateTab === 'function') {
      onNavigateTab(tabId);
    }
  };

  const cards = [
    {
      id: 'users',
      title: t('totalUsersDb') || 'TỔNG NGƯỜI DÙNG (CSDL)',
      value: stats.totalUsers,
      change: '+12.5%',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors',
      accentColor: 'text-blue-600',
      hoverBorder: 'hover:border-blue-400 hover:ring-2 hover:ring-blue-500/15'
    },
    {
      id: 'conversations',
      title: t('activeConversationsStat') || 'HỘI THOẠI HOẠT ĐỘNG',
      value: stats.totalConversations,
      change: '+8.2%',
      icon: MessageSquare,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors',
      accentColor: 'text-emerald-600',
      hoverBorder: 'hover:border-emerald-400 hover:ring-2 hover:ring-emerald-500/15'
    },
    {
      id: 'analytics',
      title: t('totalMessagesSentStat') || 'TỔNG TIN NHẮN ĐÃ GỬI',
      value: stats.totalMessages,
      change: '+24.1%',
      icon: Activity,
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors',
      accentColor: 'text-indigo-600',
      hoverBorder: 'hover:border-indigo-400 hover:ring-2 hover:ring-indigo-500/15'
    },
    {
      id: 'reports',
      title: t('pendingReportsStat') || 'BÁO CÁO CẦN XỬ LÝ',
      value: stats.pendingReports,
      change: stats.pendingReports > 0 ? (t('attentionNeeded') || 'Cần chú ý') : (t('allDone') || 'Hoàn tất'),
      icon: AlertTriangle,
      iconBg: stats.pendingReports > 0 
        ? 'bg-rose-50 text-rose-600 border border-rose-100 group-hover:bg-rose-600 group-hover:text-white transition-colors' 
        : 'bg-slate-100 text-slate-500 border border-slate-200 group-hover:bg-slate-600 group-hover:text-white transition-colors',
      accentColor: stats.pendingReports > 0 ? 'text-rose-600' : 'text-slate-600',
      hoverBorder: 'hover:border-rose-400 hover:ring-2 hover:ring-rose-500/15'
    }
  ];

  const services = [
    { name: 'API Gateway', port: '8000', type: 'Spring Cloud Gateway', status: t('healthy') || 'Healthy', icon: Server, latency: '4ms', tabId: 'overview' },
    { name: 'Identity Service', port: '8080', type: 'Auth & User Management', status: t('healthy') || 'Healthy', icon: Database, latency: '8ms', tabId: 'users' },
    { name: 'Chat Service', port: '8081', type: 'Messaging Engine', status: t('healthy') || 'Healthy', icon: MessageSquare, latency: '6ms', tabId: 'conversations' },
    { name: 'Kafka & WebSocket', port: '9092 / WS', type: 'PubSub & Real-time', status: t('healthy') || 'Healthy', icon: Radio, latency: '2ms', tabId: 'broadcast' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {t('realtimeOverviewTitle') || 'Tổng Quan Hệ Thống Real-time'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('realtimeOverviewSubtitle') || 'Dữ liệu được cập nhật trực tiếp từ cơ sở dữ liệu vi dịch vụ'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => card.id && handleNav(card.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  card.id && handleNav(card.id);
                }
              }}
              className={`bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg relative overflow-hidden transition-all duration-200 cursor-pointer hover:-translate-y-1 group active:scale-[0.99] select-none ${card.hoverBorder}`}
              title={`Bấm để chuyển tới tab ${card.title}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition-colors">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl transition-all duration-200 ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                  {card.value}
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                  <ArrowUpRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /> {card.change}
                </span>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-blue-600 transition-colors">
                <span className="font-medium">Xem chi tiết</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">
              {t('microservicesStatus') || 'Trạng Thái Microservices'}
            </h3>
          </div>
          <span className="text-[11px] font-mono font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {t('clusterActive') || 'Cluster: 4 Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {services.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div 
                key={idx} 
                onClick={() => srv.tabId && handleNav(srv.tabId)}
                role="button"
                tabIndex={0}
                className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-slate-100/80 hover:shadow-xs transition-all space-y-3 cursor-pointer group select-none"
                title={`Bấm để chuyển tới tab liên quan (${srv.name})`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{srv.status}</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">{srv.name}</h4>
                  <p className="text-[10px] text-slate-400">{srv.type}</p>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-200/80 text-slate-500">
                  <span>Port: <strong className="text-slate-700 font-mono">{srv.port}</strong></span>
                  <span>{t('latency') || 'Latency'}: <strong className="text-emerald-600 font-mono">{srv.latency}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewTab;
