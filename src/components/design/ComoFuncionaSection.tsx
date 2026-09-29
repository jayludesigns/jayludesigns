import { SectionHeading } from "@/components/site/SectionHeading";

const PASOS = [
  {
    title: "Nos llega tu idea",
    body: "Foto, texto o las dos cosas. Sin registro ni tarjeta.",
  },
  {
    title: "Te cotizamos",
    body: "Precio, plazo y técnica recomendada. Gratis.",
  },
  {
    title: "Muestra digital",
    body: "Te mostramos cómo va. Ajustas lo que quieras.",
  },
  {
    title: "Apruebas y pagas",
    body: "Imprimimos solo con tu visto bueno.",
  },
  {
    title: "Entrega",
    body: "Recogida en Maracay o envío por encomienda.",
  },
];

/**
 * "Cómo funciona" como banda propia. Salió del costado del formulario para
 * que el formulario use todo el ancho y la página se lea en orden: cómo
 * funciona → antes de mandar → carga del pedido → con qué imprimimos.
 * Mismas celdas opacas y el mismo título mono que las ventajas del inicio.
 */
export function ComoFuncionaSection() {
  return (
    <section className="relative overflow-hidden bg-ink-950">
      <div className="halftone-light absolute inset-0 opacity-[0.04]" aria-hidden />
      <div className="wrap relative py-14">
        <SectionHeading
          invert
          eyebrow="Paso a paso"
          title="Cómo funciona"
          description="Cinco pasos desde que nos mandas la idea hasta que recibes la prenda. Cotizamos gratis y no se imprime nada hasta que apruebes la muestra."
        />

        <ol className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-ink-900/60 sm:grid-cols-2 lg:grid-cols-5">
          {PASOS.map((paso, index) => (
            <li key={paso.title} className="bg-ink-900 p-5">
              <span className="font-display text-3xl leading-none text-ember-400">
                0{index + 1}
              </span>
              <h3 className="mt-3 font-mono text-[0.67rem] leading-[1.45] tracking-[0.2em] text-ember-300 uppercase">
                {paso.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-200">{paso.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
