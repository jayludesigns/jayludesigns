"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type CurrencyMode = "ambos" | "ves" | "eur";

interface CurrencyValue {
  mode: CurrencyMode;
  setMode: (mode: CurrencyMode) => void;
  rate: number;
  /** Última tasa conocida, aunque la consulta a la BCV haya fallado. */
  source: string;
  updatedAt: string | null;
  stale: boolean;
}

const CurrencyContext = createContext<CurrencyValue | null>(null);
const STORAGE_KEY = "jaylu.moneda.v1";

export function CurrencyProvider({
  children,
  rate,
  source,
  updatedAt,
  stale,
}: { children: ReactNode } & Omit<CurrencyValue, "mode" | "setMode">) {
  const [mode, setModeState] = useState<CurrencyMode>(() => {
    if (typeof window === "undefined") return "ambos";
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored === "ambos" || stored === "ves" || stored === "eur" ? stored : "ambos";
    } catch {
      /* localStorage bloqueado: se queda el valor por defecto */
      return "ambos";
    }
  });

  const setMode = useCallback((next: CurrencyMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* sin persistencia */
    }
  }, []);

  const value = useMemo<CurrencyValue>(
    () => ({ mode, setMode, rate, source, updatedAt, stale }),
    [mode, setMode, rate, source, updatedAt, stale],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyValue {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency debe usarse dentro de <CurrencyProvider>");
  return context;
}
