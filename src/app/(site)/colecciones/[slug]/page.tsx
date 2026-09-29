import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getCatalog, getCollectionBySlug } from "@/lib/data/catalog";
import { ProductCard, toCardProduct } from "@/components/shop/ProductCard";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { formatDate } from "@/lib/utils";
import { COLLECTION_THEMES } from "@/lib/types";

type Params = Promise<{ slug: string }>;

// Igual que la ficha de producto: se sirve fresca (las colecciones cambian
// con los productos e imágenes que se editan a diario).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "Colección no encontrada" };
  return {
    title: collection.seo_title ?? collection.name,
    description:
      collection.seo_description ?? collection.tagline ?? collection.description ?? undefined,
    alternates: { canonical: `/colecciones/${collection.slug}` },
    openGraph: {
      title: collection.name,
      description: collection.tagline ?? undefined,
      images: collection.banner_url ? [{ url: collection.banner_url }] : undefined,
    },
  };
}

export default async function CollectionPage({ params }: { params: Params }) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection || collection.status !== "published") notFound();

  const products = await getCatalog({ collection: slug });
  const theme = COLLECTION_THEMES.find((t) => t.value === collection.theme);
  const now = new Date();
  const live =
    (!collection.starts_at || new Date(collection.starts_at) <= now) &&
    (!collection.ends_at || new Date(collection.ends_at) >= now);

  return (
    <div>
      {/* Portada de la colección: el banner ya trae su propio fondo oscuro. */}
      <section className="relative overflow-hidden border-b border-ink-800">
        {collection.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={collection.banner_url}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        )}
        <span
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30"
          aria-hidden
        />
        <div className="wrap relative py-14 sm:py-20">
          <Breadcrumbs
            invert
            items={[
              { href: "/", label: "Inicio" },
              { href: "/colecciones", label: "Colecciones" },
              { href: `/colecciones/${collection.slug}`, label: collection.name },
            ]}
          />
          <div className="mt-6 flex flex-wrap gap-2">
            {theme && <span className="tag border-white/70 text-white">{theme.label}</span>}
            {collection.active_promotion && live && (
              <span className="tag border-white bg-white text-black">
                Promo {collection.active_promotion.name}: −
                {collection.active_promotion.kind === "percent"
                  ? `${collection.active_promotion.value}%`
                  : `${collection.active_promotion.value} Bs`}
              </span>
            )}
            {collection.ends_at && (
              <span className="tag border-white/70 text-white/80">
                Hasta el {formatDate(collection.ends_at)}
              </span>
            )}
          </div>
          <h1 className="mt-4 max-w-4xl text-5xl text-white sm:text-6xl lg:text-7xl">
            {collection.name}
          </h1>
          {collection.tagline && (
            <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
              {collection.tagline}
            </p>
          )}
          {collection.description && (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed whitespace-pre-line text-white/70">
              {collection.description}
            </p>
          )}
          <p className="mt-6 font-mono text-[0.62rem] tracking-[0.2em] text-white/60 uppercase">
            {products.length} {products.length === 1 ? "modelo" : "modelos"} en esta colección
          </p>
        </div>
      </section>

      <div className="divider-glow" aria-hidden />

      {/* Prendas de la colección */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="halftone-light absolute inset-0 opacity-[0.04]" aria-hidden />
        <div className="wrap relative py-12">
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
            <div className="card-dark p-10 text-center">
              <p className="font-display text-3xl">Todavía no hay prendas aquí</p>
              <p className="mt-3 text-sm text-ink-400">
                Estamos terminando los diseños de esta colección.
              </p>
            </div>
          )}

          <div className="card-dark mt-14 p-8 sm:p-10">
            <h2 className="text-3xl sm:text-4xl">
              ¿Quieres esta colección
              <br />
              para tu grupo o colegio?
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-300">
              Hacemos versiones personalizadas con tu logo, tu nombre o el de tu
              curso, con precios por volumen y entrega por lotes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/diseno-a-medida" className="btn btn-solid">
                Pedir cotización
                <ArrowRight className="size-3.5" />
              </Link>
              <Link href="/colecciones" className="btn btn-ghost-light">
                Ver otras colecciones
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}