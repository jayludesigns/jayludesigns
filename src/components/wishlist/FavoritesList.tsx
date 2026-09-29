"use client";

import Link from "next/link";
import { Heart, X } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { EmptyState } from "@/components/shop/EmptyState";
import { useWishlist } from "@/components/wishlist/WishlistContext";

/** Lista de favoritos: lee del contexto (localStorage) y pinta tarjetas. */
export function FavoritesList() {
  const { items, clear, hydrated } = useWishlist();

  // Antes del montaje el contexto parte vacío a propósito (para no romper la
  // hidratación); no pintar el estado vacío real durante ese instante.
  if (!hydrated) {
    return (
      <p className="py-10 text-center font-mono text-sm text-ink-500">
        Cargando tus favoritos…
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="Aún no guardaste nada"
        description="Toca el corazón en cualquier tarjeta del catálogo y aquí se quedará esperándote."
        actions={
          <Link href="/catalogo" className="btn btn-solid btn-lg">
            Ver el catálogo
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="font-mono text-[0.65rem] tracking-[0.18em] text-ink-500 uppercase">
          {items.length} {items.length === 1 ? "modelo guardado" : "modelos guardados"}
        </p>
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1.5 text-xs font-bold text-ink-500 transition-colors hover:text-ember-600"
        >
          <X className="size-3.5" />
          Vaciar
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}