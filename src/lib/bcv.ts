/**
 * Tasa EUR/VES publicada por el Banco Central de Venezuela.
 *
 * Estrategia:
 *  1. Si el administrador fijó una tasa manual (`BCV_EUR_MANUAL_RATE`), manda esa.
 *  2. Si la tasa guardada tiene menos de N horas, se usa la cache.
 *  3. Si está vencida, se intenta refrescar consultando la cotización EUR oficial.
 *  4. Si ninguna responde, se conserva la última tasa conocida y se marca como
 *     desactualizada: la tienda nunca se queda sin precios en euros.
 */

import { getBackend } from "./db";
import { round2 } from "./utils";

export interface BcvState {
  rate: number;
  source: string;
  updated_at: string | null;
  stale: boolean;
  /** true si el último intento de refresco falló. */
  lastError: string | null;
}

/**
 * Clave en la tabla `settings`. Es la misma que consultan `finance.ts` y el
 * seed, así que no se debe cambiar sin actualizarlos.
 */
const CACHE_KEY = "bcv";
const REFRESH_WINDOW_MS = 6 * 60 * 60 * 1000;

const FETCHERS = [
  {
    name: "BCV oficial (EUR)",
    run: async () => {
      const response = await fetch("https://www.bcv.org.ve/", {
        headers: { "user-agent": "Mozilla/5.0 JayLu", accept: "text/html" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      const section = html.match(/id=["']euro["'][\s\S]{0,1200}/i)?.[0];
      const match = section?.match(/\b[\d]{1,3}(?:\.[\d]{3})*,[\d]{2,10}\b/);
      if (!match) throw new Error("no se encontró la tasa EUR en el HTML");
      const rate = Number(match[0].replace(/\./g, "").replace(",", "."));
      if (!Number.isFinite(rate) || rate <= 0) throw new Error("tasa EUR ilegible");
      return { rate };
    },
  },
];

/** Intenta refrescar la tasa desde las fuentes públicas. */
export async function refreshBcvRate(): Promise<BcvState> {
  const backend = getBackend();
  const current = await backend.getSetting<BcvState>(CACHE_KEY, {
    rate: 0,
    source: "sin tasa EUR disponible",
    updated_at: null,
    stale: true,
    lastError: null,
  });

  const errors: string[] = [];
  for (const fetcher of FETCHERS) {
    try {
      const { rate } = await fetcher.run();
      const state: BcvState = {
        rate: round2(rate),
        source: fetcher.name,
        updated_at: new Date().toISOString(),
        stale: false,
        lastError: null,
      };
      await backend.setSetting(CACHE_KEY, state);
      return state;
    } catch (error) {
      errors.push(`${fetcher.name}: ${(error as Error).message}`);
    }
  }

  const fallback: BcvState = {
    ...current,
    stale: true,
    lastError: errors.join(" · ") || "sin fuentes disponibles",
  };
  // No se persiste el fallo: escribir aquí reescribe todo `db.json` desde la
  // memoria (el backend local guarda el archivo completo en cada mutación) en
  // una petición de solo lectura y si la memoria está desactualizada puede
  // pisar datos recientes. Sin red, se devuelve la última tasa conocida.
  return fallback;
}

/** Devuelve la tasa vigente, refrescando la cache cuando corresponde. */
export async function getBcvState(options: { force?: boolean } = {}): Promise<BcvState> {
  const backend = getBackend();
  const manual = Number(process.env.BCV_EUR_MANUAL_RATE ?? 0);
  const stored = await backend.getSetting<BcvState>(CACHE_KEY, {
    rate: 0,
    source: "sin tasa EUR disponible",
    updated_at: null,
    stale: true,
    lastError: null,
  });

  if (manual > 0) {
    return { rate: manual, source: "Tasa manual (env)", updated_at: new Date().toISOString(), stale: false, lastError: null };
  }

  const age = stored.updated_at ? Date.now() - new Date(stored.updated_at).getTime() : Infinity;
  if (options.force || age > REFRESH_WINDOW_MS) {
    return refreshBcvRate();
  }
  return stored;
}

export function vesToEur(ves: number, rate: number): number {
  if (!rate || rate <= 0) return 0;
  return round2(ves / rate);
}

