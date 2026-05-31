import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info' }
  const [timerId, setTimerId] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    if (!message) return;
    if (timerId) clearTimeout(timerId);
    setToast({ message, type });
    const id = setTimeout(() => {
      setToast(null);
    }, 4000);
    setTimerId(id);
  }, [timerId]);

  // Provide global window access & intercept legacy browser alert popups
  useEffect(() => {
    window.showToast = showToast;
    const originalAlert = window.alert;
    window.alert = (msg) => {
      showToast(String(msg), 'info');
    };
    return () => {
      window.alert = originalAlert;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          role="alert"
          className={`fixed top-5 right-5 z-[99999] flex items-center p-3.5 space-x-3 max-w-sm w-auto bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-2xl border transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
            toast.type === 'success'
              ? 'border-emerald-500/30 shadow-emerald-500/10'
              : toast.type === 'error'
              ? 'border-rose-500/30 shadow-rose-500/10'
              : 'border-blue-500/30 shadow-blue-500/10'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
          )}

          <div className="flex-1 min-w-0 pr-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-zinc-100 leading-snug break-words">
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => setToast(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex-shrink-0"
            title="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
