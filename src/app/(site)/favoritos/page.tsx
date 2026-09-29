import type { Metadata } from "next";
import { FavoritesList } from "@/components/wishlist/FavoritesList";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Tus modelos guardados de JayLu: franelas, hoodies, uniformes y más.",
};

export default function FavoritesPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink-200">
        <div className="halftone absolute inset-0 opacity-[0.06]" aria-hidden />
        {/* Arriba `pt-8`, el mismo aire que dejan la barra de navegación y las
            migas en catálogo, contacto, colecciones, nosotros y diseño a
            medida. El de abajo se deja como estaba: separa el título del
            bloque. */}
        <div className="wrap relative pt-8 pb-12 sm:pb-16">
          <Breadcrumbs
            items={[{ href: "/", label: "Inicio" }, { href: "/favoritos", label: "Favoritos" }]}
          />
          <h1 className="mt-6 text-5xl leading-[0.88] sm:text-6xl">Tus favoritos</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-600">
            Se guardan en tu navegador: cierra la página y siguen aquí.
          </p>
        </div>
      </section>

      <section className="wrap py-12 sm:py-16">
        <FavoritesList />
      </section>
    </div>
  );
}