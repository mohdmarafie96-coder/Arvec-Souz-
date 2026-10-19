import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 transition-all animate-in slide-in-from-bottom-5 duration-200 text-xs ${
            toast.type === 'success'
              ? 'bg-slate-900 border-emerald-500/40 text-emerald-200'
              : toast.type === 'warning'
              ? 'bg-slate-900 border-amber-500/40 text-amber-200'
              : 'bg-slate-900 border-indigo-500/40 text-indigo-200'
          }`}
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          {toast.type === 'warning' && (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          {toast.type === 'info' && (
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 space-y-0.5">
            <div className="font-bold text-white tracking-tight">{toast.title}</div>
            {toast.message && (
              <div className="text-[11px] text-slate-400 leading-relaxed font-sans">
                {toast.message}
              </div>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
