"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { Wordmark } from "@/components/site/Logo";
import { CurrencyToggle } from "@/components/currency/PriceDisplay";
import { useCart } from "@/components/cart/CartContext";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import { cn } from "@/lib/utils";
import type { HeaderPromo } from "@/lib/types";

/** Categorías mínimas para el desplegable de la barra de búsqueda. */
interface HeaderCategory {
  slug: string;
  name: string;
}

const NAV = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/colecciones", label: "Colecciones" },
  { href: "/diseno-a-medida", label: "Tu diseño" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

const TICKER = [
  "Envío gratis desde 30 Bs",
  "Tasa BCV actualizada a diario",
  "Sublimación y DTF textil",
  "Diseños a medida desde 1 unidad",
];

/** Botón de icono de la cabecera: círculo con borde claro que se pinta del
 *  acento al pasar por encima, en vez del recuadro negro de antes. */
const ICON_BUTTON =
  "relative grid size-10 place-items-center rounded-full border border-ink-200 text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-ember-600 hover:bg-ember-600 hover:text-paper hover:shadow-ember";

export function SiteHeader({
  categories = [],
  promo = null,
}: {
  categories?: HeaderCategory[];
  promo?: HeaderPromo | null;
}) {
  const pathname = usePathname();
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [scrolled, setScrolled] = useState(false);

  // El menú móvil tiene que cerrarse solo al cambiar de página. En vez de un
  // efecto que vigila `pathname` —y provoca un render extra en cada
  // navegación— se recuerda para qué ruta se abrió: en cuanto `pathname` deja
  // de coincidir, el menú está cerrado. Menos estado, menos trabajo.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn === pathname;
  const toggleOpen = useCallback(
    () => setOpenedOn(openedOn === pathname ? null : pathname),
    [openedOn, pathname],
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-80">
      {/* Marquesina: el acento es lo primero que entra por la pantalla, así
          que la franja arranca en burdeos. Sin imagen, para no competir con
          el logo. */}
      <div className="overflow-hidden bg-ember-600 py-2 text-paper">
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
          {[0, 1].map((copy) => (
            <div
              key={copy}
              className="flex shrink-0 gap-10"
              aria-hidden={copy === 1}
            >
              {TICKER.map((item) => (
                <span
                  key={item}
                  className="font-mono text-[0.6rem] tracking-[0.22em] uppercase"
                >
                  {item} <span className="opacity-45">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-ink-200 bg-paper/85 backdrop-blur-md">
        <div className="wrap">
          <div
            className={cn(
              "flex items-center justify-between gap-4 transition-[height] duration-200",
              scrolled ? "h-16" : "h-[4.5rem]",
            )}
          >
            <Link
              href="/"
              aria-label="JayLu, ir al inicio"
              className="shrink-0"
            >
              <Wordmark priority />
            </Link>

            <nav
              className="hidden items-center gap-7 lg:flex"
              aria-label="Navegación principal"
            >
              {NAV.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "link-underline text-[0.72rem] font-bold tracking-[0.14em] uppercase transition-colors hover:text-ember-600",
                      active && "text-ember-600",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <CurrencyToggle className="hidden sm:flex" />

              <Link
                href="/catalogo"
                aria-label="Buscar productos"
                className={cn(ICON_BUTTON, "sm:hidden")}
              >
                <Search className="size-4" />
              </Link>

              <Link
                href="/favoritos"
                aria-label={`Favoritos, ${wishlistCount} ${wishlistCount === 1 ? "producto" : "productos"}`}
                className={ICON_BUTTON}
              >
                <Heart className="size-4" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 grid min-w-5 place-items-center rounded-full bg-ink px-1 font-mono text-[0.6rem] font-bold text-paper shadow-soft">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                href="/carrito"
                aria-label={`Carrito con ${cartCount} ${cartCount === 1 ? "producto" : "productos"}`}
                className={ICON_BUTTON}
              >
                <ShoppingBag className="size-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 grid min-w-5 place-items-center rounded-full bg-ember-600 px-1 font-mono text-[0.6rem] font-bold text-paper shadow-ember">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={toggleOpen}
                aria-expanded={open}
                aria-label={open ? "Cerrar menú" : "Abrir menú"}
                className={cn(ICON_BUTTON, "lg:hidden")}
              >
                {open ? <X className="size-4" /> : <Menu className="size-4" />}
              </button>
            </div>
          </div>

          {/* Barra de búsqueda con selector de categoría y caja de promoción,
              como en la referencia. La fila aparece desde tablets; en móvil
              manda el icono de lupa del bloque superior. */}
          <div className="hidden items-stretch gap-3 pb-4 sm:grid md:grid-cols-[minmax(0,1fr)_auto]">
            <form
              action="/catalogo"
              method="get"
              role="search"
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-stretch overflow-hidden rounded-xl border border-ink-200 bg-paper shadow-xs focus-within:border-ember-600 focus-within:ring-2 focus-within:ring-ember-600/20"
            >
              <label className="sr-only" htmlFor="hdr-cat">
                Categoría
              </label>
              <select
                id="hdr-cat"
                name="categoria"
                defaultValue=""
                className="border-r border-ink-200 bg-ink-50 px-3 py-2.5 font-mono text-[0.65rem] font-bold tracking-wider text-ink-700 uppercase focus:outline-none lg:max-w-52"
              >
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="hdr-q">
                Buscar productos
              </label>
              <input
                id="hdr-q"
                name="q"
                type="search"
                placeholder="Busca franelas, hoodies, uniformes…"
                className="min-w-0 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-ink-500 focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-2 bg-ember-600 px-4 font-mono text-[0.65rem] font-bold tracking-[0.14em] text-paper uppercase transition-colors hover:bg-ember-700 sm:px-5"
              >
                <Search className="size-4" />
                <span className="hidden md:inline">Buscar</span>
              </button>
            </form>

            {promo && (
              <Link
                href="/catalogo"
                className="flex min-w-44 flex-col justify-center rounded-xl border border-ember-200 bg-ember-50 px-4 py-2 text-center transition-colors hover:border-ember-300 hover:bg-ember-100"
              >
                <span className="font-mono text-[0.6rem] font-bold tracking-[0.18em] text-ember-700 uppercase">
                  {promo.name}
                </span>
                <span className="mt-0.5 text-xs font-bold text-ink-700">
                  {promo.kind === "percent" ? `−${promo.value}%` : `Bs.S ${promo.value} de descuento`}
                  <span className="ml-1 font-normal text-ink-500">
                    {promo.scope === "product" ? "en un producto" : "en la colección"}
                  </span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Panel móvil */}
      {open && (
        <div className="animate-fade-in fixed inset-x-0 top-[calc(100%-0px)] z-79 max-h-[80dvh] overflow-y-auto border-b border-ink-200 bg-paper shadow-lg lg:hidden">
          <div className="wrap flex flex-col py-4">
            {NAV.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-baseline gap-3 border-b border-ink-100 py-4 font-display text-3xl uppercase transition-colors hover:text-ember-600 last:border-0"
              >
                <span className="font-mono text-[0.6rem] text-ink-500">
                  0{index + 1}
                </span>
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="label mb-0">Moneda</span>
              <CurrencyToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
