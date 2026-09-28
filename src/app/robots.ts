import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // El panel, el carrito y el checkout nunca se indexan.
        disallow: ["/admin", "/admin/", "/carrito", "/checkout", "/pedido/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
