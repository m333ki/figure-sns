"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: string; message: string };

const ToastContext = createContext<{ showToast: (message: string) => void } | null>(null);

const DISPLAY_MS = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DISPLAY_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* bottom-20: clears the mobile bottom nav; lg:bottom-6 since desktop has none */}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto max-w-sm rounded-full bg-foreground px-4 py-2.5 text-center text-sm text-background shadow-lg"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
