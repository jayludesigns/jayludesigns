import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MessageCircle, Truck } from "lucide-react";
import {
  getProductBySlug,
  getProductReviews,
  getRelatedProducts,
} from "@/lib/data/catalog";
import { ProductDetailClient } from "@/components/shop/ProductDetailClient";
import { ProductCard, toCardProduct } from "@/components/shop/ProductCard";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { SectionHeading } from "@/components/site/SectionHeading";
import { getStoreSettings } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { whatsappUrl } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

// La tienda se edita a diario desde el panel (imágenes subidas, portadas,
// precios): la ficha se sirve siempre fresca, nunca el HTML estático.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const [product, siteUrl] = await Promise.all([getProductBySlug(slug), getSiteUrl()]);
  if (!product) return { title: "Producto no encontrado" };

  const title = product.seo_title ?? product.name;
  const description =
    product.seo_description ??
    product.subtitle ??
    `${product.name} · ${product.garment_type} de ${product.material ?? "algodón"}. Precio en bolívares y euros.`;
  const image = product.images[0]?.url;

  return {
    title,
    description,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${siteUrl}/producto/${product.slug}`,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || (!product.is_active && !product.is_custom_only)) notFound();

  const [related, reviews, settings, siteUrl] = await Promise.all([
    getRelatedProducts(product, 4),
    getProductReviews(product.id),
    getStoreSettings(),
    getSiteUrl(),
  ]);

  // Datos estructurados para que Google entienda precio y disponibilidad.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? product.subtitle ?? undefined,
    image: product.images.map((i) => `${siteUrl}${i.url}`),
    brand: { "@type": "Brand", name: settings.store_name },
    sku: product.sku ?? undefined,
    offers: {
      "@type": "Offer",
      price: product.price_ves,
      priceCurrency: "VES",
      availability:
        product.in_stock === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      url: `${siteUrl}/producto/${product.slug}`,
    },
    ...(reviews.length
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue:
              Math.round(
                (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) * 10,
              ) / 10,
            reviewCount: reviews.length,
          },
        }
      : {}),
  };

  return (
    <div className="relative overflow-hidden bg-ink-950">
      <div className="halftone-light absolute inset-0 opacity-[0.04]" aria-hidden />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="wrap relative py-8">
        <Breadcrumbs
          invert
          items={[
            { href: "/", label: "Inicio" },
            { href: "/catalogo", label: "Catálogo" },
            ...(product.category
              ? [
                  {
                    href: `/catalogo?categoria=${product.category.slug}`,
                    label: product.category.name,
                  },
                ]
              : []),
            { href: `/producto/${product.slug}`, label: product.name },
          ]}
        />

        <div className="mt-6">
          <ProductDetailClient product={product} />
        </div>

        {/* Garantías */}
        <ul className="mt-12 grid gap-3 border-y border-ink-800 py-6 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Envío a toda Venezuela", body: "Recogida en Caracas o envío por encomienda." },
            { icon: Check, title: "Revisa antes de imprimir", body: "Te mandamos la muestra digital y apruebas." },
            { icon: MessageCircle, title: "Hablas con quien imprime", body: "Sin bots: escribes por WhatsApp y te responde una persona." },
          ].map((item) => (
            <li key={item.title} className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-ink-800 text-ink-300">
                <item.icon className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-bold text-paper">{item.title}</span>
                <span className="mt-0.5 block text-sm text-ink-300">{item.body}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* Reseñas */}
        {reviews.length > 0 && (
          <section className="mt-12">
            <SectionHeading
              invert
              eyebrow="Reseñas"
              title={`Lo que dicen de ${product.name}`}
              description={`${reviews.length} ${reviews.length === 1 ? "reseña" : "reseñas"} verificadas de compradores.`}
            />
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review) => (
                <figure key={review.id} className="card-dark flex flex-col gap-2.5 p-5">
                  <div
                    className="flex gap-1"
                    aria-label={`${review.rating} de 5 estrellas`}
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`size-3 border ${i < review.rating ? "border-ember-600 bg-ember-600" : "border-ink-700"}`}
                        aria-hidden
                      />
                    ))}
                  </div>
                  {review.title && (
                    <figcaption className="font-display text-xl">{review.title}</figcaption>
                  )}
                  <blockquote className="text-sm leading-relaxed text-ink-300">
                    {review.body}
                  </blockquote>
                  <p className="mt-auto font-mono text-[0.62rem] tracking-wider text-ink-400 uppercase">
                    {review.author_name}
                  </p>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* CTA a medida */}
        <section className="card-dark mt-12 p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl">
                ¿Lo quieres con tu propio diseño?
              </h2>
              <p className="mt-2 max-w-xl text-sm text-ink-300">
                Mismo modelo de prenda, con tu imagen, tu logo o el nombre de tu
                grupo. Desde una unidad.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/diseno-a-medida?modelo=${product.slug}`} className="btn btn-solid">
                Usar como base
              </Link>
              {settings.whatsapp && (
                <a
                  href={whatsappUrl(
                    settings.whatsapp,
                    `Hola JayLu, quiero este modelo (${product.name}) con diseño propio`,
                  )}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn btn-ghost-light"
                >
                  <MessageCircle className="size-4" />
                  Consultar
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Relacionados */}
        {related.length > 0 && (
          <section className="mt-14">
            <SectionHeading
              invert
              eyebrow="También te puede gustar"
              title="Del mismo universo"
              action={{ href: "/catalogo", label: "Ver todo" }}
            />
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={toCardProduct(item)} size="sm" dark />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
