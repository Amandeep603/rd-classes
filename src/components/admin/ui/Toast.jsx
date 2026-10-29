"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext({
  showToast: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success", duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const isError = toast.type === "error";
          const isInfo = toast.type === "info";
          const Icon = isError ? AlertCircle : isInfo ? Info : CheckCircle2;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl p-4 shadow-xl border animate-in slide-in-from-bottom-3 duration-200 ${
                isError
                  ? "bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]"
                  : isInfo
                  ? "bg-[#EFF6FF] border-[#93C5FD] text-[#1E40AF]"
                  : "bg-white border-black/10 text-[#111827]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-5 w-5 shrink-0 ${
                    isError
                      ? "text-[#DC2626]"
                      : isInfo
                      ? "text-[#3B82F6]"
                      : "text-[#16A34A]"
                  }`}
                />
                <span className="text-sm font-semibold">{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded-lg p-1 text-black/40 hover:text-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
