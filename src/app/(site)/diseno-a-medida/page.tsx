import type { Metadata } from "next";
import Link from "next/link";
import { Brush, Clock, MessageCircle, Truck, Wallet } from "lucide-react";
import { CustomDesignForm } from "@/components/design/CustomDesignForm";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { SectionHeading } from "@/components/site/SectionHeading";
import { getStoreSettings } from "@/lib/db";
import { PRINT_TECHNIQUES } from "@/lib/types";
import { whatsappUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Diseño a medida",
  description:
    "Pide tu diseño personalizado: sube una foto de referencia y/o describe tu idea. Cotización gratis en 48 h, desde una unidad.",
  alternates: { canonical: "/diseno-a-medida" },
};

type Search = Promise<Record<string, string | string[] | undefined>>;

const BENEFITS = [
  {
    icon: Wallet,
    title: "Sin compromiso",
    body: "Cotizamos gratis. Si no te convence el precio, no pasa nada.",
  },
  {
    icon: Clock,
    title: "Respuesta en 48 h",
    body: "Ves la cotización y una muestra digital antes de pagar nada.",
  },
  {
    icon: Truck,
    title: "Desde una unidad",
    body: "Una franela para ti o 200 para tu colegio. El mismo proceso.",
  },
  {
    icon: MessageCircle,
    title: "Hablas con el impresor",
    body: "Consultas por WhatsApp con quien va a estampar, no con un bot.",
  },
];

export default async function CustomDesignPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const raw = params.modelo;
  const model = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  const settings = await getStoreSettings();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-200">
        <div className="grid-paper absolute inset-0 opacity-70" aria-hidden />
        <div className="wrap relative py-12 sm:py-16">
          <Breadcrumbs
            items={[
              { href: "/", label: "Inicio" },
              { href: "/diseno-a-medida", label: "Diseño a medida" },
            ]}
          />
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-end">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 border border-ink bg-ink px-2.5 py-1 font-mono text-[0.6rem] font-bold tracking-[0.18em] text-paper uppercase">
                <Brush className="size-3" />
                Diseño a medida
              </p>
              <h1 className="text-5xl leading-[0.9] sm:text-6xl lg:text-7xl">
                Cuéntanos qué
                <br />
                quieres estampar
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-700">
                Sube una foto de referencia y cuéntanos la idea. <strong>Los dos
                campos son opcionales</strong>: con cualquiera de los dos ya
                empezamos, y con los dos el resultado se parece mucho más a lo
                que imaginas.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {BENEFITS.map((item) => (
                <li key={item.title} className="flex gap-3 border border-ink bg-paper p-3">
                  <span className="grid size-9 shrink-0 place-items-center border border-ink">
                    <item.icon className="size-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-ink-600">{item.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {model && (
            <p className="mt-6 inline-flex items-center gap-2 border-2 border-ink px-3 py-2 text-sm">
              Tomando como base: <strong>{model}</strong>. Cambia lo que quieras
              abajo.
            </p>
          )}
        </div>
      </section>

      <div className="wrap py-12">
        <CustomDesignForm model={model} />
      </div>

      <div className="wrap pb-16">
        <SectionHeading
          eyebrow="Antes de mandar"
          title="Lo que conviene saber"
          description="Tres cosas que evitan la mayoría de los rehaceres."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Manda la referencia más nitida que tengas",
              body: "Una foto de tu teléfono bien iluminada sirve más que un escaneo. Si tienes el archivo original (PNG, AI, PDF), mejor todavía.",
            },
            {
              title: "Escribe los textos exactos",
              body: "Mayúsculas, tildes y cómo quieres el orden. Lo que no se escribe, se imprime mal.",
            },
            {
              title: "Define para cuántas personas es",
              body: "Una talla es un diseño. Para grupos hacemos directamente la versión con los nombres de cada persona.",
            },
          ].map((item) => (
            <article key={item.title} className="card p-5">
              <h3 className="font-display text-xl leading-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.body}</p>
            </article>
          ))}
        </div>

        {settings.whatsapp && (
          <div className="mt-8 flex flex-col items-start justify-between gap-4 border-2 border-ink p-6 sm:flex-row sm:items-center">
            <p className="text-sm">
              ¿Prefieres mandarlo por WhatsApp? Mándanos la foto y la idea, y te
              cotizamos ahí mismo.
            </p>
            <a
              href={whatsappUrl(
                settings.whatsapp,
                "Hola JayLu, quiero cotizar un diseño a medida. Te mando la referencia.",
              )}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-solid"
            >
              <MessageCircle className="size-4" />
              Mandar por WhatsApp
            </a>
          </div>
        )}

        <p className="mt-6 text-sm text-ink-600">
          ¿Solo querías comprar algo del catálogo?{" "}
          <Link href="/catalogo" className="link-underline font-bold">
            Mira el catálogo completo
          </Link>
          .
        </p>
      </div>

      {/* Técnicas: hoy solo dos. La lista sale de PRINT_TECHNIQUES, así que
          cuando el taller sume otra, esta página ya la anuncia sola. */}
      <section className="wrap pb-16">
        <SectionHeading
          eyebrow="Con qué lo imprimimos"
          title={PRINT_TECHNIQUES.map((technique) => technique.label).join(" y ")}
          description="Son las únicas dos técnicas del taller por ahora. Las dos entran en la fibra, así que el estampado no se agrieta ni se despega con los lavados."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {PRINT_TECHNIQUES.map((technique, index) => (
            <article key={technique.value} className="card card-hover p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ember-50 font-mono text-sm font-bold text-ember-600">
                  {index + 1}
                </span>
                <h3 className="font-display text-xl leading-tight">{technique.label}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-600">
                {technique.detail}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-ink-600">
          ¿Te piden bordado o serigrafía? Todavía no lo hacemos. Cuéntanos y te
          avisamos el día que abramos esa fecha.
        </p>
      </section>
    </div>
  );
}
