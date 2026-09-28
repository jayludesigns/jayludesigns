"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En desarrollo conviene verlo en consola; en producción iría a un
    // servicio de captura de errores.
    console.error(error);
  }, [error]);

  return (
    <div className="wrap py-20">
      <div className="mx-auto max-w-xl border-2 border-ink p-8 text-center sm:p-12">
        <span className="mx-auto grid size-14 place-items-center border-2 border-ink">
          <TriangleAlert className="size-6" strokeWidth={2} />
        </span>
        <h1 className="mt-5 text-4xl leading-[0.9]">Algo salió mal</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-600">
          Hubo un error inesperado al cargar esta página. Tu carrito y tus datos
          siguen guardados: prueba a recargar.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[0.65rem] text-ink-500">
            Código: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-solid btn-lg">
            <RefreshCw className="size-4" />
            Reintentar
          </button>
          <Link href="/" className="btn btn-lg">
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
