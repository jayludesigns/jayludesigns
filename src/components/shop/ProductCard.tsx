import Link from "next/link";
import { ImageOff } from "lucide-react";
import { PriceDisplay } from "@/components/currency/PriceDisplay";
import { QuickAdd } from "@/components/shop/QuickAdd";
import { Stars } from "@/components/shop/Stars";
import { WishlistHeart } from "@/components/shop/WishlistHeart";
import { cn } from "@/lib/utils";
import type { PricedProduct } from "@/lib/types";

/** Datos mínimos que el botón de añadido rápido necesita del servidor. */
export function toCardProduct(product: PricedProduct) {
  const available =
    product.variants.find((v) => v.is_active && v.stock - v.reserved_stock > 0) ?? null;
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    image: product.images[0]?.url ?? null,
    unitPrice: product.price_ves,
    listPrice: product.list_price_ves,
    variantId: available?.id ?? null,
    variantLabel: available
      ? `${available.size ?? "Única"}${available.color ? ` · ${available.color}` : ""}`
      : "",
    maxQuantity: Math.min(10, available ? available.stock - available.reserved_stock : 0),
    collection: product.collections[0]?.name ?? null,
    categorySlug: product.category?.slug ?? null,
    rating: product.review_avg,
    reviewCount: product.review_count,
  };
}

export type CardProduct = ReturnType<typeof toCardProduct>;

export function ProductCard({
  product,
  className,
  size = "md",
  priority = false,
  showQuickAdd = true,
}: {
  product: CardProduct;
  className?: string;
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  showQuickAdd?: boolean;
}) {
  const hasDiscount = product.listPrice > product.unitPrice;
  const soldOut = product.maxQuantity <= 0;

  return (
    <article
      className={cn(
        "card card-hover group relative flex flex-col overflow-hidden",
        className,
      )}
    >
      <Link
        href={`/producto/${product.slug}`}
        className="relative block overflow-hidden bg-ink-50"
        tabIndex={-1}
        aria-hidden
      >
        {product.image ? (
          // Las demo son SVG con fondo propio: <img> evita el optimizador y
          // mantiene el dibujado nítido a cualquier tamaño.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt=""
            draggable={false}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className={cn(
              "w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]",
              size === "sm" ? "aspect-square" : size === "lg" ? "aspect-4/5" : "aspect-square",
            )}
          />
        ) : (
          <span
            className={cn(
              "grid place-items-center text-ink-300",
              size === "sm" ? "aspect-square" : size === "lg" ? "aspect-4/5" : "aspect-square",
            )}
          >
            <ImageOff className="size-8" />
          </span>
        )}

        {hasDiscount && (
          <span className="absolute top-3 left-3 rounded-full bg-ember-600 px-2.5 py-1 font-mono text-[0.6rem] font-bold tracking-wider text-paper uppercase shadow-ember">
            −{Math.round(((product.listPrice - product.unitPrice) / product.listPrice) * 100)}%
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-x-0 bottom-0 bg-ink/85 py-1.5 text-center font-mono text-[0.6rem] font-bold tracking-[0.16em] text-paper uppercase backdrop-blur-sm">
            Agotado
          </span>
        )}
      </Link>

      <WishlistHeart product={product} />

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.collection && (
          <p className="font-mono text-[0.55rem] tracking-[0.18em] text-ink-400 uppercase">
            {product.collection}
          </p>
        )}
        <h3 className="font-display text-lg leading-tight">
          <Link href={`/producto/${product.slug}`} className="link-underline">
            {product.name}
          </Link>
        </h3>

        {product.rating != null && (
          <div className="flex items-center gap-1.5">
            <Stars rating={product.rating} />
            <span className="font-mono text-[0.58rem] tracking-wide text-ink-400">
              {product.reviewCount} {product.reviewCount === 1 ? "reseña" : "reseñas"}
            </span>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <PriceDisplay
            ves={product.unitPrice}
            size="md"
            className={cn(
              // El precio es el acento más repetido de la tienda: con el
              // burdeos, la vista va directo a la cifra sin tener que leer
              // el nombre. El tachado se apaga para no competir.
              hasDiscount
                ? "[&>span:first-child]:text-ink-400 [&>span:first-child]:line-through"
                : "text-ember-600",
            )}
          />
          {showQuickAdd && !soldOut && (
            <QuickAdd product={product} />
          )}
        </div>
      </div>
    </article>
  );
}
