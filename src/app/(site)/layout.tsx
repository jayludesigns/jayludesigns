import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getCategories, getHeaderPromo } from "@/lib/data/catalog";

/**
 * Carcasa de la tienda: cabecera, contenido y pie. La cabecera es un
 * componente de cliente, así que las categorías y la promoción vigente se
 * resuelven aquí, en el servidor, y le llegan como props serializables.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [categories, promo] = await Promise.all([getCategories(), getHeaderPromo()]);

  return (
    <>
      <SiteHeader
        categories={categories.map((category) => ({ slug: category.slug, name: category.name }))}
        promo={promo}
      />
      <main id="contenido">{children}</main>
      <SiteFooter />
    </>
  );
}