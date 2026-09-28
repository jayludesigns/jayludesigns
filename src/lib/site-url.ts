import { headers } from "next/headers";
import { siteUrl } from "@/lib/db";

/**
 * URL pública de la tienda, deducida de la petición en lugar de fija.
 *
 * `siteUrl` es el valor declarado —variable de entorno o `localhost:3000`— y
 * sirve para el panel, el `sitemap.xml` y el `robots.txt`. Pero en desarrollo
 * la app casi siempre arranca en otro puerto, y los metadatos absolutos
 * (Open Graph, canonical) deben apuntar al origen real: para eso se pregunta
 * por las cabeceras de la petición. En producción manda la variable de
 * entorno, que es la única fuente fiable detrás de un proxy.
 */
export async function getSiteUrl(): Promise<string> {
  const declared = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (declared) return declared;

  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    if (!host) return siteUrl;

    const proto =
      requestHeaders.get("x-forwarded-proto") ??
      (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

    return `${proto}://${host}`;
  } catch {
    // `headers()` falla si se llama fuera de una petición (scripts, seed).
    return siteUrl;
  }
}
