import Link from "next/link";
import { ArrowRight, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="wrap py-20">
      <div className="relative overflow-hidden border-2 border-ink p-8 sm:p-14">
        <div className="halftone absolute inset-0 opacity-[0.07]" aria-hidden />
        <div className="relative max-w-xl">
          <p className="font-mono text-[0.62rem] tracking-[0.24em] text-ink-500 uppercase">
            Error 404
          </p>
          <h1 className="mt-3 text-6xl leading-[0.85] sm:text-7xl">
            Esta prenda
            <br />
            no existe
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-ink-600 sm:text-base">
            La página que buscas no está aquí. Puede que el enlace esté mal
            escrito o que el producto se haya retirado del catálogo.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="btn btn-solid btn-lg">
              <Home className="size-4" />
              Volver al inicio
            </Link>
            <Link href="/catalogo" className="btn btn-lg">
              <Search className="size-4" />
              Ver catálogo
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <p className="mt-8 border-t border-ink-200 pt-5 text-sm text-ink-600">
            ¿Buscas algo puntual?{" "}
            <Link href="/diseno-a-medida" className="link-underline font-bold">
              Pídelo a medida
            </Link>{" "}
            o{" "}
            <Link href="/contacto" className="link-underline font-bold">
              escríbenos
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
