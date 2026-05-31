import { useState, useEffect } from 'react';
import { Megaphone, AlertTriangle, Info, X } from 'lucide-react';
import { getPublicAnnouncement } from '../../settings/api/settings.api';

export default function BroadcastBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAnnouncement = async () => {
      try {
        const res = await getPublicAnnouncement();
        const raw = res?.result?.value || res?.data?.value;
        if (!raw) return;

        let parsed;
        try {
          parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
          parsed = { enabled: true, message: raw, type: 'INFO' };
        }

        if (parsed?.enabled && parsed?.message) {
          const dismissedKey = `dismissed_announcement_${parsed.message.slice(0, 20)}`;
          if (sessionStorage.getItem(dismissedKey)) {
            return;
          }
          if (isMounted) {
            setAnnouncement(parsed);
          }
        }
      } catch (err) {
        console.debug('Failed to fetch public announcement:', err.message);
      }
    };

    fetchAnnouncement();
    const interval = setInterval(fetchAnnouncement, 60000); // Check every minute
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!announcement || !announcement.enabled || isDismissed) return null;

  const handleDismiss = () => {
    const dismissedKey = `dismissed_announcement_${announcement.message.slice(0, 20)}`;
    sessionStorage.setItem(dismissedKey, 'true');
    setIsDismissed(true);
  };

  const isWarning = announcement.type === 'WARNING' || announcement.type === 'MAINTENANCE';
  const isCritical = announcement.type === 'CRITICAL';

  return (
    <div
      className={`px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-xs transition-all duration-300 relative z-30 ${
        isCritical
          ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white'
          : isWarning
          ? 'bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-zinc-950 font-semibold'
          : 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white'
      }`}
    >
      <div className="flex items-center gap-2.5 max-w-5xl mx-auto flex-1 min-w-0">
        <div className="p-1 rounded-lg bg-black/15 flex-shrink-0">
          {isCritical ? (
            <AlertTriangle className="w-3.5 h-3.5" />
          ) : isWarning ? (
            <Megaphone className="w-3.5 h-3.5" />
          ) : (
            <Info className="w-3.5 h-3.5" />
          )}
        </div>
        <span className="truncate tracking-wide text-xs">
          <strong className="uppercase mr-1.5 opacity-80 text-[10px] tracking-wider">
            {announcement.type || 'THÔNG BÁO'}:
          </strong>
          {announcement.message}
        </span>
      </div>

      <button
        onClick={handleDismiss}
        className="p-1 rounded-lg hover:bg-black/20 text-current transition-colors ml-3 flex-shrink-0"
        title="Đóng thông báo"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
