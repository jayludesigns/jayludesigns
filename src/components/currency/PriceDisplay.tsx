"use client";

import { useCurrency, type CurrencyMode } from "./CurrencyContext";
import { cn, formatEur, formatVes } from "@/lib/utils";

const MODES: { value: CurrencyMode; label: string }[] = [
  { value: "ambos", label: "Bs / €" },
  { value: "ves", label: "Bs" },
  { value: "eur", label: "€" },
];

/**
 * Muestra un precio en euros y/o bolívares según lo que elija el visitante.
 * La conversión usa la tasa BCV que llega por props desde el servidor.
 *
 * La línea grande es siempre la de la moneda activa: con el modo euro el euro
 * va arriba y los bolívares en pequeño debajo, y al revés. Así el color de
 * acento y el tachado caen sobre el número que el visitante está leyendo,
 * en vez de sobre una posición fija del HTML.
 */
export function PriceDisplay({
  ves,
  size = "md",
  className,
  showRate = false,
  align = "left",
  strike = false,
  dim = false,
  inline = false,
  secondaryClassName,
  rate: rateProp,
}: {
  ves: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showRate?: boolean;
  align?: "left" | "right" | "center";
  /** Tacha la línea principal: para el precio de comparación. */
  strike?: boolean;
  /** Apaga la línea secundaria: para tarjetas sobre fondo oscuro. */
  dim?: boolean;
  /** Versión en una sola línea, para poder escribir el precio dentro de un texto. */
  inline?: boolean;
  /** Color exacto de la línea secundaria, cuando el fondo no es el habitual. */
  secondaryClassName?: string;
  /**
   * Tasa propia para convertir. La usan los pedidos ya registrados: el euro
   * se calcula con la tasa del día en que se hizo la compra, no con la de hoy.
   */
  rate?: number;
}) {
  const { mode, rate, stale, source } = useCurrency();
  const tasa = rateProp ?? rate;
  const hayTasa = tasa > 0;

  // Sin tasa no hay conversión posible, así que se queda con los bolívares
  // (el precio original) en vez de dejar el hueco vacío.
  const efectivo: CurrencyMode = mode === "eur" && !hayTasa ? "ves" : mode;
  const principal: "ves" | "eur" = efectivo === "eur" ? "eur" : "ves";

  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    xl: "text-3xl sm:text-4xl",
  };

  const lineas: { key: "ves" | "eur"; texto: string }[] = [];
  if (efectivo !== "eur") lineas.push({ key: "ves", texto: formatVes(ves) });
  if (efectivo !== "ves" && hayTasa) {
    lineas.push({ key: "eur", texto: formatEur(ves / tasa) });
  }

  return (
    <span
      className={cn(
        "tabular leading-tight",
        inline
          ? "inline-flex items-baseline gap-1.5 whitespace-nowrap"
          : "flex flex-col",
        align === "right" && "items-end text-right",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {lineas.map((linea) => (
        <span
          key={linea.key}
          className={cn(
            linea.key === principal
              ? cn("font-semibold", sizes[size], strike && "line-through")
              : cn(
                  "font-normal",
                  size === "sm" ? "text-[0.7rem]" : "text-xs sm:text-sm",
                  dim ? "text-ink-400" : "text-ink-500",
                  secondaryClassName,
                ),
          )}
        >
          {linea.texto}
        </span>
      ))}
      {showRate && efectivo !== "ves" && hayTasa && (
        <span className="mt-0.5 text-[0.62rem] tracking-wide text-ink-500">
          1 € = {formatVes(tasa, "Bs", false)}{" "}
          {stale && !rateProp ? "· tasa orientativa" : `· ${source}`}
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
              "px-2 py-1 font-mono text-[0.62rem] font-bold tracking-wider uppercase transition-colors",
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
          className="hidden font-mono text-[0.62rem] text-ink-500 lg:inline"
          title={stale ? "No pudimos actualizar la tasa; se muestra la última conocida" : "Tasa BCV vigente"}
        >
          {stale ? "~" : ""}
          {formatVes(rate, "Bs/€", false)}
        </span>
      )}
    </div>
  );
}
