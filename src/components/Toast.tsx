import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
      {toasts.map(toast => {
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
        let borderClass = 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/80';
        
        if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
          borderClass = 'border-rose-200 dark:border-rose-800/60 bg-rose-50 dark:bg-rose-950/80';
        } else if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-blue-500 shrink-0" />;
          borderClass = 'border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/80';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-sm transition-all transform animate-in fade-in slide-in-from-bottom-2 duration-200 ${borderClass}`}
          >
            {icon}
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 flex-1 leading-snug">
              {toast.message}
            </p>
          </div>
        );
      })}
    </div>
  );
};
