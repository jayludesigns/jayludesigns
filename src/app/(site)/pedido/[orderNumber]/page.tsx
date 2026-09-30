import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ClipboardCopy,
  CreditCard,
  MapPin,
  Package,
  Phone,
  Truck,
} from "lucide-react";
import { getOrderByNumber, verifyOrderToken } from "@/lib/data/orders";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PriceDisplay } from "@/components/currency/PriceDisplay";
import { PrintButton } from "@/components/ui/PrintButton";
import { getStoreSettings } from "@/lib/db";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/types";
import { cn, formatDate, formatDateTime, formatVes, whatsappUrl } from "@/lib/utils";

type Params = Promise<{ orderNumber: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export const metadata: Metadata = {
  title: "Tu pedido",
  robots: { index: false, follow: false },
};

/** Recorrido que se muestra como barra de progreso. */
const TRACK: { status: OrderStatus; label: string }[] = [
  { status: "pending_payment", label: "Pedido registrado" },
  { status: "paid", label: "Pago confirmado" },
  { status: "in_production", label: "En producción" },
  { status: "ready", label: "Listo" },
  { status: "shipped", label: "Enviado" },
  { status: "delivered", label: "Entregado" },
];

export default async function OrderPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { orderNumber } = await params;
  const query = await searchParams;
  const token = typeof query.t === "string" ? query.t : undefined;

  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();
  if (!verifyOrderToken(token, order)) notFound();

  const settings = await getStoreSettings();
  const cancelled = order.status === "cancelled";
  const currentIndex = TRACK.findIndex((step) => step.status === order.status);
  const paid = order.payment_status === "paid";

  return (
    <div className="wrap py-8">
      <Breadcrumbs
        items={[
          { href: "/", label: "Inicio" },
          { href: "/pedido/buscar", label: "Rastrear pedido" },
          { href: `/pedido/${order.order_number}`, label: order.order_number },
        ]}
      />

      {/* ---------- Cabecera ---------- */}
      <header
        className={cn(
          "mt-5 card p-6 sm:p-8",
          cancelled && "bg-ink-50",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.2em] uppercase">
              {cancelled ? (
                <>Pedido cancelado</>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  Pedido registrado
                </>
              )}
            </p>
            <h1 className="mt-2 font-mono text-3xl sm:text-4xl">{order.order_number}</h1>
            <p className="mt-2 text-sm text-ink-600">
              {formatDateTime(order.created_at)} · Total{" "}
              {PAYMENT_STATUS_LABELS[order.payment_status]}
            </p>
          </div>
          <div className="text-right">
            <PriceDisplay
              ves={order.total_ves}
              size="xl"
              align="right"
              rate={order.bcv_rate}
            />
            <p className="mt-1 font-mono text-[0.62rem] text-ink-500">
              Tasa del pedido: {formatVes(order.bcv_rate, "Bs/€", false)}
            </p>
          </div>
        </div>
      </header>

      {/* ---------- Barra de seguimiento ---------- */}
      {!cancelled && (
        <section className="mt-6 card p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl">
            <Truck className="size-4" />
            Dónde está tu pedido
          </h2>
          <ol className="grid gap-2 sm:grid-cols-6">
            {TRACK.map((step, index) => {
              const done = currentIndex >= 0 && index <= currentIndex;
              return (
                <li key={step.status} className="flex items-center gap-2 sm:block">
                  <span
                    className={cn(
                      "h-1 w-full shrink-0 sm:mb-2",
                      done ? "bg-ember-600" : "bg-ink-200",
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "font-mono text-[0.6rem] tracking-wider uppercase",
                      done ? "font-bold" : "text-ink-500",
                    )}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
          {order.status === "pending_payment" && (
            <p className="mt-4 rounded-xl border border-ink-200 bg-ink-50 p-3 text-sm">
              Te enviamos los datos para pagar por{" "}
              {PAYMENT_METHOD_LABELS[order.payment_method ?? "otro"] ?? "el método que elegiste"}.
              En cuanto confirmes, el pedido pasa a producción.
            </p>
          )}
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ---------- Detalle ---------- */}
        <div>
          <section className="card overflow-hidden">
            <h2 className="flex items-center gap-2 border-b border-ink-200 px-4 py-2.5 font-mono text-[0.64rem] font-bold tracking-[0.18em] uppercase">
              <Package className="size-3.5" />
              Lo que pediste
            </h2>
            <ul className="divide-y divide-ink-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0">
                    {item.product_id ? (
                      <Link
                        href={`/catalogo`}
                        className="font-display text-lg leading-tight hover:underline"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <p className="font-display text-lg leading-tight">{item.name}</p>
                    )}
                    <p className="mt-0.5 font-mono text-[0.64rem] text-ink-500">
                      {item.variant_label}
                      {item.sku ? ` · ${item.sku}` : ""}
                    </p>
                    <p className="mt-1 font-mono text-[0.64rem] text-ink-500">
                      {item.quantity} ×{" "}
                      <PriceDisplay
                        ves={item.unit_price_ves}
                        size="sm"
                        inline
                        rate={order.bcv_rate}
                        className="[&>span]:font-mono [&>span]:text-[0.64rem]"
                      />
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <PriceDisplay
                      ves={item.subtotal_ves}
                      size="sm"
                      inline
                      rate={order.bcv_rate}
                      className="font-semibold"
                    />
                    {item.discount_ves > 0 && (
                      <p className="font-mono text-[0.62rem] text-ink-500">
                        −
                        <PriceDisplay
                          ves={item.discount_ves}
                          size="sm"
                          inline
                          rate={order.bcv_rate}
                          className="[&>span]:font-mono [&>span]:text-[0.62rem]"
                        />
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-ink-200 p-4 text-sm">
              <Row
                label="Subtotal"
                value={
                  <PriceDisplay
                    ves={order.items_subtotal_ves}
                    size="sm"
                    inline
                    rate={order.bcv_rate}
                    className="font-semibold"
                  />
                }
              />
              {order.discount_ves > 0 && (
                <Row
                  label={`Descuento${order.coupon_code ? ` (${order.coupon_code})` : ""}`}
                  value={
                    <span className="font-semibold">
                      −
                      <PriceDisplay
                        ves={order.discount_ves}
                        size="sm"
                        inline
                        rate={order.bcv_rate}
                        className="font-semibold"
                      />
                    </span>
                  }
                />
              )}
              <Row
                label="Envío"
                value={
                  order.shipping_ves === 0 ? (
                    "Gratis"
                  ) : (
                    <PriceDisplay
                      ves={order.shipping_ves}
                      size="sm"
                      inline
                      rate={order.bcv_rate}
                      className="font-semibold"
                    />
                  )
                }
              />
              <div className="flex justify-between border-t border-ink-200 pt-2 font-bold">
                <dt>Total</dt>
                <dd>
                  <PriceDisplay
                    ves={order.total_ves}
                    size="sm"
                    inline
                    rate={order.bcv_rate}
                    className="font-bold"
                  />
                </dd>
              </div>
            </dl>
          </section>

          {order.notes && (
            <section className="mt-4 card p-4">
              <h3 className="font-mono text-[0.64rem] font-bold tracking-[0.18em] uppercase">
                Tus notas
              </h3>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-ink-700">
                {order.notes}
              </p>
            </section>
          )}
        </div>

        {/* ---------- Lateral ---------- */}
        <aside className="space-y-4">
          <div className="card p-4">
            <h3 className="mb-3 flex items-center gap-2 font-mono text-[0.64rem] font-bold tracking-[0.18em] uppercase">
              <MapPin className="size-3.5" />
              Entrega
            </h3>
            {order.shipping_address ? (
              <address className="text-sm leading-relaxed not-italic">
                <span className="block font-bold">{order.customer_name}</span>
                {order.shipping_address.address}
                <br />
                {order.shipping_address.city}, {order.shipping_address.state}
                {order.shipping_address.zip ? ` · ${order.shipping_address.zip}` : ""}
                <br />
                {order.customer_phone}
              </address>
            ) : (
              <p className="text-sm text-ink-600">Recogida en JayLu.</p>
            )}
          </div>

          <div className="card p-4">
            <h3 className="mb-3 flex items-center gap-2 font-mono text-[0.64rem] font-bold tracking-[0.18em] uppercase">
              <CreditCard className="size-3.5" />
              Pago
            </h3>
            <p className="text-sm font-bold">
              {PAYMENT_METHOD_LABELS[order.payment_method ?? "otro"] ?? "—"}
            </p>
            <p className="mt-0.5 text-sm text-ink-600">
              {PAYMENT_STATUS_LABELS[order.payment_status]}
            </p>
            {order.payment_ref && (
              <p className="mt-2 font-mono text-xs">
                Ref: {order.payment_ref}
              </p>
            )}
            {paid && order.paid_at && (
              <p className="mt-2 font-mono text-[0.64rem] text-ink-500">
                Confirmado el {formatDate(order.paid_at)}
              </p>
            )}
          </div>

          {settings.whatsapp && (
            <a
              href={whatsappUrl(
                settings.whatsapp,
                `Hola JayLu, quiero consultar mi pedido ${order.order_number}`,
              )}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-solid w-full"
            >
              <Phone className="size-4" />
              Consultar por WhatsApp
            </a>
          )}

          <div className="flex gap-2">
            <PrintButton />
            <Link href="/catalogo" className="btn btn-sm flex-1">
              Seguir comprando
            </Link>
          </div>

          <p className="hint">
            <ClipboardCopy className="mr-1 inline size-3" />
            Guarda este enlace: con él vuelves a ver el pedido cuando quieras.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-600">{label}</dt>
      <dd className="font-semibold tabular">{value}</dd>
    </div>
  );
}
