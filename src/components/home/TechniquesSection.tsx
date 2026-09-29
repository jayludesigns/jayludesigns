import { CheckCircle2, Layers, Sun } from "lucide-react";
import { SectionHeading } from "@/components/site/SectionHeading";

const DTF_POINTS = [
  "Apto para algodón, telas oscuras y claras.",
  "Colores ultrapigmentados y detalles finos.",
  "Soporta más de 50 ciclos de lavado.",
];

const SUB_POINTS = [
  "Tacto suave e imperceptible al tacto.",
  "Tejido 100 % transpirable (ideal deportivas).",
  "Durabilidad ilimitada en telas blancas o claras.",
];

/**
 * Banda oscura de storytelling: compara las dos técnicas de estampado de la
 * casa. Solo contenido (los precios y la decisión viven en el cotizador).
 */
export function TechniquesSection() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-ink-950">
      <div className="glow-ember absolute inset-0 opacity-60" aria-hidden />
      <div className="halftone-light absolute inset-0 opacity-[0.05]" aria-hidden />

      <div className="wrap relative py-16 sm:py-20">
        <SectionHeading
          invert
          eyebrow="Tecnología de impresión"
          title="Nuestras técnicas de estampado"
          description="Elegimos el método según el tipo de tela y el diseño para garantizar la máxima durabilidad."
          action={{ href: "/catalogo", label: "Ver el catálogo" }}
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* DTF */}
          <article className="glass-dark group relative overflow-hidden rounded-2xl p-8 transition-colors hover:border-ember-400/60">
            <span
              className="absolute -top-10 -right-10 size-36 rounded-bl-full bg-ember-600/15"
              aria-hidden
            />
            <span className="grid size-12 place-items-center rounded-xl bg-ember-600/20 text-ember-300 transition-transform duration-300 group-hover:scale-110">
              <Layers className="size-6" />
            </span>
            <p className="mt-6 text-[0.62rem] font-bold tracking-[0.18em] text-ember-300 uppercase">
              Técnica estrella
            </p>
            <h3 className="mt-2 text-2xl">Impresión DTF</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Ideal para prendas de cualquier color y composición: algodón,
              mezcla o poliéster. Colores vibrantes, detalles nítidos y un
              acabado elástico de alta resistencia al lavado.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              {DTF_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 shrink-0 text-ember-400" />
                  {point}
                </li>
              ))}
            </ul>
          </article>

          {/* Sublimación */}
          <article className="glass-dark group relative overflow-hidden rounded-2xl p-8 transition-colors hover:border-ember-400/60">
            <span
              className="absolute -top-10 -right-10 size-36 rounded-bl-full bg-white/5"
              aria-hidden
            />
            <span className="grid size-12 place-items-center rounded-xl bg-white/10 text-white transition-transform duration-300 group-hover:scale-110">
              <Sun className="size-6" />
            </span>
            <p className="mt-6 text-[0.62rem] font-bold tracking-[0.18em] text-white/50 uppercase">
              Tacto cero
            </p>
            <h3 className="mt-2 text-2xl">Sublimación de alta definición</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              La tinta se fusiona directamente con la fibra del poliéster.
              Inmune al desgaste, no se agrieta ni pierde color: ideal para
              ropa deportiva y diseños de cobertura amplia.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-white/80">
              {SUB_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 shrink-0 text-ember-400" />
                  {point}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}