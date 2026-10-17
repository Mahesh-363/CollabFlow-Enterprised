import React from 'react';
import { X, MessageSquare, Bell } from 'lucide-react';
import { useCollabStore } from '../store/useCollabStore';

export const ToastNotification: React.FC = () => {
  const { toasts, dismissToast, setActiveChannel } = useCollabStore();

  // Auto-dismiss toasts after 4 seconds
  React.useEffect(() => {
    if (toasts.length === 0) return;
    const oldest = toasts[0];
    const timer = setTimeout(() => {
      dismissToast(oldest.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-slate-900/95 border border-indigo-500/50 rounded-xl shadow-2xl p-3 text-slate-100 flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-top-2 duration-200"
        >
          <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 shrink-0">
            <Bell className="w-4 h-4" />
          </div>

          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => {
              setActiveChannel(toast.channelId);
              dismissToast(toast.id);
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-indigo-300 truncate">
                {toast.authorName} in #{toast.channelName}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{toast.time}</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
              {toast.content}
            </p>
          </div>

          <button
            onClick={() => dismissToast(toast.id)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
