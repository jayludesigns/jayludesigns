import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { getStoreSettings } from "@/lib/db";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  description: "Registra tu pedido y elige cómo pagar.",
  robots: { index: false, follow: false },
};

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function CheckoutPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const raw = params.cupon;
  const couponCode = (Array.isArray(raw) ? raw[0] : raw)?.trim().toUpperCase() ?? "";
  const settings = await getStoreSettings();

  return (
    <div className="wrap py-8">
      <Breadcrumbs
        items={[
          { href: "/", label: "Inicio" },
          { href: "/carrito", label: "Carrito" },
          { href: "/checkout", label: "Finalizar pedido" },
        ]}
      />
      <h1 className="mt-5 text-4xl sm:text-5xl">Finalizar pedido</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-600">
        Todavía no se cobra nada. Registras el pedido, te enviamos los datos
        para pagar y empezamos a producir cuando confirmes.
      </p>

      <div className="mt-8">
        <CheckoutClient
          couponCode={couponCode}
          payments={{
            bank_name: settings.bank_name,
            bank_account_type: settings.bank_account_type,
            bank_account_number: settings.bank_account_number,
            bank_account_name: settings.bank_account_name,
            pago_movil_phone: settings.pago_movil_phone,
            zelle_name: settings.zelle_name,
            zelle_phone: settings.zelle_phone,
            binance_email: settings.binance_email,
            binance_pay_id: settings.binance_pay_id,
          }}
          shippingFlat={settings.shipping_flat_ves}
          freeOver={settings.free_shipping_over_ves}
          whatsapp={settings.whatsapp}
        />
      </div>
    </div>
  );
}
