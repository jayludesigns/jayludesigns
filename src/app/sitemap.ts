import type { MetadataRoute } from "next";
import { getCatalog, getCollections } from "@/lib/data/catalog";
import { getSiteUrl } from "@/lib/site-url";

/** Se genera cada vez: el catálogo cambia seguido desde el panel. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections, siteUrl] = await Promise.all([
    getCatalog({}),
    getCollections(),
    getSiteUrl(),
  ]);

  const statics = [
    { path: "", priority: 1, freq: "daily" as const },
    { path: "/catalogo", priority: 0.9, freq: "daily" as const },
    { path: "/colecciones", priority: 0.8, freq: "weekly" as const },
    { path: "/diseno-a-medida", priority: 0.8, freq: "monthly" as const },
    { path: "/nosotros", priority: 0.5, freq: "yearly" as const },
    { path: "/contacto", priority: 0.5, freq: "yearly" as const },
  ].map((entry) => ({
    url: `${siteUrl}${entry.path}`,
    lastModified: new Date(),
    changeFrequency: entry.freq,
    priority: entry.priority,
  }));

  return [
    ...statics,
    ...collections.map((collection) => ({
      url: `${siteUrl}/colecciones/${collection.slug}`,
      lastModified: new Date(collection.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${siteUrl}/producto/${product.slug}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: "weekly" as const,
      priority: product.is_featured ? 0.8 : 0.6,
    })),
  ];
}
