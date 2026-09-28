import { getBcvState } from "@/lib/bcv";
import type { Backend } from "./backend";
import { localBackend } from "./local";
import { SupabaseBackend } from "./supabase";

export type { Backend, Insertable, QueryOptions, Where } from "./backend";
export { newId, nowIso } from "./backend";

let supabaseInstance: SupabaseBackend | null = null;

/**
 * Selecciona el backend de datos.
 *
 * - Con NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY → Postgres (Supabase).
 * - Sin esas variables → archivo local `.data/db.json`, ideal para desarrollo
 *   y para probar el panel de administración sin conexión.
 */
export function getBackend(): Backend {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    supabaseInstance ??= new SupabaseBackend();
    return supabaseInstance;
  }
  return localBackend;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

/* ------------------------------------------------------------------ */
/* Ajustes de la tienda                                               */
/* ------------------------------------------------------------------ */

const STORE_DEFAULTS = {
  store_name: "JayLu",
  tagline: "Franelas con alma. Estampados que cuentan algo.",
  description: "",
  email: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  tiktok: "",
  address: "",
  currency_symbol: "Bs.S",
  shipping_flat_ves: 5,
  free_shipping_over_ves: 30,
  bcv_eur_manual_rate: 0,
  online_payments_enabled: false,
  stripe_price_id_mode: "usd" as const,
  // Datos de cobro que se muestran al cliente durante el checkout.
  bank_name: "",
  bank_account_type: "",
  bank_account_number: "",
  bank_account_name: "",
  pago_movil_phone: "",
  zelle_name: "",
  zelle_phone: "",
  binance_email: "",
  binance_pay_id: "",
  order_notes_template: "",
};

export async function getStoreSettings() {
  const backend = getBackend();
  const stored = await backend.getSetting<Record<string, unknown>>("store", {});
  const bcv = await getBcvState();
  const manual = Number(stored.bcv_eur_manual_rate ?? 0);
  return {
    ...STORE_DEFAULTS,
    ...stored,
    bcv_eur_manual_rate: manual,
    bcv_rate: manual > 0 ? manual : bcv.rate,
    bcv_updated_at: manual > 0 ? new Date().toISOString() : bcv.updated_at,
    bcv_source: manual > 0 ? "Tasa manual (ajustes)" : bcv.source,
    bcv_stale: manual > 0 ? false : bcv.stale,
    bcv_last_error: bcv.lastError,
  } as typeof STORE_DEFAULTS & {
    bcv_eur_manual_rate: number;
    bcv_rate: number;
    bcv_updated_at: string | null;
    bcv_source: string;
    bcv_stale: boolean;
    bcv_last_error: string | null;
  };
}

export async function saveStoreSettings(patch: Record<string, unknown>) {
  const backend = getBackend();
  const current = await backend.getSetting<Record<string, unknown>>("store", {});
  await backend.setSetting("store", { ...STORE_DEFAULTS, ...current, ...patch });
}

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
