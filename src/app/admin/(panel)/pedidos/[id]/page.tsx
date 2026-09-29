import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Phone, Save, User } from "lucide-react";

import { ActionForm } from "@/components/admin/ActionForm";
import { Card, PageHeader } from "@/components/admin/AdminUI";
import { Pill, StatePill } from "@/components/admin/Pill";
import { SelectField, TextAreaField, TextField } from "@/components/admin/Fields";
import { PrintButton } from "@/components/ui/PrintButton";
import { updateOrderAction } from "@/app/admin/actions";
import { canTransition, getOrders } from "@/lib/data/orders";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/types";
import { formatDateTime, formatVes, whatsappUrl } from "@/lib/utils";
import { getStoreSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

const FLOW: OrderStatus[] = [
  "draft",
  "pending_payment",
  "paid",
  "in_production",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
];

export default async function AdminOrderPage({ params }: { params: Params }) {
  const { id } = await params;
  const [all, settings] = await Promise.all([getOrders({ limit: 200 }), getStoreSettings()]);
  const order = all.find((candidate) => candidate.id === id);
  if (!order) notFound();

  const reachable = FLOW.filter(
    (status) => status === order.status || canTransition(order.status, status),
  ).filter((status) => status !== "cancelled" || order.status === "cancelled");

  const totalUnits = order.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/pedidos" className="btn btn-sm">
          <ChevronLeft className="size-3.5" />
          Pedidos
        </Link>
        <PrintButton label="Imprimir" />
      </div>

      <PageHeader
        title={order.order_number}
        description={`${order.customer_name} · ${formatDateTime(order.created_at)}`}
        actions={
          <>
            <StatePill state={order.status} label={ORDER_STATUS_LABELS[order.status]} />
            <StatePill
              state={order.payment_status}
              label={PAYMENT_STATUS_LABELS[order.payment_status]}
            />
          </>
        }
      />

      {/* ---------- Barra de estado ---------- */}
      <Card title="Estado del pedido" hint="Solo se ofrecen los saltos permitidos.">
        <ol className="flex flex-wrap items-center gap-1.5">
          {FLOW.filter((status) => status !== "cancelled").map((status) => {
            const index = FLOW.indexOf(order.status);
            const here = FLOW.indexOf(status);
            const done = order.status !== "cancelled" && here <= index;
            const current = order.status === status;
            return (
              <li key={status} className="flex items-center gap-1.5">
                <span
                  className={`border px-2 py-1 font-mono text-[0.62rem] tracking-wider uppercase ${
                    current
                      ? "border-ember-600 bg-ember-600 text-paper"
                      : done
                        ? "border-ink-300"
                        : "border-ink-200 text-ink-500"
                  }`}
                >
                  {ORDER_STATUS_LABELS[status]}
                </span>
                {status !== "delivered" && <span className="text-ink-300">→</span>}
              </li>
            );
          })}
        </ol>

        <ActionForm
          action={updateOrderAction}
          hiddenFields={{ id: order.id }}
          submitLabel="Guardar cambios"
          submitIcon={<Save className="size-4" />}
          submitClassName="btn btn-sm btn-solid mt-4"
          className="mt-4 grid gap-3 border-t border-ink-200 pt-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <SelectField
            name="status"
            label="Estado"
            value={order.status}
            options={reachable.map((status) => ({
              value: status,
              label: ORDER_STATUS_LABELS[status],
            }))}
          />
          <SelectField
            name="payment_status"
            label="Pago"
            value={order.payment_status}
            options={(["pending", "paid", "refunded", "failed"] as const).map((status) => ({
              value: status,
              label: PAYMENT_STATUS_LABELS[status],
            }))}
          />
          <SelectField
            name="payment_method"
            label="Método"
            value={order.payment_method}
            placeholder="Sin método"
            options={(Object.keys(PAYMENT_METHOD_LABELS) as (keyof typeof PAYMENT_METHOD_LABELS)[]).map(
              (method) => ({ value: method, label: PAYMENT_METHOD_LABELS[method] }),
            )}
          />
          <TextField
            name="payment_ref"
            label="Referencia del pago"
            value={order.payment_ref}
            placeholder="Referencia bancaria"
          />
        </ActionForm>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {/* ---------- Artículos ---------- */}
          <Card title={`Artículos (${totalUnits} unidades)`}>
            <div className="-mx-4 -my-4 overflow-x-auto">
              <table className="table-admin w-full min-w-xl">
                <thead>
                  <tr>
                    <th>Prenda</th>
                    <th>Variante</th>
                    <th className="text-right">Precio</th>
                    <th className="text-center">Cant.</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="font-mono text-[0.62rem] text-ink-500">
                          {item.sku ?? "—"}
                          {item.custom_design_id ? " · diseño a medida" : ""}
                        </p>
                      </td>
                      <td className="text-xs">{item.variant_label ?? "—"}</td>
                      <td className="text-right font-mono text-xs tabular">
                        {formatVes(item.unit_price_ves)}
                      </td>
                      <td className="text-center font-mono text-xs font-bold">
                        {item.quantity}
                      </td>
                      <td className="text-right font-mono text-xs font-bold tabular">
                        {formatVes(item.subtotal_ves)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-4 space-y-1.5 border-t border-ink-200 pt-3 text-sm">
              {[
                ["Subtotal", formatVes(order.items_subtotal_ves)],
                [
                  `Descuento${order.coupon_code ? ` (${order.coupon_code})` : ""}`,
                  `−${formatVes(order.discount_ves)}`,
                ],
                ["Envío", order.shipping_ves === 0 ? "Gratis" : formatVes(order.shipping_ves)],
                ["Total", formatVes(order.total_ves)],
              ]
                .filter(([label]) => label !== "Descuento" || order.discount_ves > 0)
                .map(([label, value], index, all_) => (
                  <div
                    key={label}
                    className={`flex justify-between ${
                      index === all_.length - 1 ? "border-t border-ink-200 pt-2 text-base font-bold" : ""
                    }`}
                  >
                    <dt className="text-ink-600">{label}</dt>
                    <dd className="tabular">{value}</dd>
                  </div>
                ))}
            </dl>
            <p className="mt-2 font-mono text-[0.64rem] text-ink-500">
              Tasa del pedido: 1 € = {formatVes(order.bcv_rate, "Bs", false)} ·{" "}
              {formatVes(order.total_eur, "€")} al momento de la compra
            </p>
          </Card>

          {/* ---------- Notas ---------- */}
          <Card title="Notas">
            {order.notes && (
              <div className="mb-4">
                <p className="label">Del cliente</p>
                <p className="border-l-2 border-ink-300 pl-3 text-sm leading-relaxed whitespace-pre-line">
                  {order.notes}
                </p>
              </div>
            )}

            <ActionForm
              action={updateOrderAction}
              hiddenFields={{ id: order.id }}
              submitLabel="Guardar notas"
              submitIcon={<Save className="size-4" />}
              submitClassName="btn btn-sm btn-solid mt-3"
            >
              <input type="hidden" name="status" value={order.status} />
              <TextAreaField
                name="internal_notes"
                label="Notas internas"
                rows={4}
                value={order.internal_notes}
                placeholder="Lo que el taller necesita saber: producción, medida, novedad."
                hint="El cliente no ve esto."
              />
            </ActionForm>
          </Card>
        </div>

        {/* ---------- Lateral ---------- */}
        <aside className="space-y-4">
          <Card title="Cliente">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl border border-ink-200">
                <User className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{order.customer_name}</p>
                {order.customer_id ? (
                  <Link
                    href={`/admin/clientes/${order.customer_id}`}
                    className="font-mono text-[0.64rem] underline"
                  >
                    Ver ficha
                  </Link>
                ) : (
                  <span className="font-mono text-[0.64rem] text-ink-500">
                    invitado (sin cuenta)
                  </span>
                )}
              </div>
            </div>

            <ul className="mt-3 space-y-1.5 text-sm">
              {order.customer_phone && (
                <li>
                  <a
                    href={`tel:${order.customer_phone.replace(/\s/g, "")}`}
                    className="link-underline flex items-center gap-2"
                  >
                    <Phone className="size-3.5" />
                    {order.customer_phone}
                  </a>
                </li>
              )}
              {order.customer_email && (
                <li>
                  <a href={`mailto:${order.customer_email}`} className="link-underline break-all">
                    {order.customer_email}
                  </a>
                </li>
              )}
              {order.customer_phone && (
                <li>
                  <a
                    href={whatsappUrl(
                      order.customer_phone,
                      `Hola ${order.customer_name}, sobre tu pedido ${order.order_number} de JayLu:`,
                    )}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="link-underline font-semibold"
                  >
                    Escribir por WhatsApp
                  </a>
                </li>
              )}
            </ul>

            {order.shipping_address && (
              <div className="mt-3 border-t border-ink-200 pt-3">
                <p className="mb-1 flex items-center gap-2 font-mono text-[0.62rem] tracking-wider uppercase">
                  <MapPin className="size-3" />
                  Entrega
                </p>
                <address className="text-sm leading-relaxed not-italic">
                  {order.shipping_address.address}
                  <br />
                  {order.shipping_address.city}, {order.shipping_address.state}
                  {order.shipping_address.zip ? ` · ${order.shipping_address.zip}` : ""}
                  {order.shipping_address.notes && (
                    <>
                      <br />
                      <span className="text-ink-600">{order.shipping_address.notes}</span>
                    </>
                  )}
                </address>
              </div>
            )}
          </Card>

          <Card title="Pago">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-600">Estado</dt>
                <dd>
                  <Pill
                    tone={order.payment_status === "paid" ? "solid" : "outline"}
                  >
                    {PAYMENT_STATUS_LABELS[order.payment_status]}
                  </Pill>
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-600">Método</dt>
                <dd className="text-right font-semibold">
                  {order.payment_method
                    ? PAYMENT_METHOD_LABELS[order.payment_method]
                    : "—"}
                </dd>
              </div>
              {order.payment_ref && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-600">Referencia</dt>
                  <dd className="font-mono text-xs">{order.payment_ref}</dd>
                </div>
              )}
              {order.paid_at && (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-600">Confirmado</dt>
                  <dd className="text-xs">{formatDateTime(order.paid_at)}</dd>
                </div>
              )}
            </dl>

            {order.payment_status !== "paid" && (
              <p className="mt-3 rounded-xl border border-ink-200 p-2.5 text-xs">
                Al marcarlo pagado se descuenta el stock reservado y queda
                registrada la fecha de confirmación.
              </p>
            )}
          </Card>

          {settings.whatsapp && order.customer_phone && (
            <a
              href={whatsappUrl(
                settings.whatsapp,
                `Hola ${order.customer_name}, te escribimos de JayLu por el pedido ${order.order_number}.`,
              )}
              target="_blank"
              rel="noreferrer noopener"
              className="btn w-full"
            >
              Avisar al cliente
            </a>
          )}
        </aside>
      </div>
    </>
  );
}
