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
  dark = false,
}: {
  featured: CardProduct[];
  all: CardProduct[];
  categories: { slug: string; name: string }[];
  /** Variante sobre fondo oscuro: borde y pestañas en gris cálido. */
  dark?: boolean;
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
      <div
        className={cn(
          "flex items-end justify-between gap-4 border-b",
          dark ? "border-ink-800" : "border-ink-200",
        )}
      >
        <div className="flex gap-5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              aria-pressed={active === tab.key}
              className={cn(
                "-mb-px shrink-0 border-b-2 pb-3 font-mono text-[0.67rem] font-bold tracking-[0.16em] uppercase transition-colors",
                active === tab.key
                  ? dark
                    ? "border-ember-400 text-ember-400"
                    : "border-ember-600 text-ember-600"
                  : dark
                    ? "border-transparent text-ink-400 hover:text-paper"
                    : "border-transparent text-ink-500 hover:text-ink-900",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <a
          href="/catalogo"
          className={cn(
            "hidden pb-3 font-mono text-[0.64rem] font-bold tracking-[0.14em] uppercase transition-colors md:block",
            dark
              ? "text-ink-400 hover:text-ember-400"
              : "text-ink-500 hover:text-ember-600",
          )}
        >
          Ver catálogo →
        </a>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {shown.map((product) => (
          <ProductCard key={product.id} product={product} size="lg" dark={dark} />
        ))}
      </div>
    </div>
  );
}