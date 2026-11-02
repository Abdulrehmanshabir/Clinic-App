"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title: string; message?: string; duration?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_STYLES: Record<
  ToastType,
  { accent: string; iconBox: string; glow: string; border: string }
> = {
  success: {
    accent: "from-[#047857] via-[#10B981] to-[#6EE7B7]",
    iconBox: "bg-[#ECFDF5] text-[#047857] ring-[#A7F3D0]",
    glow: "bg-[#6EE7B7]/25",
    border: "border-[#BBF7D0] dark:border-[#065F46]",
  },
  error: {
    accent: "from-[#9F1239] via-[#E11D48] to-[#FDA4AF]",
    iconBox: "bg-[#FFF1F2] text-[#BE123C] ring-[#FECDD3]",
    glow: "bg-[#FDA4AF]/25",
    border: "border-[#FECDD3] dark:border-[#881337]",
  },
  warning: {
    accent: "from-[#B45309] via-[#F59E0B] to-[#FCD34D]",
    iconBox: "bg-[#FFFBEB] text-[#B45309] ring-[#FDE68A]",
    glow: "bg-[#FCD34D]/25",
    border: "border-[#FDE68A] dark:border-[#78350F]",
  },
  info: {
    accent: "from-[#0369A1] via-[#0EA5E9] to-[#7DD3FC]",
    iconBox: "bg-[#F0F9FF] text-[#0369A1] ring-[#BAE6FD]",
    glow: "bg-[#7DD3FC]/25",
    border: "border-[#BAE6FD] dark:border-[#0C4A6E]",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      type = "info",
      title,
      message,
      duration = 4000,
    }: {
      type?: ToastType;
      title: string;
      message?: string;
      duration?: number;
    }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, title, message };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => addToast({ type: "success", title, message }), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast({ type: "error", title, message }), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast({ type: "info", title, message }), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast({ type: "warning", title, message }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 w-[calc(100vw-2rem)] sm:w-[380px] max-w-[calc(100vw-2rem)] pointer-events-none">
        {toasts.map((t) => {
          const style = TOAST_STYLES[t.type];

          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 p-4 pl-5 rounded-2xl border bg-[#FFFDF9]/95 dark:bg-[#131B2A]/95 backdrop-blur-xl text-[#1A120B] dark:text-[#F8FAFC] shadow-[0_18px_45px_rgba(26,18,11,0.18)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.5)] transition-all duration-300 animate-in slide-in-from-top-4 fade-in ${style.border}`}
            >
              <span
                className={`pointer-events-none absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${style.accent}`}
              />
              <span
                className={`pointer-events-none absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl ${style.glow}`}
              />

              <div
                className={`relative shrink-0 w-10 h-10 rounded-xl ring-1 flex items-center justify-center shadow-xs ${style.iconBox}`}
              >
                {t.type === "success" && <CheckCircle2 className="w-5 h-5" />}
                {t.type === "error" && <AlertCircle className="w-5 h-5" />}
                {t.type === "warning" && <AlertTriangle className="w-5 h-5" />}
                {t.type === "info" && <Info className="w-5 h-5" />}
              </div>

              <div className="relative flex-1 min-w-0">
                <p className="font-serif text-sm sm:text-base font-black leading-snug">
                  {t.title}
                </p>
                {t.message && (
                  <p className="mt-0.5 text-xs sm:text-sm font-semibold text-[#6B5A47] dark:text-[#CBD5E1] leading-snug">
                    {t.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Close notification"
                className="relative shrink-0 p-1.5 rounded-lg text-[#8C6843] dark:text-[#94A3B8] hover:bg-[#F4EFE6] dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
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
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
