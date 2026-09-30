import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convierte un texto en un slug apto para URL. */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

const LOCALE = "es-VE";

export function formatVes(amount: number, symbol = "Bs.", withDecimals = true): string {
  const value = withDecimals ? amount : Math.round(amount);
  return `${new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  }).format(value)} ${symbol}`;
}

export function formatEur(amount: number, withDecimals = true): string {
  // "narrowSymbol" a propósito: en es-VE el símbolo del euro no está
  // registrado y Intl cae en el código ("EUR 1,64"). Con narrow sale "€1,64",
  // y se mantiene la misma regla de miles que los bolívares (1.234,50) para
  // que las dos monedas se lean igual.
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "EUR",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: withDecimals ? 2 : 0,
    maximumFractionDigits: withDecimals ? 2 : 0,
  }).format(amount);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** "hace 3 días" / "en 2 semanas" */
export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === "minute") return rtf.format(Math.round(diff / ms), unit);
  }
  return "ahora";
}

/**
 * ¿Venció algo?
 *
 * El reloj se lee fuera del componente, una sola vez por render, y se pasa
 * como `now`. Consultarlo dentro del render produce resultados distintos en
 * cada fila y además impide razonar sobre la vista: dos tareas que cruzan la
 * medianoche a la vez deberían decir ambas lo mismo.
 */
export function isOverdue(
  dueAt: string | null | undefined,
  now: Date,
): boolean {
  if (!dueAt) return false;
  const due = new Date(dueAt).getTime();
  return Number.isFinite(due) && due < now.getTime();
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function whatsappUrl(number: string, text?: string): string {
  const digits = number.replace(/\D/g, "");
  const base = digits.startsWith("58") ? digits : `58${digits.replace(/^0/, "")}`;
  return `https://wa.me/${base}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Normaliza un teléfono venezolano a formato internacional para WhatsApp. */
export function normalizePhone(value: string | null | undefined): string {
  if (!value) return "";
  return whatsappUrl(value).replace("https://wa.me/", "");
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function eurToVes(eur: number, rate: number): number {
  if (!rate || rate <= 0) return 0;
  return round2(eur * rate);
}

export function downloadCsv(filename: string, rows: (string | number | null | undefined)[][]) {
  const escape = (cell: string | number | null | undefined) => {
    const text = cell === null || cell === undefined ? "" : String(cell);
    return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = "﻿" + rows.map((r) => r.map(escape).join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
