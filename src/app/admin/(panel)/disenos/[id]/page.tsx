import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, Phone, Save } from "lucide-react";

import { ActionForm } from "@/components/admin/ActionForm";
import { Card, PageHeader } from "@/components/admin/AdminUI";
import { StatePill } from "@/components/admin/Pill";
import { SelectField, TextAreaField, TextField } from "@/components/admin/Fields";
import { deleteDesignAction, updateDesignAction } from "@/app/admin/actions";
import { getDesigns } from "@/lib/data/designs";
import { getOrders } from "@/lib/data/orders";
import { DESIGN_STATUS_LABELS, type DesignStatus } from "@/lib/types";
import {
  formatDate,
  formatDateTime,
  formatVes,
  relativeTime,
  whatsappUrl,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

const STATUSES: DesignStatus[] = [
  "new",
  "quoting",
  "approved",
  "in_design",
  "production",
  "ready",
  "delivered",
  "rejected",
];

export default async function DesignDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const [designs, orders] = await Promise.all([getDesigns({}), getOrders({ limit: 200 })]);
  const design = designs.find((candidate) => candidate.id === id);
  if (!design) notFound();

  const linkedOrder = design.order_id
    ? orders.find((order) => order.id === design.order_id)
    : null;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/disenos" className="btn btn-sm">
          <ChevronLeft className="size-3.5" />
          Diseños
        </Link>
        <ActionForm
          action={deleteDesignAction}
          hiddenFields={{ id: design.id }}
          confirm={`Se elimina la solicitud ${design.code}.`}
        >
          <button type="submit" className="btn btn-sm">
            Eliminar
          </button>
        </ActionForm>
      </div>

      <PageHeader
        title={design.name ?? "Solicitud sin título"}
        description={`${design.code} · recibida ${formatDateTime(design.created_at)} · ${relativeTime(design.created_at)}`}
        actions={
          <StatePill state={design.status} label={DESIGN_STATUS_LABELS[design.status]} />
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {/* ---------- Referencias ---------- */}
          <Card
            title={`Referencias del cliente (${design.reference_urls.length})`}
            hint="Lo que nos mandó para entender qué quiere"
          >
            {design.reference_urls.length === 0 ? (
              <p className="text-sm text-ink-600">
                No subió ninguna foto: la solicitud viene solo con la
                descripción de abajo.
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {design.reference_urls.map((url, index) => (
                  <li key={`${url}-${index}`}>
                    <a href={url} target="_blank" rel="noreferrer noopener" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Referencia ${index + 1}`}
                        className="aspect-square w-full rounded-xl border border-ink-200 object-cover transition-opacity hover:opacity-80"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* ---------- Lo que pidió ---------- */}
          <Card title="Lo que pidió el cliente">
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {design.description ?? (
                <span className="italic text-ink-500">
                  Sin descripción: se sacó todo de las fotos.
                </span>
              )}
            </p>

            <dl className="mt-4 grid gap-3 border-t border-ink-200 pt-4 sm:grid-cols-2">
              {[
                ["Cantidad", design.quantity > 0 ? `${design.quantity} unidades` : "—"],
                ["Tipo de prenda", design.garment_type ?? "—"],
                ["Tallas", design.sizes.length > 0 ? design.sizes.join(" · ") : "—"],
                ["Colores", design.colors.length > 0 ? design.colors.join(" · ") : "—"],
                ["Estilo pedido", design.style_preference ?? "—"],
                ["Fecha límite", design.deadline ? formatDate(design.deadline) : "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-b border-ink-100 pb-2 text-sm">
                  <dt className="text-ink-600">{label}</dt>
                  <dd className="text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* ---------- Gestión ---------- */}
          <Card title="Seguimiento">
            <ActionForm
              action={updateDesignAction}
              submitLabel="Guardar"
              submitIcon={<Save className="size-4" />}
              submitClassName="btn btn-sm btn-solid mt-4"
            >
              <input type="hidden" name="id" value={design.id} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SelectField
                  name="status"
                  label="Estado"
                  value={design.status}
                  options={STATUSES.map((item) => ({
                    value: item,
                    label: DESIGN_STATUS_LABELS[item],
                  }))}
                />
                <TextField
                  name="name"
                  label="Título"
                  value={design.name ?? ""}
                  placeholder="Uniforme de 4to B"
                />
                <TextField
                  name="quantity"
                  label="Cantidad"
                  type="number"
                  value={design.quantity}
                />
                <TextField
                  name="deadline"
                  label="Fecha límite"
                  type="date"
                  value={design.deadline?.slice(0, 10) ?? ""}
                />
              </div>

              <div className="mt-3">
                <TextField
                  name="quoted_price_ves"
                  label="Cotización (Bs)"
                  type="number"
                  value={design.quoted_price_ves ?? ""}
                  hint="Lo que le vas a cobrar. No aparece en la tienda: se comparte por WhatsApp o correo."
                />
              </div>

              <div className="mt-3">
                <TextAreaField
                  name="admin_notes"
                  label="Notas internas"
                  rows={4}
                  value={design.admin_notes}
                  placeholder="Precio de la tela, reminders, quién la cotizó…"
                />
              </div>
            </ActionForm>
          </Card>
        </div>

        {/* ---------- Lateral ---------- */}
        <aside className="space-y-4">
          <Card title="Contacto">
            <p className="font-display text-xl">{design.contact_name ?? "Sin nombre"}</p>

            <ul className="mt-2 space-y-1.5 text-sm">
              {design.contact_phone && (
                <li>
                  <a
                    href={`tel:${design.contact_phone.replace(/\s/g, "")}`}
                    className="link-underline flex items-center gap-2"
                  >
                    <Phone className="size-3.5" />
                    {design.contact_phone}
                  </a>
                </li>
              )}
              {design.contact_email && (
                <li>
                  <a
                    href={`mailto:${design.contact_email}`}
                    className="link-underline flex items-center gap-2 break-all"
                  >
                    <Mail className="size-3.5" />
                    {design.contact_email}
                  </a>
                </li>
              )}
            </ul>

            {design.contact_phone && (
              <a
                href={whatsappUrl(
                  design.contact_phone,
                  `Hola ${design.contact_name ?? ""}, sobre tu solicitud ${design.code} de JayLu:`,
                )}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-sm mt-3 w-full"
              >
                Escribir por WhatsApp
              </a>
            )}

            {design.customer_id && (
              <Link
                href={`/admin/clientes/${design.customer_id}`}
                className="link-underline mt-2 block text-center text-xs"
              >
                Ver ficha del cliente
              </Link>
            )}
          </Card>

          {linkedOrder && (
            <Card title="Pedido asociado">
              <Link
                href={`/admin/pedidos/${linkedOrder.id}`}
                className="font-mono text-sm font-bold hover:underline"
              >
                {linkedOrder.order_number}
              </Link>
              <p className="mt-1 text-xs text-ink-600">
                {formatVes(linkedOrder.total_ves)} · {linkedOrder.items.length} líneas
              </p>
            </Card>
          )}

          <Card title="Historial">
            <p className="text-sm text-ink-600">
              Creada {formatDate(design.created_at)}.
            </p>
            <p className="text-sm text-ink-600">
              Última modificación {formatDate(design.updated_at)}.
            </p>
            {design.admin_notes && (
              <p className="mt-3 border-l-2 border-ink-300 pl-3 text-xs leading-relaxed whitespace-pre-line">
                {design.admin_notes}
              </p>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
