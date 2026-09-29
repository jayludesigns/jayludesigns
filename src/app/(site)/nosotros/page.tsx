import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Brush, Heart, Scissors, Shirt, Sparkles, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Logo } from "@/components/site/Logo";
import { SectionHeading } from "@/components/site/SectionHeading";
import { getStoreSettings } from "@/lib/db";
import { formatVes } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "JayLu imprime franelas, uniformes y piezas personalizadas en Venezuela. Conoce el taller, los materiales y cómo trabajamos.",
  alternates: { canonical: "/nosotros" },
};

const VALUES = [
  {
    icon: Scissors,
    title: "Imprimimos nosotros",
    body: "Sin intermediarios. El diseño que apruebas es el que sale de la prensa, y si algo sale mal lo reimprimimos.",
  },
  {
    icon: Heart,
    title: "Precio enearer, no escondido",
    body: "El precio en euros sale de la tasa BCV del día, sin margen extra por el cambio. Se ve en cada producto.",
  },
  {
    icon: Sparkles,
    title: "Muestra antes de imprimir",
    body: "Ningún lote entra a producción sin tu visto bueno digital. Así no se desperdicia tela ni tinta.",
  },
  {
    icon: Shirt,
    title: "Tela que aguanta",
    body: "Algodón peinado de 180 a 320 g/m², según la prenda. Pesamos cada modelo para que sepas lo que compras.",
  },
];

const PROCESS = [
  ["Eliges o diseñas", "Del catálogo o a medida, con tu foto o tu idea."],
  ["Aprobamos la muestra", "Te mostramos el diseño en pantalla antes de imprimir."],
  ["Imprimimos", "Sublimación o DTF textil, según la prenda y el diseño."],
  ["Control de calidad", "Revisamos pieza por pieza antes de empacar."],
  ["Te entregamos", "Recogida en Maracay o envío por encomienda a toda Venezuela."],
];

export default async function AboutPage() {
  const settings = await getStoreSettings();

  return (
    <div>
      {/* Portada */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="halftone-light absolute inset-0 opacity-[0.05]" aria-hidden />
        <div className="wrap relative py-14 sm:py-20">
          <Breadcrumbs
            invert
            items={[{ href: "/", label: "Inicio" }, { href: "/nosotros", label: "Nosotros" }]}
          />
          {/* A la derecha del título sobraba un vacío ancho: ahí va el isotipo
              de la marca, con la misma escala del H1 (a `lg` su alto es el de
              las dos líneas primeras del título) y en blanco pleno —sin
              opacidad— para que se lea de un vistazo sobre el negro de la
              banda. `items-start` lo ancla al arranque del título, no al del
              párrafo. */}
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              {/* Interlineado 0.95 y no 0.88: con el display tan apretado los
                  ascendentes del título se comían la línea de arriba. */}
              <h1 className="max-w-4xl text-5xl leading-[0.95] sm:text-6xl lg:text-8xl">
                Un taller
                <br />
                chico con
                <br />
                <span className="opacity-40">grandes</span> ideas
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-300 sm:text-lg">
                JayLu nació de una pregunta simple: ¿por qué las franelas de
                Venezuela son todas iguales? Hoy imprimimos{" "}
                {settings.store_name} en Maracay, con catálogo propio y diseños que
                la gente nos manda.
              </p>
            </div>
            <Logo invert className="w-40 shrink-0 sm:w-52 lg:w-64 xl:w-88" />
          </div>
        </div>
      </section>

      <div className="divider-glow" aria-hidden />

      {/* Historia */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="halftone-light absolute inset-0 opacity-[0.04]" aria-hidden />
        <div className="wrap relative py-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div>
              <h2 className="text-3xl sm:text-4xl">Cómo empezamos</h2>
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-ink-300 sm:text-base">
                <p>
                  Todo arrancó con una manta de anime, una prensa prestada y un
                  grupo de amigos que querían la misma camiseta. Lo que
                  imprimimos salió medio torcido, lo repetimos otras seis veces y
                  de ahí salió el nombre.
                </p>
                <p>
                  Hoy seguimos con la misma regla: si no lo marcaríamos nosotros,
                  no lo vendemos. Por eso el catálogo es corto y cada diseño tiene
                  su historia. Y por eso el visor 360° está en todas las prendas:
                  no quieres regalarle algo que no se ve bien desde atrás.
                </p>
                <p>
                  El resto es lo de siempre: buenos materiales, precios claros en
                  bolívares y euros, y avisarte cuando algo se tarda más de lo
                  prometido.
                </p>
              </div>
            </div>

            <aside className="space-y-3">
              <div className="card-dark p-5">
                <p className="font-mono text-[0.62rem] tracking-[0.2em] text-ink-400 uppercase">
                  Datos rápidos
                </p>
                <dl className="mt-3 space-y-2.5 text-sm">
                  {[
                    ["Fundación", "Maracay, estado Aragua"],
                    ["Pedido mínimo", "1 unidad"],
                    ["Producción", "3 a 5 días hábiles"],
                    ["Envío gratis", `desde ${formatVes(settings.free_shipping_over_ves)}`],
                    ["Tasa BCV", `1 € = ${formatVes(settings.bcv_rate, "Bs", false)}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3 border-b border-ink-800 pb-2.5">
                      <dt className="text-ink-400">{label}</dt>
                      <dd className="text-right font-bold">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="card-dark p-5">
                <h3 className="flex items-center gap-2 font-display text-lg">
                  <Brush className="size-4" />
                  ¿Tienes una idea?
                </h3>
                <p className="mt-2 text-sm text-ink-300">
                  Mándanos la foto o cuéntanos la idea. Cotizamos gratis.
                </p>
                <Link href="/diseno-a-medida" className="btn btn-solid mt-4 w-full">
                  Enviar mi diseño
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="divider-glow" aria-hidden />

      {/* Valores */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="halftone-light absolute inset-0 opacity-[0.04]" aria-hidden />
        <div className="wrap relative py-14">
          <SectionHeading invert eyebrow="Cómo trabajamos" title="Cuatro cosas que no negociamos" />
          {/* Mismas reglas que las ventajas del inicio: celdas opacas (no
              translúcidas), icono con su propio color —los iconos heredaban
              el negro del body y desaparecían sobre la banda— y título en
              mono del acento para que deje de brillar sobre el negro. */}
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <div key={value.title} className="bg-ink-900 p-5">
                <value.icon className="size-5 text-ember-400" />
                <h3 className="mt-3 font-mono text-[0.72rem] leading-[1.45] tracking-[0.22em] text-ember-300 uppercase">
                  {value.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-200">{value.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-glow" aria-hidden />

      {/* Proceso */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="halftone-light absolute inset-0 opacity-[0.04]" aria-hidden />
        <div className="wrap relative py-14">
          <SectionHeading
            invert
            eyebrow="Proceso"
            title="De la idea a la puerta"
            description="Los mismos cinco pasos para una unidad o para doscientas."
          />
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS.map(([title, body], index) => (
              <li key={title} className="card-dark relative p-4">
                <span className="font-mono text-4xl font-bold text-ink-400/40">
                  0{index + 1}
                </span>
                <h3 className="mt-1 font-display text-lg leading-tight">{title}</h3>
                <p className="mt-1.5 text-sm text-ink-300">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="divider-glow" aria-hidden />

      {/* Uniformes */}
      <section className="relative overflow-hidden bg-ink-950">
        <div className="halftone-light absolute inset-0 opacity-[0.04]" aria-hidden />
        <div className="wrap relative pb-16">
          <div className="card-dark p-6 sm:p-10">
            <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <p className="mb-2 flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.2em] text-ink-400 uppercase">
                  <Truck className="size-3.5" />
                  Uniformes y lotes
                </p>
                <h2 className="text-3xl sm:text-4xl">Colegios, empresas y grupos</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink-300 sm:text-base">
                  Estampamos tu logo con sublimación o DTF textil, imprimimos los
                  nombres de cada persona, controlamos tallas por curso y
                  entregamos en la fecha que acordamos. Con cotización cerrada en
                  24 horas y precios por volumen visibles desde el catálogo.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/catalogo?categoria=uniformes" className="btn btn-solid btn-lg">
                  Ver uniformes
                </Link>
                <Link href="/contacto" className="btn btn-ghost-light btn-lg">
                  Cotizar lote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}