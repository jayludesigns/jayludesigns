import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { getCatalog, getCatalogFacets, getCategories, getCollections } from "@/lib/data/catalog";
import { ProductCard, toCardProduct } from "@/components/shop/ProductCard";
import { EmptyState } from "@/components/shop/EmptyState";
import { CatalogFilters } from "@/components/shop/CatalogFilters";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const metadata: Metadata = {
  title: "Catálogo",
  description:
    "Todas las franelas, hoodies, polos y uniformes de JayLu: anime, fantasía, videojuegos, streetwear y diseños a medida.",
  alternates: { canonical: "/catalogo" },
};

type Search = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function many(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];
  return value.split(",").filter(Boolean);
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;

  const query = one(params.q).trim();
  const category = one(params.categoria);
  const collection = one(params.coleccion);
  const sizes = many(params.talla);
  const colors = many(params.color);
  const order = one(params.orden);
  const inStockOnly = one(params.stock) === "1";
  const minRaw = Number(one(params.min));
  const maxRaw = Number(one(params.max));

  const [products, facets, categories, collections] = await Promise.all([
    getCatalog({
      search: query || undefined,
      category: category || undefined,
      collection: collection || undefined,
      sizes,
      colors,
      inStockOnly,
      sort: (["destacados", "nuevos", "precio-asc", "precio-desc", "nombre"] as const).find(
        (s) => s === order,
      ),
      minPrice: Number.isFinite(minRaw) && minRaw > 0 ? minRaw : undefined,
      maxPrice: Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : undefined,
    }),
    getCatalogFacets(),
    getCategories(),
    getCollections(),
  ]);

  const activeCollection = collections.find((c) => c.slug === collection) ?? null;
  const activeCategory = categories.find((c) => c.slug === category) ?? null;

  return (
    <section className="relative overflow-hidden bg-ink-950">
      <div className="halftone-light absolute inset-0 opacity-[0.04]" aria-hidden />
      <div className="wrap relative py-8">
        <Breadcrumbs
          invert
          items={[
            { href: "/", label: "Inicio" },
            ...(activeCollection
              ? [{ href: `/colecciones/${activeCollection.slug}`, label: activeCollection.name }]
              : []),
            { href: "/catalogo", label: activeCategory?.name ?? "Catálogo" },
          ]}
        />

        <header className="mt-5 border-b border-ink-800 pb-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl">
            {activeCollection?.name ?? activeCategory?.name ?? "Catálogo"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-300 sm:text-base">
            {activeCollection?.description ??
              activeCategory?.description ??
              "Franelas, hoodies, polos, gorras y accesorios. Filtra por talla, color y precio; todos los precios se muestran en bolívares y euros con la tasa BCV del día."}
          </p>
        </header>

        <div className="mt-6">
          <Suspense fallback={<div className="h-96 animate-pulse bg-ink-900" />}>
            <CatalogFilters
              facets={facets}
              categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
              collections={collections.map((c) => ({ slug: c.slug, name: c.name }))}
              total={products.length}
            >
              {products.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={toCardProduct(product)}
                      priority={index < 4}
                      dark
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  dark
                  icon={SearchX}
                  title="No encontramos nada con eso"
                  description="Prueba quitando algún filtro. Si buscas algo puntual que no está en el catálogo, pídelo a medida y lo hacemos."
                  actions={
                    <>
                      <Link href="/catalogo" className="btn btn-solid">
                        Limpiar filtros
                      </Link>
                      <Link href="/diseno-a-medida" className="btn btn-ghost-light">
                        Pedir diseño a medida
                      </Link>
                    </>
                  }
                />
              )}
            </CatalogFilters>
          </Suspense>
        </div>
      </div>
    </section>
  );
}
