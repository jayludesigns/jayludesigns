"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import { cn } from "@/lib/utils";
import type { CardProduct } from "@/components/shop/ProductCard";

/**
 * Corazón de favoritos que vive sobre la imagen de la tarjeta, como en la
 * referencia: círculo blanco con sombra suave que se pinta de acento al
 * guardar.
 */
export function WishlistHeart({ product, className }: { product: CardProduct; className?: string }) {
  const { has, toggle } = useWishlist();
  const saved = has(product.id);

  return (
    <button
      type="button"
      onClick={() => toggle(product)}
      aria-label={saved ? `Quitar ${product.name} de favoritos` : `Guardar ${product.name} en favoritos`}
      aria-pressed={saved}
      className={cn(
        "absolute top-3 right-3 z-10 grid size-9 place-items-center rounded-full bg-paper/95 shadow-soft backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-95",
        saved ? "text-ember-600" : "text-ink-400 hover:text-ember-600",
        className,
      )}
    >
      <Heart className={cn("size-4", saved && "fill-current")} />
    </button>
  );
}