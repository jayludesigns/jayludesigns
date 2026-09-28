"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/components/cart/CartContext";
import { CurrencyProvider } from "@/components/currency/CurrencyContext";
import { WishlistProvider } from "@/components/wishlist/WishlistContext";
import { ToastProvider } from "@/components/ui/Toast";
import { OfflineBanner, PwaManager } from "@/components/pwa/PwaManager";

/**
 * Encapsula todo el estado que vive en el navegador. Los datos de la tasa BCV
 * llegan ya resueltos desde el layout de servidor para que el primer render
 * del HTML ya muestre los precios en euros sin parpadeo.
 */
export function Providers({
  children,
  rate,
  source,
  updatedAt,
  stale,
}: {
  children: ReactNode;
  rate: number;
  source: string;
  updatedAt: string | null;
  stale: boolean;
}) {
  return (
    <ToastProvider>
      <CartProvider>
        <CurrencyProvider rate={rate} source={source} updatedAt={updatedAt} stale={stale}>
          <WishlistProvider>
            <OfflineBanner />
            {children}
            <PwaManager />
          </WishlistProvider>
        </CurrencyProvider>
      </CartProvider>
    </ToastProvider>
  );
}
