import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const COLORS = {
  success: { bg: 'rgba(34,237,216,0.08)', border: 'rgba(34,237,216,0.3)', icon: '#22EDD8' },
  error:   { bg: 'rgba(255,77,109,0.08)', border: 'rgba(255,77,109,0.3)', icon: '#FF7090' },
  info:    { bg: 'rgba(108,95,222,0.08)', border: 'rgba(108,95,222,0.3)', icon: '#9B8FFF' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
        }}
      >
        {toasts.map(t => {
          const Icon = ICONS[t.type];
          const colors = COLORS[t.type];
          return (
            <div
              key={t.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10, minWidth: 240,
                background: '#141830', border: `1px solid ${colors.border}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                animation: 'floatUp 0.3s ease-out forwards',
              }}
            >
              <Icon size={15} style={{ color: colors.icon, flexShrink: 0 }} />
              <span style={{ color: '#CCD6F6', fontSize: 13, flex: 1 }}>{t.message}</span>
              <button
                onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={13} style={{ color: '#4A5580' }} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
