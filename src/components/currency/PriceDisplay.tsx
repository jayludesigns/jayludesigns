"use client";

import { useCurrency, type CurrencyMode } from "./CurrencyContext";
import { cn, formatEur, formatVes } from "@/lib/utils";

const MODES: { value: CurrencyMode; label: string }[] = [
  { value: "ambos", label: "Bs / €" },
  { value: "ves", label: "Bs" },
  { value: "eur", label: "€" },
];

/**
 * Muestra un precio en bolívares y/o euros según lo que el visitante elija.
 * La conversión usa la tasa BCV que llega por props desde el servidor.
 */
export function PriceDisplay({
  ves,
  size = "md",
  className,
  showRate = false,
  align = "left",
}: {
  ves: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showRate?: boolean;
  align?: "left" | "right" | "center";
}) {
  const { mode, rate, stale, source } = useCurrency();
  const eur = rate > 0 ? ves / rate : 0;

  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-3xl sm:text-4xl",
  };

  const vesText = formatVes(ves);
  const eurText = formatEur(eur);

  return (
    <span
      className={cn(
        "tabular flex flex-col leading-tight",
        align === "right" && "items-end text-right",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {mode !== "eur" && (
        <span className={cn("font-semibold", sizes[size])}>
          {vesText}
        </span>
      )}
      {mode !== "ves" && rate > 0 && (
        <span
          className={cn(
            "font-normal text-ink-500",
            size === "sm" ? "text-[0.68rem]" : "text-xs sm:text-sm",
          )}
        >
          {eurText}
        </span>
      )}
      {showRate && mode !== "ves" && rate > 0 && (
        <span className="mt-0.5 text-[0.6rem] tracking-wide text-ink-400">
          1 € = {formatVes(rate, "Bs", false)} {stale ? "· tasa orientativa" : `· ${source}`}
        </span>
      )}
    </span>
  );
}

/** Selector compacto de moneda para la barra superior. */
export function CurrencyToggle({ className }: { className?: string }) {
  const { mode, setMode, rate, stale } = useCurrency();
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="flex rounded-full border border-ink-200"
        role="group"
        aria-label="Moneda de los precios"
      >
        {MODES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            aria-pressed={mode === option.value}
            className={cn(
              "px-2 py-1 font-mono text-[0.6rem] font-bold tracking-wider uppercase transition-colors",
              mode === option.value
                ? "bg-ember-600 text-paper"
                : "bg-paper text-ink hover:bg-ink-100",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {rate > 0 && (
        <span
          className="hidden font-mono text-[0.6rem] text-ink-500 lg:inline"
          title={stale ? "No pudimos actualizar la tasa; se muestra la última conocida" : "Tasa BCV vigente"}
        >
          {stale ? "~" : ""}
          {formatVes(rate, "Bs/€", false)}
        </span>
      )}
    </div>
  );
}
