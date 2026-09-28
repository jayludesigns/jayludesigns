"use client";

import { useState } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { cn } from "@/lib/utils";
import type { CardProduct } from "@/components/shop/ProductCard";

/**
 * Sección de productos con pestañas, como la referencia: el tab activo lleva
 * el texto en acento y un subrayado de 2px. "Destacados" es el tab inicial;
 * cada categoría con productos tiene su propia pestaña.
 */
export function FeaturedTabs({
  featured,
  all,
  categories,
}: {
  featured: CardProduct[];
  all: CardProduct[];
  categories: { slug: string; name: string }[];
}) {
  const tabs = [
    { key: "destacados", label: "Destacados" },
    ...categories
      .filter((category) => all.some((product) => product.categorySlug === category.slug))
      .map((category) => ({ key: category.slug, label: category.name })),
  ];
  const [active, setActive] = useState(tabs[0]?.key ?? "destacados");

  const shown = (active === "destacados" ? featured : all.filter((p) => p.categorySlug === active)).slice(
    0,
    8,
  );

  return (
    <div>
      <div className="flex items-end justify-between gap-4 border-b border-ink-200">
        <div className="flex gap-5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              aria-pressed={active === tab.key}
              className={cn(
                "-mb-px shrink-0 border-b-2 pb-3 font-mono text-[0.65rem] font-bold tracking-[0.16em] uppercase transition-colors",
                active === tab.key
                  ? "border-ember-600 text-ember-600"
                  : "border-transparent text-ink-500 hover:text-ink-900",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <a
          href="/catalogo"
          className="hidden pb-3 font-mono text-[0.62rem] font-bold tracking-[0.14em] text-ink-500 uppercase transition-colors hover:text-ember-600 md:block"
        >
          Ver catálogo →
        </a>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {shown.map((product) => (
          <ProductCard key={product.id} product={product} size="lg" />
        ))}
      </div>
    </div>
  );
}