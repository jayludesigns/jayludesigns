import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, MapPin, Phone, Save, Trash2 } from "lucide-react";

import { ActionForm } from "@/components/admin/ActionForm";
import { Card, PageHeader, Stat, StatGrid } from "@/components/admin/AdminUI";
import { Pill, StatePill } from "@/components/admin/Pill";
import {
  CheckField,
  SelectField,
  TagsField,
  TextAreaField,
  TextField,
} from "@/components/admin/Fields";
import {
  deleteCustomerAction,
  saveActivityAction,
  saveCustomerAction,
  toggleActivityAction,
} from "@/app/admin/actions";
import { getCustomerById } from "@/lib/data/customers";
import {
  CRM_KIND_LABELS,
  DESIGN_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type CrmActivityKind,
} from "@/lib/types";
import {
  formatDate,
  formatDateTime,
  formatVes,
  relativeTime,
  whatsappUrl,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

const KINDS = Object.keys(CRM_KIND_LABELS) as CrmActivityKind[];

export default async function CustomerDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const record = await getCustomerById(id);
  if (!record) notFound();

  const { customer, orders, activities, designs, total_spent_ves } = record;
  const paid = orders.filter((order) => order.payment_status === "paid");
  const open = orders.filter(
    (order) => !["delivered", "cancelled"].includes(order.status),
  );
  const sorted = [...orders].sort((a, b) => (b.created_at > a.created_at ? 1 : -1));

  return (
    <>
      <div className="mb-5">
        <Link href="/admin/clientes" className="btn btn-sm">
          <ChevronLeft className="size-3.5" />
          Clientes
        </Link>
      </div>

      <PageHeader
        title={customer.full_name}
        description={`Cliente desde ${formatDate(customer.created_at)}`}
        actions={
          customer.whatsapp ? (
            <a
              href={whatsappUrl(
                customer.whatsapp,
                `Hola ${customer.full_name.split(" ")[0]}, te escribe JayLu:`,
              )}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-sm"
            >
              WhatsApp
            </a>
          ) : undefined
        }
      />

      <StatGrid cols={4}>
        <Stat label="Pedidos" value={orders.length} />
        <Stat label="Facturado" value={formatVes(total_spent_ves)} sub={`${paid.length} pagados`} />
        <Stat
          label="Abiertos"
          value={open.length}
          tone={open.length > 0 ? "alert" : "plain"}
        />
        <Stat label="Diseños a medida" value={designs.length} />
      </StatGrid>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          {/* ---------- Historial ---------- */}
          <Card title={`Pedidos (${orders.length})`}>
            {orders.length === 0 ? (
              <p className="text-sm text-ink-600">
                Todavía no tiene pedidos. Puede ser un contacto del formulario o
                una cotización en curso.
              </p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {sorted.map((order) => (
                  <li key={order.id} className="py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="font-mono text-xs font-bold hover:underline"
                      >
                        {order.order_number}
                      </Link>
                      <div className="flex items-center gap-2">
                        <StatePill
                          state={order.status}
                          label={ORDER_STATUS_LABELS[order.status]}
                        />
                        {order.payment_status === "pending" && (
                          <Pill tone="outline">
                            {PAYMENT_STATUS_LABELS[order.payment_status]}
                          </Pill>
                        )}
                        <span className="font-mono text-xs font-bold tabular">
                          {formatVes(order.total_ves)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {formatDate(order.created_at)} ·{" "}
                      {order.items.reduce((acc, item) => acc + item.quantity, 0)} unidades
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* ---------- Diseños ---------- */}
          {designs.length > 0 && (
            <Card title={`Diseños a medida (${designs.length})`}>
              <ul className="divide-y divide-ink-100">
                {designs.map((design) => (
                  <li key={design.id} className="flex items-center gap-3 py-2.5">
                    {design.reference_urls[0] && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={design.reference_urls[0]}
                        alt=""
                        className="size-10 shrink-0 border border-ink-200 object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/disenos/${design.id}`}
                        className="block truncate text-sm font-semibold hover:underline"
                      >
                        {design.name ?? design.code}
                      </Link>
                      <span className="font-mono text-[0.62rem] text-ink-500">
                        {design.code} · {relativeTime(design.created_at)}
                      </span>
                    </div>
                    <StatePill
                      state={design.status}
                      label={DESIGN_STATUS_LABELS[design.status]}
                    />
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* ---------- CRM ---------- */}
          <Card
            title={`Seguimiento (${activities.length})`}
            hint="Llamadas, mensajes, visitas y tareas pendientes"
          >
            {activities.length === 0 ? (
              <p className="text-sm text-ink-600">Nada anotado todavía.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {activities.map((activity) => (
                  <li key={activity.id} className="flex items-start gap-3 py-2.5">
                    <ActionForm
                      action={toggleActivityAction}
                      hiddenFields={{
                        id: activity.id,
                        is_done: activity.is_done ? "" : "1",
                      }}
                    >
                      <button
                        type="submit"
                        title={activity.is_done ? "Reabrir" : "Marcar como hecha"}
                        className={`mt-0.5 size-4 shrink-0 border-2 border-ink-300 ${
                          activity.is_done ? "bg-ember-600" : "bg-paper"
                        }`}
                        aria-pressed={activity.is_done}
                      >
                        <span className="sr-only">
                          {activity.is_done ? "Reabrir tarea" : "Completar tarea"}
                        </span>
                      </button>
                    </ActionForm>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{activity.title ?? CRM_KIND_LABELS[activity.kind]}</p>
                      {activity.body && (
                        <p className="text-xs leading-relaxed text-ink-600">{activity.body}</p>
                      )}
                      <p className="font-mono text-[0.62rem] text-ink-500">
                        {CRM_KIND_LABELS[activity.kind]} ·{" "}
                        {formatDateTime(activity.created_at)}
                        {activity.due_at && !activity.is_done && (
                          <> · para el {formatDate(activity.due_at)}</>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <ActionForm
              action={saveActivityAction}
              hiddenFields={{ customer_id: customer.id }}
              submitLabel="Añadir nota"
              submitClassName="btn btn-sm btn-solid mt-4"
            >
              <div className="grid gap-2 border-t border-ink-200 pt-4 sm:grid-cols-[9rem_minmax(0,1fr)_9rem]">
                <SelectField
                  name="kind"
                  label="Tipo"
                  value="note"
                  options={KINDS.map((kind) => ({
                    value: kind,
                    label: CRM_KIND_LABELS[kind],
                  }))}
                />
                <TextField
                  name="title"
                  label="Título"
                  placeholder="Llamó por el hoodie de la empresa"
                />
                <TextField name="due_at" label="Para el" type="date" />
              </div>
              <div className="mt-2">
                <TextAreaField name="body" label="Detalle" rows={2} />
              </div>
            </ActionForm>
          </Card>
        </div>

        {/* ---------- Lateral ---------- */}
        <aside className="space-y-4">
          <Card title="Datos">
            <ActionForm
              action={saveCustomerAction}
              submitLabel="Guardar"
              submitIcon={<Save className="size-4" />}
              submitClassName="btn btn-sm btn-solid mt-4"
            >
              <input type="hidden" name="id" value={customer.id} />
              <div className="space-y-3">
                <TextField name="full_name" label="Nombre" value={customer.full_name} required />
                <TextField
                  name="phone"
                  label="Teléfono"
                  value={customer.phone}
                  inputMode="tel"
                />
                <TextField
                  name="whatsapp"
                  label="WhatsApp"
                  value={customer.whatsapp}
                  inputMode="tel"
                />
                <TextField
                  name="email"
                  label="Correo"
                  type="email"
                  value={customer.email}
                />
                <TextField
                  name="document_id"
                  label="Cédula"
                  value={customer.document_id}
                  inputClassName="font-mono text-xs"
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextField name="city" label="Ciudad" value={customer.city} />
                  <TextField name="state" label="Estado" value={customer.state} />
                </div>
                <TextField name="address" label="Dirección" value={customer.address} />
                <TagsField
                  name="tags"
                  label="Etiquetas"
                  values={customer.tags}
                />
                <TextAreaField
                  name="notes"
                  label="Notas"
                  rows={3}
                  value={customer.notes}
                />
                <CheckField
                  name="marketing_opt_in"
                  label="Acepta novedades"
                  defaultChecked={customer.marketing_opt_in}
                />
              </div>
            </ActionForm>

            <div className="mt-4 border-t border-ink-200 pt-4">
              <ActionForm
                action={deleteCustomerAction}
                hiddenFields={{ id: customer.id }}
                confirm={`Se elimina a ${customer.full_name}. Los pedidos quedan sin cliente asignado.`}
              >
                <button type="submit" className="btn btn-sm w-full">
                  <Trash2 className="size-3.5" />
                  Eliminar cliente
                </button>
              </ActionForm>
            </div>
          </Card>

          <Card title="Contacto rápido">
            <ul className="space-y-2 text-sm">
              {customer.phone && (
                <li>
                  <a
                    href={`tel:${customer.phone.replace(/\s/g, "")}`}
                    className="link-underline flex items-center gap-2"
                  >
                    <Phone className="size-3.5" />
                    {customer.phone}
                  </a>
                </li>
              )}
              {customer.email && (
                <li>
                  <a
                    href={`mailto:${customer.email}`}
                    className="link-underline flex items-center gap-2 break-all"
                  >
                    <Mail className="size-3.5" />
                    {customer.email}
                  </a>
                </li>
              )}
              {(customer.address || customer.city) && (
                <li className="flex items-start gap-2 text-ink-600">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    {[customer.address, customer.city, customer.state]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </li>
              )}
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}
