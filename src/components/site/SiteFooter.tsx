import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Wordmark } from "@/components/site/Logo";
import { InstagramGlyph, TikTokGlyph, WhatsAppGlyph } from "@/components/site/BrandIcons";
import { getStoreSettings } from "@/lib/db";
import { whatsappUrl } from "@/lib/utils";

/** Botón de red social: círculo con borde claro que se pinta del acento. */
const SOCIAL =
  "grid size-10 place-items-center rounded-full border border-paper/25 text-paper/80 transition-all duration-200 hover:-translate-y-0.5 hover:border-ember-600 hover:bg-ember-600 hover:text-paper";

const EXPLORE = [
  { href: "/catalogo", label: "Todo el catálogo" },
  { href: "/colecciones", label: "Colecciones" },
  { href: "/catalogo?categoria=uniformes", label: "Uniformes" },
  { href: "/diseno-a-medida", label: "Diseño a medida" },
  { href: "/carrito", label: "Carrito" },
];

const HELP = [
  { href: "/nosotros", label: "Sobre JayLu" },
  { href: "/contacto", label: "Contacto" },
  { href: "/pedido/buscar", label: "Rastrear mi pedido" },
  { href: "/offline", label: "Sin conexión" },
];

export async function SiteFooter() {
  const settings = await getStoreSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 overflow-hidden bg-ink-950 text-paper">
      {/* Un halo de acento arriba a la derecha: es lo que hace que el pie
          deje de ser un bloque plano de negro y se sienta parte de la marca. */}
      <div className="glow-ember pointer-events-none absolute -top-40 right-0 size-[42rem] opacity-60" aria-hidden />

      {/* Cierre de marca: bloque gigante con la tipografía de display. */}
      <div className="relative overflow-hidden border-b border-paper/10 py-12 select-none sm:py-16">
        <div className="halftone-lg-light absolute inset-0 opacity-25" aria-hidden />
        <div className="wrap relative flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[0.62rem] tracking-[0.3em] text-ember-400 uppercase">
              Tu próxima prenda empieza aquí
            </p>
            <h2 className="mt-3 font-display text-5xl leading-[0.85] sm:text-7xl">
              Viste lo que
              <br />
              <span className="text-paper/40">te</span> imaginas
              <br />
              con Jay<span className="text-ember-500">Lu</span>
            </h2>
          </div>
          <div className="flex flex-col items-start gap-3">
            <Link href="/diseno-a-medida" className="btn btn-solid btn-lg">
              Diseñar mi franela
            </Link>
            <p className="max-w-56 text-xs leading-relaxed opacity-60">
              Mándanos una foto o cuéntanos la idea. Cotizamos sin compromiso.
            </p>
          </div>
        </div>
      </div>

      <div className="wrap relative grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Wordmark size="md" invert priority />
          <p className="mt-4 max-w-xs text-sm leading-relaxed opacity-70">
            {settings.description || settings.tagline}
          </p>
          <div className="mt-5 flex gap-2">
            {settings.whatsapp && (
              <a
                href={whatsappUrl(settings.whatsapp, "Hola JayLu, quiero información")}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Escríbenos por WhatsApp"
                className={SOCIAL}
              >
                <WhatsAppGlyph className="size-4" />
              </a>
            )}
            {settings.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Instagram de JayLu"
                className={SOCIAL}
              >
                <InstagramGlyph className="size-4" />
              </a>
            )}
            {settings.tiktok && (
              <a
                href={`https://tiktok.com/@${settings.tiktok.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="TikTok de JayLu"
                className={SOCIAL}
              >
                <TikTokGlyph className="size-4" />
              </a>
            )}
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                aria-label="Escribir a JayLu por correo"
                className={SOCIAL}
              >
                <Mail className="size-4" />
              </a>
            )}
          </div>
        </div>

        <nav className="lg:col-span-2" aria-label="Explorar">
          <h3 className="mb-4 font-mono text-[0.62rem] tracking-[0.22em] text-ember-400 uppercase">
            Explorar
          </h3>
          <ul className="space-y-2.5">
            {EXPLORE.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="link-underline text-sm text-paper/80 transition-colors hover:text-ember-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="lg:col-span-2" aria-label="Ayuda">
          <h3 className="mb-4 font-mono text-[0.62rem] tracking-[0.22em] text-ember-400 uppercase">
            Ayuda
          </h3>
          <ul className="space-y-2.5">
            {HELP.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="link-underline text-sm text-paper/80 transition-colors hover:text-ember-300"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:col-span-4">
          <h3 className="mb-4 font-mono text-[0.62rem] tracking-[0.22em] text-ember-400 uppercase">
            Escríbenos
          </h3>
          <ul className="space-y-3 text-sm">
            {settings.address && (
              <li className="flex gap-2.5 text-paper/80">
                <MapPin className="mt-0.5 size-4 shrink-0 text-ember-400" />
                <span>{settings.address}</span>
              </li>
            )}
            {settings.phone && (
              <li>
                <a
                  href={`tel:${settings.phone.replace(/\s/g, "")}`}
                  className="link-underline flex items-center gap-2.5 text-paper/80 transition-colors hover:text-ember-300"
                >
                  <Phone className="size-4 shrink-0" />
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.email && (
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="link-underline flex items-center gap-2.5 text-paper/80 transition-colors hover:text-ember-300"
                >
                  <Mail className="size-4 shrink-0" />
                  {settings.email}
                </a>
              </li>
            )}
          </ul>

          <div className="mt-6 rounded-xl border border-paper/15 bg-paper/5 p-4">
            <p className="font-mono text-[0.62rem] tracking-[0.18em] text-ember-400 uppercase">
              Precios
            </p>
            <p className="mt-1.5 text-sm text-paper/80">
              Mostramos bolívares y euros con la tasa BCV del día.
            </p>
            <p className="mt-1 font-mono text-[0.67rem] text-paper/50">
              1 € = {settings.bcv_rate} Bs · {settings.bcv_source}
            </p>
          </div>
        </div>
      </div>

      <div className="relative border-t border-paper/10">
        <div className="wrap flex flex-col items-start justify-between gap-3 py-5 text-[0.67rem] text-paper/60 sm:flex-row sm:items-center">
          <p>
            © {year} {settings.store_name}. Todos los derechos reservados.
          </p>
          <p className="font-mono tracking-wider uppercase">
            Hecho en Venezuela · blanco, negro y burdeos
          </p>
        </div>
      </div>
    </footer>
  );
}
