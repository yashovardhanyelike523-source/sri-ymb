// ==============================================================================
// SRI YMB TRADING COMPANY — TOAST NOTIFICATION CONTEXT
// ==============================================================================

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = 'info', duration = 4000 }) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message, title = 'Success') => addToast({ title, message, type: 'success' }),
    [addToast]
  );

  const error = useCallback(
    (message, title = 'Error') => addToast({ title, message, type: 'error', duration: 6000 }),
    [addToast]
  );

  const warning = useCallback(
    (message, title = 'Warning') => addToast({ title, message, type: 'warning' }),
    [addToast]
  );

  const info = useCallback(
    (message, title = 'Information') => addToast({ title, message, type: 'info' }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((toast) => {
          let bgClass = 'bg-slate-900 text-white border-slate-700';
          let icon = <Info className="w-5 h-5 text-sky-400 shrink-0" />;

          if (toast.type === 'success') {
            bgClass = 'bg-emerald-950 text-emerald-50 border-emerald-700 shadow-emerald-950/40';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          } else if (toast.type === 'error') {
            bgClass = 'bg-red-950 text-red-50 border-red-700 shadow-red-950/40';
            icon = <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />;
          } else if (toast.type === 'warning') {
            bgClass = 'bg-amber-950 text-amber-50 border-amber-700 shadow-amber-950/40';
            icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${bgClass}`}
            >
              {icon}
              <div className="flex-1 text-sm">
                {toast.title && <div className="font-semibold">{toast.title}</div>}
                <div className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</div>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 p-0.5 rounded transition"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
