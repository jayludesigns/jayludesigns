"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  /** Clave estable: producto + variante. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  variantId: string | null;
  variantLabel: string;
  image: string | null;
  /** Precio unitario guardado al agregar (los cambios de precio no alteran el carrito). */
  unitPrice: number;
  listPrice: number;
  quantity: number;
  /** Cantidad máxima disponible conocida en el momento de agregar. */
  maxQuantity: number;
  collection: string | null;
}

interface CartValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  savings: number;
  add(item: Omit<CartItem, "key" | "quantity">, quantity?: number): void;
  setQuantity(key: string, quantity: number): void;
  remove(key: string): void;
  clear(): void;
}

const STORAGE_KEY = "jaylu.carrito.v1";
const CartContext = createContext<CartValue | null>(null);

function readStored(): CartItem[] {
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

export function CartProvider({ children }: { children: ReactNode }) {
  // Igual que favoritos: se parte del carrito vacío para que el HTML del
  // servidor y la hidratación coincidan; lo guardado se lee tras el montaje.
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación diferida deliberada
    setItems(readStored());
    setHydrated(true);
  }, []);

  // Guarda y sincroniza entre pestañas abiertas. No escribe hasta haber
  // leído lo almacenado, para no pisar los datos con el carrito vacío inicial.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setItems(readStored());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((item: Omit<CartItem, "key" | "quantity">, quantity = 1) => {
    const key = `${item.productId}:${item.variantId ?? "unica"}`;
    setItems((current) => {
      const existing = current.find((i) => i.key === key);
      if (existing) {
        return current.map((i) =>
          i.key === key
            ? { ...i, quantity: Math.min(i.maxQuantity, i.quantity + quantity) }
            : i,
        );
      }
      return [...current, { ...item, key, quantity: Math.min(item.maxQuantity || 99, quantity) }];
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((i) => i.key !== key)
        : current.map((i) =>
            i.key === key ? { ...i, quantity: Math.min(i.maxQuantity || 99, quantity) } : i,
          ),
    );
  }, []);

  const remove = useCallback((key: string) => {
    setItems((current) => current.filter((i) => i.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartValue>(() => {
    const count = items.reduce((acc, i) => acc + i.quantity, 0);
    const subtotal = items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const listTotal = items.reduce((acc, i) => acc + i.listPrice * i.quantity, 0);
    return { items, count, subtotal, savings: Math.max(0, listTotal - subtotal), add, setQuantity, remove, clear };
  }, [items, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return context;
}