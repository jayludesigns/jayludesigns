import Link from "next/link";
import {
  ArrowRight,
  Brush,
  MessageCircle,
  Palette,
  Sparkles,
  Truck,
} from "lucide-react";
import { getCatalog, getCategories, getCollections } from "@/lib/data/catalog";
import { getProductReviews } from "@/lib/data/catalog";
import { getStoreSettings } from "@/lib/db";
import { ProductCard, toCardProduct } from "@/components/shop/ProductCard";
import { FeaturedTabs } from "@/components/shop/FeaturedTabs";
import { SectionHeading } from "@/components/site/SectionHeading";
import { TechniquesSection } from "@/components/home/TechniquesSection";
import { CotizadorExpress } from "@/components/home/CotizadorExpress";
import { whatsappUrl } from "@/lib/utils";

export default async function HomePage() {
  const [catalog, collections, categories, settings] = await Promise.all([
    getCatalog({ excludeCustomOnly: true }),
    getCollections(),
    getCategories(),
    getStoreSettings(),
  ]);

  const featured = catalog.filter((p) => p.is_featured).slice(0, 4);
  const spotlight = catalog.slice(0, 4);
  const fresh = [...catalog].slice(0, 8);
  const spinProduct = catalog.find((p) => (p.spin?.frames?.length ?? 0) >= 2) ?? catalog[0];
  const reviews = spinProduct
    ? await getProductReviews(spinProduct.id)
    : [];

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden border-b border-white/10 bg-ink-950">
        <div className="gradient-wine absolute inset-0" aria-hidden />
        <div className="halftone-light absolute inset-0 opacity-[0.08]" aria-hidden />
        <div className="glow-ember absolute inset-0 opacity-50" aria-hidden />
        <div
          className="rays-light absolute -top-40 -right-32 size-[36rem] rounded-full opacity-[0.04]"
          aria-hidden
        />

        <div className="wrap relative grid items-center gap-12 py-16 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-7">
            <p className="rise mb-5 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-ember-300 opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-ember-300" />
              </span>
              <span className="text-[0.62rem] font-bold tracking-[0.22em] text-white/70 uppercase">
                Calidad premium en estampados · Caracas
              </span>
            </p>

            <h1 className="rise rise-d1 text-[clamp(2.75rem,9vw,6.5rem)] leading-[0.84] text-paper">
              Tu idea,
              <br />
              <span className="bg-gradient-to-r from-ember-300 via-ember-400 to-paper bg-clip-text text-transparent">
                estampada
              </span>
              <br />
              en una franela
            </h1>

            <p className="rise rise-d2 mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              Catálogo de anime, fantasía, videojuegos y streetwear. Uniformes para
              colegios, empresas y grupos. Y si no existe, lo hacemos a medida: sube
              tu foto o cuéntanos la idea y cotizamos sin compromiso.
            </p>

            <div className="rise rise-d3 mt-8 flex flex-wrap gap-3">
              <Link href="/catalogo" className="btn btn-solid btn-lg">
                Ver catálogo
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/diseno-a-medida" className="btn btn-ghost-light btn-lg">
                <Brush className="size-4" />
                Diseñar la mía
              </Link>
            </div>

            <dl className="rise rise-d4 mt-10 grid max-w-lg grid-cols-3 divide-x divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
              {[
                ["1 ud.", "Pedido mínimo"],
                ["48 h", "Muestra digital"],
                ["Bs + €", "Precio con tasa BCV"],
              ].map(([value, label]) => (
                <div key={label} className="px-4 py-5">
                  <dt className="font-display text-2xl leading-none text-ember-300">{value}</dt>
                  <dd className="mt-1 font-mono text-[0.55rem] tracking-[0.14em] text-white/50 uppercase">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Collage de producto */}
          <div className="lg:col-span-5">
            <div className="relative">
              <span className="absolute -top-3 right-3 z-10 rounded-full bg-ember-600 px-3 py-1 font-mono text-[0.55rem] font-bold tracking-[0.18em] text-paper uppercase shadow-ember">
                Destacado DTF
              </span>
              <div className="grid grid-cols-2 gap-4">
                {spotlight.slice(0, 4).map((product, index) => (
                  <Link
                    key={product.id}
                    href={`/producto/${product.slug}`}
                    className={`group relative block overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-ember-400/60 hover:shadow-ember ${
                      index % 3 === 0 ? "mt-6" : ""
                    }`}
                  >
                    {product.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        loading={index < 2 ? "eager" : "lazy"}
                        className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    {product.discount_percent > 0 && (
                      <span className="absolute top-3 left-3 rounded-full bg-ember-600 px-2.5 py-1 font-mono text-[0.55rem] font-bold text-paper shadow-ember">
                        −{product.discount_percent}%
                      </span>
                    )}
                  </Link>
                ))}
              </div>
              <p className="mt-4 flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.16em] text-white/50 uppercase">
                <Sparkles className="size-3.5" />
                Se estampa al pedido · DTF y sublimación
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CATEGORÍAS ================= */}
      <section className="wrap py-14 sm:py-18">
        <SectionHeading
          eyebrow="Explora"
          title="Por dónde empezar"
          action={{ href: "/catalogo", label: "Ver todo" }}
        />
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category, index) => {
            const count = catalog.filter((p) => p.category?.slug === category.slug).length;
            return (
              <Link
                key={category.id}
                href={`/catalogo?categoria=${category.slug}`}
                className="card card-hover group relative flex min-h-40 flex-col justify-end overflow-hidden p-4"
              >
                {category.hero_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.hero_url}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <span
                  className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
                  aria-hidden
                />
                <span className="absolute top-3 right-3 font-mono text-[0.6rem] text-white/70">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="relative">
                  <span className="block font-display text-2xl text-white">{category.name}</span>
                  <span className="mt-0.5 block font-mono text-[0.58rem] tracking-[0.14em] text-white/70 uppercase">
                    {count} {count === 1 ? "modelo" : "modelos"}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ================= TÉCNICAS ================= */}
      <TechniquesSection />

      {/* ================= DESTACADOS ================= */}
      {featured.length > 0 && (
        <section className="wrap py-14 sm:py-18">
          <SectionHeading
            eyebrow="Selección JayLu"
            title="Los que más se van"
            description="Los modelos con más movimiento esta semana, con la promoción que esté activa."
          />
          <div className="mt-8">
            <FeaturedTabs
              featured={featured.map(toCardProduct)}
              all={catalog.map(toCardProduct)}
              categories={categories.map((category) => ({ slug: category.slug, name: category.name }))}
            />
          </div>
        </section>
      )}

      {/* ================= COLECCIONES ================= */}
      {collections.length > 0 && (
        <section className="wrap py-14 sm:py-18">
          <SectionHeading
            eyebrow="Colecciones"
            title="Historias completas, no prendas sueltas"
            description="Cada colección reúne diseños de un mismo universo, con promotions que se activan por fecha."
            action={{ href: "/colecciones", label: "Ver colecciones" }}
          />
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {collections.slice(0, 6).map((collection) => (
              <Link
                key={collection.id}
                href={`/colecciones/${collection.slug}`}
                className="card card-hover group relative flex min-h-64 flex-col justify-end overflow-hidden"
              >
                {collection.banner_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={collection.banner_url}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <span
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
                  aria-hidden
                />
                <span className="absolute top-3 left-3 flex gap-1.5">
                  <span className="tag border-white/60 text-white">{collection.theme}</span>
                  {collection.active_promotion && (
                    <span className="tag border-ember-600 bg-ember-600 text-white">
                      −
                      {collection.active_promotion.kind === "percent"
                        ? `${collection.active_promotion.value}%`
                        : "Oferta"}
                    </span>
                  )}
                </span>
                <span className="relative p-4">
                  <span className="block font-display text-3xl text-white">
                    {collection.name}
                  </span>
                  {collection.tagline && (
                    <span className="mt-1 block text-sm text-white/70">
                      {collection.tagline}
                    </span>
                  )}
                  <span className="mt-2 block font-mono text-[0.58rem] tracking-[0.14em] text-white/60 uppercase">
                    {collection.product_count} modelos
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ================= COTIZADOR EXPRESS ================= */}
      <CotizadorExpress whatsapp={settings.whatsapp || "04141234567"} />

      {/* ================= DISEÑO A MEDIDA ================= */}
      <section className="relative overflow-hidden border-y border-ink-200">
        <div className="grid-paper absolute inset-0" aria-hidden />
        <div className="wrap relative grid gap-10 py-14 sm:py-18 lg:grid-cols-2">
          <div>
            <p className="mb-3 font-mono text-[0.6rem] tracking-[0.28em] text-ember-600 uppercase">
              Diseño a medida
            </p>
            <h2 className="text-4xl sm:text-5xl">
              ¿No lo tienes
              <br />
              en el catálogo?
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-700 sm:text-base">
              Sube una foto de referencia y cuéntanos la idea. Los dos campos son
              opcionales: con uno basta para empezar. Te devolvemos una muestra
              digital en 48 horas y solo entonces se paga.
            </p>

            <ul className="mt-7 space-y-4">
              {[
                {
                  icon: Palette,
                  title: "Foto o texto, como prefieras",
                  body: "Con una imagen nos basta para arrancar. Si solo tienes una idea en palabras, también.",
                },
                {
                  icon: Sparkles,
                  title: "Muestra digital antes de imprimir",
                  body: "Apruebas el diseño en pantalla. Si no te gusta, ajustamos sin costo.",
                },
                {
                  icon: Truck,
                  title: "Desde una unidad",
                  body: "Pedidos personales o lotes para eventos, colegios y empresas.",
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ember-50 text-ember-600 ring-1 ring-ember-100">
                    <item.icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{item.title}</span>
                    <span className="mt-0.5 block text-sm text-ink-600">{item.body}</span>
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/diseno-a-medida" className="btn btn-solid btn-lg">
                Empezar mi diseño
                <ArrowRight className="size-4" />
              </Link>
              <a
                href={whatsappUrl(
                  settings.whatsapp || "04141234567",
                  "Hola JayLu, quiero cotizar un diseño a medida",
                )}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-lg"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Miniaturas de referencias */}
          <div className="grid grid-cols-2 gap-3 self-center">
            {["mage-1", "custom-1", "uniforme-escudo", "grupo-1"].map((name, index) => (
              <div
                key={name}
                className={`card overflow-hidden ${index % 2 === 1 ? "mt-6" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/demo/references/${name}.svg`}
                  alt={`Ejemplo de referencia que nos envían los clientes`}
                  loading="lazy"
                  className="aspect-square w-full bg-ink-50 object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FRESCOS ================= */}
      <section className="wrap py-14 sm:py-18">
        <SectionHeading
          eyebrow="Recién llegados"
          title="Lo último del taller"
          action={{ href: "/catalogo?orden=nuevos", label: "Ver novedades" }}
        />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {fresh.map((product) => (
            <ProductCard key={product.id} product={toCardProduct(product)} size="sm" />
          ))}
        </div>
      </section>

      {/* ================= RESEÑAS ================= */}
      {reviews.length > 0 && (
        <section className="wrap pb-16">
          <SectionHeading eyebrow="Lo que dicen" title={`Reseñas de ${spinProduct!.name}`} />
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {reviews.slice(0, 3).map((review) => (
              <figure key={review.id} className="card flex flex-col gap-3 p-5">
                <div className="flex gap-0.5" aria-label={`${review.rating} de 5 estrellas`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={`size-2.5 border ${i < review.rating ? "border-ember-600 bg-ember-600" : "border-ink-300"}`}
                      aria-hidden
                    />
                  ))}
                </div>
                {review.title && (
                  <figcaption className="font-display text-xl">{review.title}</figcaption>
                )}
                <blockquote className="text-sm leading-relaxed text-ink-700">
                  {review.body}
                </blockquote>
                <p className="mt-auto font-mono text-[0.6rem] tracking-wider text-ink-500 uppercase">
                  {review.author_name}
                </p>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ================= CIERRE ================= */}
      <section className="wrap pb-4">
        <div className="relative overflow-hidden border border-ink bg-paper p-8 sm:p-12">
          <div className="halftone absolute inset-0 opacity-[0.06]" aria-hidden />
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h2 className="max-w-2xl text-4xl sm:text-5xl">
                Uniformes para tu colegio, empresa o grupo
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-600">
                Estampamos tu logo con sublimación o DTF textil, el nombre de
                cada persona y el escudo de tu institución. Entregamos por lotes
                con tallas ya medidas. Cotización cerrada en 24 horas.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalogo?categoria=uniformes" className="btn btn-solid btn-lg">
                Ver uniformes
              </Link>
              <Link href="/contacto" className="btn btn-lg">
                Cotizar lote
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
