import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { TrackOrderForm } from "@/components/shop/TrackOrderForm";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { SectionHeading } from "@/components/site/SectionHeading";

export const metadata: Metadata = {
  title: "Rastrear mi pedido",
  description: "Consulta el estado de tu pedido de JayLu con el número y el teléfono.",
  alternates: { canonical: "/pedido/buscar" },
};

const FAQ = [
  {
    q: "¿Cuánto tarda el pedido?",
    a: "De 3 a 5 días hábiles de producción. Los lotes de uniformes y los grupos de más de 30 unidades se cotizan aparte con su propio plazo.",
  },
  {
    q: "¿Dónde veo el número?",
    a: "Está en la pantalla de confirmación que viste al comprar y en el mensaje de WhatsApp o correo que te enviamos.",
  },
  {
    q: "¿Y si compré como invitado?",
    a: "No necesitas cuenta: con el número y el teléfono es suficiente. También puedes escribirnos y lo buscamos.",
  },
];

export default function TrackOrderPage() {
  return (
    <div className="wrap py-8">
      <Breadcrumbs
        items={[
          { href: "/", label: "Inicio" },
          { href: "/pedido/buscar", label: "Rastrear pedido" },
        ]}
      />

      <header className="mt-5 max-w-2xl">
        <p className="mb-2 font-mono text-[0.62rem] tracking-[0.24em] text-ink-500 uppercase">
          Seguimiento
        </p>
        <h1 className="text-4xl sm:text-5xl">Rastrear mi pedido</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-600 sm:text-base">
          Escribe el número del pedido y el teléfono con el que compraste. Te
          mostramos el estado, los datos de pago pendientes y el enlace para
          volver a verlo cuando quieras.
        </p>
      </header>

      <div className="mt-8 max-w-3xl">
        <TrackOrderForm />
      </div>

      <section className="mt-14 max-w-3xl">
        <SectionHeading eyebrow="Dudas" title="Preguntas frecuentes" />
        <dl className="mt-6 space-y-4">
          {FAQ.map((item) => (
            <div key={item.q} className="border-b border-ink-100 pb-4">
              <dt className="text-sm font-bold">{item.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-ink-600">{item.a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <Search className="size-4" />
          ¿No lo encuentras?
          <Link href="/contacto" className="btn btn-sm">
            Escríbenos
          </Link>
        </p>
      </section>
    </div>
  );
}
