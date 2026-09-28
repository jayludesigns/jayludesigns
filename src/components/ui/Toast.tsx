"use client";

import { Check, Info, TriangleAlert, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastTone = "ok" | "info" | "error";

interface Toast {
  id: number;
  message: string;
  detail?: string;
  tone: ToastTone;
}

interface ToastValue {
  toast(message: string, options?: { detail?: string; tone?: ToastTone }): void;
}

const ToastContext = createContext<ToastValue | null>(null);

const ICONS = { ok: Check, info: Info, error: TriangleAlert };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastValue["toast"]>(
    (message, options) => {
      const id = nextId.current++;
      setToasts((current) => [
        ...current.slice(-3),
        { id, message, detail: options?.detail, tone: options?.tone ?? "ok" },
      ]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-3 bottom-3 z-90 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:items-end"
      >
        {toasts.map((item) => {
          const Icon = ICONS[item.tone];
          return (
            <div
              key={item.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-ink-200 bg-paper px-4 py-3 shadow-lg animate-pop"
            >
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
                  item.tone === "ok"
                    ? "bg-ember-600 text-paper"
                    : item.tone === "error"
                      ? "bg-ink text-paper"
                      : "bg-ink-100 text-ink-700"
                }`}
              >
                <Icon className="size-3" strokeWidth={2.5} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{item.message}</p>
                {item.detail ? (
                  <p className="mt-0.5 text-xs leading-snug text-ink-500">{item.detail}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="-mt-1 -mr-1 p-1 text-ink-500 transition-colors hover:text-ink"
                aria-label="Cerrar aviso"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return context;
}
