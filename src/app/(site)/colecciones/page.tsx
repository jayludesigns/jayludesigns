import type { Metadata } from "next";
import { getCollections } from "@/lib/data/catalog";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { SectionHeading } from "@/components/site/SectionHeading";
import { formatDate } from "@/lib/utils";
import { COLLECTION_THEMES } from "@/lib/types";

export const metadata: Metadata = {
  title: "Colecciones",
  description:
    "Cada colección de JayLu agrupa los diseños de un mismo universo, con promociones que se activan por fecha.",
  alternates: { canonical: "/colecciones" },
};

const THEME_LABEL = new Map(COLLECTION_THEMES.map((t) => [t.value, t.label]));

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div>
      {/* Portada */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="halftone-light absolute inset-0 opacity-[0.05]" aria-hidden />
        {/* Arriba `pt-8`, el mismo aire que dejan la barra de navegación y las
            migas en catálogo y contacto; antes esta portada se abría con 48px
            y esas con 32px. El aire de abajo sí se deja generoso, que separa
            el título del bloque. */}
        <div className="wrap relative pt-8 pb-12">
          <Breadcrumbs
            invert
            items={[{ href: "/", label: "Inicio" }, { href: "/colecciones", label: "Colecciones" }]}
          />
          <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl">Colecciones</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-300 sm:text-base">
            No publicamos prendas sueltas: publicamos Universos. Cada colección
            tiene su propia promoción, se puede programar por fecha y puede
            descontar todo lo que contiene con un solo clic desde el panel.
          </p>
        </div>
      </section>

      <div className="divider-glow" aria-hidden />

      {/* Universos */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="halftone-light absolute inset-0 opacity-[0.04]" aria-hidden />
        <div className="wrap relative py-12">
          {collections.length === 0 ? (
            <p className="text-ink-400">Todavía no hay colecciones publicadas.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection, index) => {
                const live =
                  collection.status === "published" &&
                  (!collection.starts_at || new Date(collection.starts_at) <= new Date()) &&
                  (!collection.ends_at || new Date(collection.ends_at) >= new Date());

                return (
                  <article
                    key={collection.id}
                    className="card-dark card-hover group relative flex min-h-80 flex-col justify-end overflow-hidden"
                  >
                    {collection.banner_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={collection.banner_url}
                        alt=""
                        loading={index < 3 ? "eager" : "lazy"}
                        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                    <span
                      className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
                      aria-hidden
                    />

                    <span className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="tag border-white/60 text-white">
                        {THEME_LABEL.get(collection.theme) ?? collection.theme}
                      </span>
                      {collection.active_promotion && live && (
                        <span className="tag border-white bg-white text-black">
                          −
                          {collection.active_promotion.kind === "percent"
                            ? `${collection.active_promotion.value}%`
                            : "Oferta"}
                        </span>
                      )}
                      {!live && (
                        <span className="tag border-white/60 text-white/80">
                          {collection.status === "published" ? "Fuera de fecha" : "Borrador"}
                        </span>
                      )}
                    </span>

                    <span className="relative p-5">
                      <h2 className="font-display text-3xl text-white">
                        <a href={`/colecciones/${collection.slug}`} className="after:absolute after:inset-0">
                          {collection.name}
                        </a>
                      </h2>
                      {collection.tagline && (
                        <p className="mt-1.5 text-sm text-white/75">{collection.tagline}</p>
                      )}
                      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.6rem] tracking-[0.14em] text-white/60 uppercase">
                        <span>{collection.product_count} modelos</span>
                        {collection.ends_at && <span>Hasta el {formatDate(collection.ends_at)}</span>}
                      </p>
                    </span>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-14">
            <SectionHeading
              invert
              eyebrow="Cómo funciona"
              title="Promociones por colección"
              description="Desde el panel defines un descuento del 10 %, 20 % o una cantidad fija y lo aplicas a toda una colección o a un producto puntual. Gana siempre la promoción de mayor prioridad."
            />
          </div>
        </div>
      </section>
    </div>
  );
}