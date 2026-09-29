import type { Metadata } from "next";
import { CartClient } from "@/components/cart/CartClient";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { getStoreSettings } from "@/lib/db";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisa tu pedido antes de pagar.",
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const settings = await getStoreSettings();

  return (
    <div className="relative overflow-hidden bg-ink-950">
      <div className="halftone-light absolute inset-0 opacity-[0.04]" aria-hidden />
      <div className="wrap relative py-8">
        <Breadcrumbs
          invert
          items={[
            { href: "/", label: "Inicio" },
            { href: "/carrito", label: "Carrito" },
          ]}
        />
        <h1 className="mt-5 text-4xl sm:text-5xl">Tu carrito</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-300">
          Los precios se confirman al registrar el pedido, con la tasa BCV del
          momento. Puedes cambiar la moneda arriba a la derecha.
        </p>

        <div className="mt-8">
          <CartClient
            shippingFlat={settings.shipping_flat_ves}
            freeOver={settings.free_shipping_over_ves}
            whatsapp={settings.whatsapp}
          />
        </div>
      </div>
    </div>
  );
}