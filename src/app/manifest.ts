import type { MetadataRoute } from "next";
import { getStoreSettings } from "@/lib/db";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getStoreSettings();
  return {
    id: "/",
    name: `${settings.store_name} · ${settings.tagline}`,
    short_name: settings.store_name,
    description: settings.description,
    lang: "es-VE",
    dir: "ltr",
    start_url: "/?fuente=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFFFFF",
    theme_color: "#000000",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Catálogo", url: "/catalogo", description: "Ver todas las franelas" },
      { name: "Carrito", url: "/carrito", description: "Revisar tu pedido" },
      { name: "Diseño a medida", url: "/diseno-a-medida", description: "Pide tu diseño" },
    ],
  };
}
