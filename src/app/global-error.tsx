"use client";

import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";

/**
 * Último recurso: si falla el layout raíz, ni siquiera hay `<html>` que
 * renderizar, así que Next monta este componente por su cuenta.
 *
 * En Next 16 tiene que ser un Client Component: es el único punto de la app
 * que puede vivir sin el árbol de servidor. Por eso no consulta los ajustes de
 * la tienda —para entonces ya no hay nada a lo que preguntar— y se conforma con
 * estilos en línea, que funcionan igual con la hoja de estilos o sin ella.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // En desarrollo el error real se ve en la consola del servidor; aquí solo
  // se registra en el navegador para no perderlo del todo.
  console.error(error);

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <main
          style={{
            minHeight: "100dvh",
            display: "grid",
            placeItems: "center",
            padding: "2rem",
            background: "#FFFFFF",
            color: "#000000",
          }}
        >
          <div
            style={{
              maxWidth: "32rem",
              border: "2px solid #000000",
              padding: "2.5rem",
              textAlign: "center",
            }}
          >
            <span
              style={{
                display: "inline-grid",
                placeItems: "center",
                width: "3.5rem",
                height: "3.5rem",
                border: "2px solid #000000",
              }}
            >
              <TriangleAlert size={24} strokeWidth={2} />
            </span>
            <h1 style={{ fontSize: "1.75rem", margin: "1.5rem 0 0" }}>
              JayLu no pudo arrancar
            </h1>
            <p style={{ marginTop: "0.75rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Hubo un error al construir la página. Recarga para intentarlo de nuevo.
            </p>
            {error.digest && (
              <p style={{ marginTop: "0.75rem", fontSize: "0.7rem", opacity: 0.5 }}>
                Código: {error.digest}
              </p>
            )}
            <div
              style={{
                marginTop: "2rem",
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={reset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  border: "2px solid #000000",
                  background: "#000000",
                  color: "#FFFFFF",
                  padding: "0.7rem 1.25rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={16} />
                Reintentar
              </button>
              <Link
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  border: "2px solid #000000",
                  padding: "0.7rem 1.25rem",
                  fontWeight: 700,
                  color: "#000000",
                  textDecoration: "none",
                }}
              >
                Inicio
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
