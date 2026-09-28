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
 */
interface WishlistValue {
  items: CardProduct[];
  count: number;
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
  const [items, setItems] = useState<CardProduct[]>(() => readStored());

  // Guarda y sincroniza entre pestañas abiertas.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Almacenamiento lleno o bloqueado: los favoritos seguirán en memoria.
    }
  }, [items]);

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
      value={{ items, count: items.length, has, toggle, remove, clear }}
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