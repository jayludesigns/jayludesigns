"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import { useToast } from "@/components/ui/Toast";
import type { CardProduct } from "@/components/shop/ProductCard";

/** Añade al carrito la primera variante disponible, sin abrir la ficha. */
export function QuickAdd({ product }: { product: CardProduct }) {
  const { add } = useCart();
  const { toast } = useToast();
  const [added, setAdded] = useState(false);

  const onClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!product.variantId) return;
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantId: product.variantId,
        variantLabel: product.variantLabel,
        image: product.image,
        unitPrice: product.unitPrice,
        listPrice: product.listPrice,
        maxQuantity: product.maxQuantity,
        collection: product.collection,
      },
      1,
    );
    toast("Añadido al carrito", { detail: product.name });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Añadir ${product.name} al carrito`}
      className="grid size-9 shrink-0 place-items-center rounded-full border border-ink-200 text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-ember-600 hover:bg-ember-600 hover:text-paper hover:shadow-ember"
    >
      <Plus
        className={`size-4 transition-transform duration-300 ${added ? "rotate-45" : ""}`}
        strokeWidth={2.5}
      />
    </button>
  );
}
