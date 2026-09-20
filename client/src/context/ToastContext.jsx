import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur)
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};

const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border text-sm font-medium transition-all duration-300 transform translate-y-0 opacity-100 ${
            t.type === 'success'
              ? 'bg-emerald-900/90 text-emerald-100 border-emerald-700 backdrop-blur-md'
              : t.type === 'error'
              ? 'bg-rose-900/90 text-rose-100 border-rose-700 backdrop-blur-md'
              : t.type === 'warning'
              ? 'bg-amber-900/90 text-amber-100 border-amber-700 backdrop-blur-md'
              : 'bg-slate-900/90 text-slate-100 border-slate-700 backdrop-blur-md'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">
              {t.type === 'success' && '✓'}
              {t.type === 'error' && '✕'}
              {t.type === 'warning' && '⚠️'}
              {t.type === 'info' && 'ℹ️'}
            </span>
            <span>{t.message}</span>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="ml-3 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
