import type { Metadata } from "next";
import Link from "next/link";
import { CloudOff, RefreshCw, ShoppingBag, Wifi } from "lucide-react";

export const metadata: Metadata = {
  title: "Sin conexión",
  description: "No hay internet en este momento. Esto es lo que puedes hacer.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="wrap py-16">
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid size-16 place-items-center border-2 border-ink">
          <CloudOff className="size-7" strokeWidth={1.8} />
        </span>

        <p className="mt-6 font-mono text-[0.62rem] tracking-[0.24em] text-ink-500 uppercase">
          Sin conexión
        </p>
        <h1 className="mt-3 text-4xl leading-[0.9] sm:text-5xl">
          Se cayó internet
          <br />
          <span className="opacity-40">pero tu carrito</span> está a salvo
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-ink-600 sm:text-base">
          La app guardó lo que ya habías visto, así que puedes seguir mirando
          lo que te interesa. Para confirmar un pedido necesitamos conexión.
        </p>

        <ul className="mx-auto mt-8 max-w-md space-y-3 text-left text-sm">
          {[
            [Wifi, "Las páginas que ya abriste se pueden volver a leer."],
            [ShoppingBag, "Tu carrito se guarda en el teléfono: no se pierde."],
            [RefreshCw, "Vuelve a cargar cuando vuelvas a tener señal."],
          ].map(([Icon, text]) => {
            const Cmp = Icon as typeof Wifi;
            return (
              <li key={String(text)} className="flex items-center gap-3 border border-ink p-3">
                <span className="grid size-8 shrink-0 place-items-center border border-ink">
                  <Cmp className="size-3.5" />
                </span>
                <span>{text as string}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-solid btn-lg">
            Ir al inicio
          </Link>
          <Link href="/carrito" className="btn btn-lg">
            Ver mi carrito
          </Link>
        </div>
      </div>
    </div>
  );
}
