import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { InstagramGlyph } from "@/components/site/BrandIcons";
import { getStoreSettings } from "@/lib/db";
import { whatsappUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos a JayLu: cotizaciones, uniformes, pedidos mayoristas o dudas.",
  alternates: { canonical: "/contacto" },
};

export default async function ContactPage() {
  const settings = await getStoreSettings();
  const wa = settings.whatsapp;

  return (
    <div className="relative overflow-hidden bg-ink-950">
      <div className="halftone-light absolute inset-0 opacity-[0.04]" aria-hidden />
      <div className="wrap relative py-8">
        <Breadcrumbs
          invert
          items={[{ href: "/", label: "Inicio" }, { href: "/contacto", label: "Contacto" }]}
        />

        <header className="mt-5 max-w-2xl">
          <h1 className="text-5xl sm:text-6xl">Hablemos</h1>
          <p className="mt-4 text-base leading-relaxed text-ink-300">
            Contestamos en menos de 24 horas hábiles. Si prefieres el teléfono,
            escríbenos por WhatsApp: suele ser lo más rápido.
          </p>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)]">
          {/* Datos directos */}
          <aside className="space-y-4">
            {wa && (
              <a
                href={whatsappUrl(wa, "Hola JayLu, quiero hacer una consulta")}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-solid btn-lg w-full"
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </a>
            )}

            <div className="card-dark p-5">
              <h2 className="mb-3 font-mono text-[0.64rem] font-bold tracking-[0.18em] uppercase">
                Datos
              </h2>
              <ul className="space-y-3 text-sm text-ink-200">
                {settings.address && (
                  <li className="flex gap-2.5">
                    <MapPin className="mt-0.5 size-4 shrink-0" />
                    <span>{settings.address}</span>
                  </li>
                )}
                {settings.phone && (
                  <li>
                    <a
                      href={`tel:${settings.phone.replace(/\s/g, "")}`}
                      className="link-underline flex gap-2.5"
                    >
                      <Phone className="mt-0.5 size-4 shrink-0" />
                      {settings.phone}
                    </a>
                  </li>
                )}
                {settings.email && (
                  <li>
                    <a
                      href={`mailto:${settings.email}`}
                      className="link-underline flex gap-2.5 break-all"
                    >
                      <Mail className="mt-0.5 size-4 shrink-0" />
                      {settings.email}
                    </a>
                  </li>
                )}
                {settings.instagram && (
                  <li>
                    <a
                      href={`https://instagram.com/${settings.instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="link-underline flex gap-2.5"
                    >
                      <InstagramGlyph className="mt-0.5 size-4 shrink-0" />
                      @{settings.instagram.replace(/^@/, "")}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <div className="card-dark p-5">
              <h2 className="mb-3 flex items-center gap-2 font-mono text-[0.64rem] font-bold tracking-[0.18em] uppercase">
                <Clock className="size-3.5" />
                Horario
              </h2>
              <dl className="space-y-1.5 text-sm">
                {[
                  ["Lunes a viernes", "9:00 – 18:00"],
                  ["Sábados", "10:00 – 14:00"],
                  ["Domingos", "cerrado"],
                ].map(([day, hours]) => (
                  <div key={day} className="flex justify-between gap-3">
                    <dt className="text-ink-400">{day}</dt>
                    <dd className="font-mono text-xs">{hours}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="hint">
              ¿Buscas el estado de un pedido?{" "}
              <Link href="/pedido/buscar" className="link-underline font-bold">
                Rastréalo aquí
              </Link>{" "}
              sin escribirnos.
            </p>
          </aside>

          {/* Formulario */}
          <div>
            <h2 className="mb-5 border-b border-ink-800 pb-3 font-display text-3xl">
              O escríbenos por aquí
            </h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}