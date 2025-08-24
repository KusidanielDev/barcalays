"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";

type Toast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "success" | "destructive" | "warning";
};

type ToastContextValue = {
  toast: (t: Omit<Toast, "id">) => void;
  success: (title: React.ReactNode, description?: React.ReactNode) => void;
  error: (title: React.ReactNode, description?: React.ReactNode) => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback(
    (id: string) => setToasts((ts) => ts.filter((t) => t.id !== id)),
    []
  );

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((ts) => [...ts, { id, ...t }]);
      // auto-dismiss after 3.5s
      setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  const success = useCallback(
    (title: React.ReactNode, description?: React.ReactNode) =>
      toast({ title, description, variant: "success" }),
    [toast]
  );

  const error = useCallback(
    (title: React.ReactNode, description?: React.ReactNode) =>
      toast({ title, description, variant: "destructive" }),
    [toast]
  );

  const value = useMemo(
    () => ({ toast, success, error, remove }),
    [toast, success, error, remove]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}

export function Toaster({
  toasts,
  onClose,
}: {
  toasts: Toast[];
  onClose: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            "min-w-[260px] max-w-sm rounded-xl border shadow-sm bg-white p-3",
            t.variant === "destructive" ? "border-red-300" : "border-gray-200",
          ].join(" ")}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              {t.title ? <div className="font-medium">{t.title}</div> : null}
              {t.description ? (
                <div className="text-sm text-gray-600">{t.description}</div>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => onClose(t.id)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Default export so you can `import ToastProvider from "@/components/ui/toast"`
export default ToastProvider;
