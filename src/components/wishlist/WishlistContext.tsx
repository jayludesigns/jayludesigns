"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { CardProduct } from "@/components/shop/ProductCard";

/**
 * Favoritos en localStorage, con la misma filosofía que el carrito: se guarda
 * una instantánea del producto (precio incluido) para que la lista funcione
 * sin servidor y sobreviva a cambios de catálogo.
 *
 * El almacenamiento se lee recién tras el montaje (nunca en el render inicial):
 * así el HTML del servidor y la hidratación coinciden y no hay aviso de
 * "hydration mismatch" por leer localStorage en el primer render.
 */
interface WishlistValue {
  items: CardProduct[];
  count: number;
  /** true a partir del primer render en el navegador (datos ya cargados). */
  hydrated: boolean;
  has(id: string): boolean;
  toggle(product: CardProduct): void;
  remove(id: string): void;
  clear(): void;
}

const STORAGE_KEY = "jaylu.favoritos.v1";
const WishlistContext = createContext<WishlistValue | null>(null);

function readStored(): CardProduct[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CardProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // El primer render (servidor e hidratación) usa la lista vacía; los
  // favoritos reales se leen aquí, una sola vez, en el navegador. Leer
  // localStorage en un efecto tras montar evita el "hydration mismatch"
  // (la alternativa useSyncExternalStore exige un snapshot estable con cache
  // global para arrays, sin ganancia real aquí).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación diferida deliberada
    setItems(readStored());
    setHydrated(true);
  }, []);

  // Guarda y sincroniza entre pestañas abiertas. No escribe hasta haber
  // leído lo almacenado, para no pisar los datos con la lista vacía inicial.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Almacenamiento lleno o bloqueado: los favoritos seguirán en memoria.
    }
  }, [items, hydrated]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setItems(readStored());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const has = useCallback((id: string) => items.some((item) => item.id === id), [items]);

  const toggle = useCallback((product: CardProduct) => {
    setItems((current) =>
      current.some((item) => item.id === product.id)
        ? current.filter((item) => item.id !== product.id)
        : [...current, product],
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  return (
    <WishlistContext.Provider
      value={{ items, count: items.length, hydrated, has, toggle, remove, clear }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist debe usarse dentro de <WishlistProvider>");
  return ctx;
}