"use client";

import Link from "next/link";
import { Heart, X } from "lucide-react";
import { ProductCard } from "@/components/shop/ProductCard";
import { useWishlist } from "@/components/wishlist/WishlistContext";

/** Lista de favoritos: lee del contexto (localStorage) y pinta tarjetas. */
export function FavoritesList() {
  const { items, clear } = useWishlist();

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-ember-50 text-ember-600">
          <Heart className="size-6" />
        </span>
        <h2 className="font-display text-2xl">Aún no guardaste nada</h2>
        <p className="max-w-sm text-sm leading-relaxed text-ink-600">
          Toca el corazón en cualquier tarjeta del catálogo y aquí se quedará
          esperándote.
        </p>
        <Link href="/catalogo" className="btn btn-solid mt-2">
          Ver el catálogo
        </Link>
      </div>
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