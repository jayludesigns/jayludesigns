import Link from "next/link";
import { CalendarClock, Phone, Plus, TriangleAlert } from "lucide-react";

import { ActionForm } from "@/components/admin/ActionForm";
import {
  Card,
  Empty,
  PageHeader,
  Stat,
  StatGrid,
} from "@/components/admin/AdminUI";
import { StatePill } from "@/components/admin/Pill";
import { SelectField, TextAreaField, TextField } from "@/components/admin/Fields";
import {
  saveActivityAction,
  saveLeadAction,
  setLeadStatusAction,
  toggleActivityAction,
} from "@/app/admin/actions";
import {
  getAllActivities,
  getCrmSummary,
  getCustomers,
  getLeads,
  getPendingTasks,
} from "@/lib/data/customers";
import {
  CRM_KIND_LABELS,
  LEAD_STATUS_LABELS,
  type CrmActivityKind,
  type LeadStatus,
} from "@/lib/types";
import { formatDate, formatDateTime, isOverdue, relativeTime, whatsappUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUSES = Object.keys(LEAD_STATUS_LABELS) as LeadStatus[];
const KINDS = Object.keys(CRM_KIND_LABELS) as CrmActivityKind[];

const LEAD_SOURCES = [
  "web",
  "contacto",
  "diseno",
  "referido",
  "redes",
  "repartidor",
  "otro",
];

export default async function AdminCrmPage() {
  const [summary, leads, tasks, history, customers] = await Promise.all([
    getCrmSummary(),
    getLeads("todos"),
    getPendingTasks(),
    getAllActivities(),
    getCustomers(),
  ]);

  const byStatus = STATUSES.map((status) => ({
    status,
    count: leads.filter((lead) => lead.status === status).length,
  }));
  const maxStatus = Math.max(...byStatus.map((row) => row.count), 1);

  // Un solo instante para toda la vista: si cada tarea consultara el reloj por
  // su cuenta, dos de ellas podrían caer en lados distintos de la medianoche.
  const now = new Date();

  return (
    <>
      <PageHeader
        title="CRM y seguimiento"
        description="Los contactos que todavía no son clientes, y las tareas que hay que hacerles. Es la bandeja de entrada del negocio entre semana."
      />

      <StatGrid cols={5}>
        <Stat
          label="Contactos nuevos"
          value={summary.leadsNew}
          tone={summary.leadsNew > 0 ? "alert" : "plain"}
          href="#leads"
        />
        <Stat label="Contactos totales" value={summary.leadsTotal} />
        <Stat
          label="Tareas pendientes"
          value={summary.pendingTasks}
          tone={summary.pendingTasks > 0 ? "alert" : "plain"}
          href="#tareas"
        />
        <Stat
          label="Vencidas"
          value={summary.overdueTasks}
          tone={summary.overdueTasks > 0 ? "alert" : "plain"}
        />
        <Stat
          label="Clientes con WhatsApp"
          value={`${summary.withWhatsapp}/${summary.customers}`}
        />
      </StatGrid>

      {summary.overdueTasks > 0 && (
        <p className="mt-4 flex items-center gap-2.5 rounded-xl border-2 border-ink-300 bg-ink-50 p-3 text-sm font-bold">
          <TriangleAlert className="size-4" />
          {summary.overdueTasks} {summary.overdueTasks === 1 ? "tarea venció" : "tareas vencieron"}.
        </p>
      )}

      {/* ---------- Embudo ---------- */}
      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Card
            id="leads"
            title={`Contactos (${leads.length})`}
            hint="Formulario de contacto, recomendaciones y visitas a la tienda"
            className="scroll-mt-20"
          >
            {leads.length === 0 ? (
              <Empty title="Sin contactos" body="Aparecen aquí los mensajes de /contacto." />
            ) : (
              <ul className="divide-y divide-ink-100">
                {leads.map((lead) => (
                  <li key={lead.id} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold">{lead.name}</p>
                        <p className="font-mono text-[0.64rem] text-ink-500">
                          {lead.source} · {relativeTime(lead.created_at)}
                        </p>
                        {lead.message && (
                          <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-700">
                            {lead.message}
                          </p>
                        )}
                        {lead.notes && (
                          <p className="mt-1 border-l-2 border-ink-300 pl-2 text-xs text-ink-600">
                            {lead.notes}
                          </p>
                        )}
                        <ul className="mt-1 flex flex-wrap gap-3 text-xs">
                          {lead.phone && (
                            <li>
                              <a
                                href={`tel:${lead.phone.replace(/\s/g, "")}`}
                                className="link-underline flex items-center gap-1"
                              >
                                <Phone className="size-3" />
                                {lead.phone}
                              </a>
                            </li>
                          )}
                          {lead.email && (
                            <li>
                              <a href={`mailto:${lead.email}`} className="link-underline break-all">
                                {lead.email}
                              </a>
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <StatePill
                          state={lead.status}
                          label={LEAD_STATUS_LABELS[lead.status]}
                        />
                        {lead.phone && (
                          <a
                            href={whatsappUrl(
                              lead.phone,
                              `Hola ${lead.name.split(" ")[0]}, te escribe JayLu.`,
                            )}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="btn btn-sm"
                          >
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-ink-100 pt-2">
                      {STATUSES.filter((status) => status !== lead.status).map((status) => (
                        <ActionForm
                          key={status}
                          action={setLeadStatusAction}
                          hiddenFields={{ id: lead.id, status }}
                        >
                          <button type="submit" className="btn btn-sm">
                            → {LEAD_STATUS_LABELS[status]}
                          </button>
                        </ActionForm>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* ---------- Tareas ---------- */}
          <Card
            id="tareas"
            title={`Tareas pendientes (${tasks.length})`}
            hint="Llamadas, mensajes y recordatorios"
            className="scroll-mt-20"
          >
            {tasks.length === 0 ? (
              <Empty
                title="Nada pendiente"
                body="Cuando anotes una tarea con fecha, aparecerá aquí."
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {tasks.map((task) => {
                  const overdue = isOverdue(task.due_at, now);
                  return (
                    <li key={task.id} className="flex items-start gap-3 py-2.5">
                      <ActionForm
                        action={toggleActivityAction}
                        hiddenFields={{ id: task.id, is_done: "1" }}
                      >
                        <button
                          type="submit"
                          title="Marcar como hecha"
                          className="mt-0.5 size-4 shrink-0 border-2 border-ink-300 bg-paper"
                        >
                          <span className="sr-only">Completar {task.title}</span>
                        </button>
                      </ActionForm>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{task.title ?? CRM_KIND_LABELS[task.kind]}</p>
                        {task.body && (
                          <p className="text-xs leading-relaxed text-ink-600">{task.body}</p>
                        )}
                        <p className="font-mono text-[0.62rem] text-ink-500">
                          <Link
                            href={`/admin/clientes/${task.customer_id}`}
                            className="hover:underline"
                          >
                            {task.customer_name}
                          </Link>{" "}
                          · {CRM_KIND_LABELS[task.kind]}
                        </p>
                      </div>
                      {task.due_at && (
                        <span
                          className={`shrink-0 font-mono text-[0.64rem] ${
                            overdue ? "font-bold underline decoration-2" : "text-ink-500"
                          }`}
                        >
                          <CalendarClock className="mr-1 inline size-3" />
                          {formatDate(task.due_at)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <ActionForm
              action={saveActivityAction}
              submitLabel="Crear tarea"
              submitIcon={<Plus className="size-4" />}
              submitClassName="btn btn-sm btn-solid mt-4"
            >
              <div className="grid gap-2 border-t border-ink-200 pt-4 sm:grid-cols-[10rem_minmax(0,1fr)_9rem]">
                <SelectField
                  name="customer_id"
                  label="Cliente"
                  placeholder="¿Para quién?"
                  options={customers.map((customer) => ({
                    value: customer.id,
                    label: customer.full_name,
                  }))}
                />
                <SelectField
                  name="kind"
                  label="Tipo"
                  value="task"
                  options={KINDS.map((kind) => ({
                    value: kind,
                    label: CRM_KIND_LABELS[kind],
                  }))}
                />
                <TextField name="due_at" label="Para el" type="date" />
              </div>
              <div className="mt-2">
                <TextField
                  name="title"
                  label="Tarea"
                  required
                  placeholder="Confirmar tallas del pedido de uniformes"
                />
              </div>
              <div className="mt-2">
                <TextAreaField name="body" label="Detalle" rows={2} />
              </div>
            </ActionForm>
          </Card>

          {/* ---------- Historial ---------- */}
          <Card title="Historial reciente" hint="Notas ya cerradas">
            {history.filter((entry) => entry.is_done).length === 0 ? (
              <Empty title="Nada cerrado todavía" />
            ) : (
              <ul className="divide-y divide-ink-100 text-sm">
                {history
                  .filter((entry) => entry.is_done)
                  .slice(0, 15)
                  .map((entry) => (
                    <li key={entry.id} className="flex flex-wrap items-center gap-2 py-2">
                      <span className="size-1.5 shrink-0 bg-ink" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">
                        {entry.title ?? CRM_KIND_LABELS[entry.kind]}
                        <span className="text-ink-500"> · {entry.customer_name}</span>
                      </span>
                      <ActionForm
                        action={toggleActivityAction}
                        hiddenFields={{ id: entry.id, is_done: "" }}
                      >
                        <button
                          type="submit"
                          title="Reabrir"
                          className="font-mono text-[0.6rem] text-ink-500 uppercase hover:text-ink hover:underline"
                        >
                          reabrir
                        </button>
                      </ActionForm>
                      <span className="shrink-0 font-mono text-[0.62rem] text-ink-500">
                        {formatDateTime(entry.created_at)}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ---------- Lateral ---------- */}
        <aside className="space-y-4">
          <Card title="Embudo" hint="Cómo avanzan los contactos">
            <ul className="space-y-2.5">
              {byStatus.map((row) => (
                <li key={row.status}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span>{LEAD_STATUS_LABELS[row.status]}</span>
                    <span className="font-mono text-xs font-bold tabular">{row.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-ink-100">
                    <div
                      className="h-full bg-ember-600"
                      style={{ width: `${Math.max(2, (row.count / maxStatus) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Añadir contacto" hint="Alguien que no escribió por la web">
            <ActionForm
              action={saveLeadAction}
              submitLabel="Guardar"
              submitClassName="btn btn-sm btn-solid w-full"
            >
              <div className="space-y-3">
                <TextField name="name" label="Nombre" required />
                <div className="grid grid-cols-2 gap-3">
                  <TextField name="phone" label="Teléfono" inputMode="tel" />
                  <TextField name="email" label="Correo" type="email" />
                </div>
                <SelectField
                  name="source"
                  label="Origen"
                  value="otro"
                  options={LEAD_SOURCES.map((source) => ({
                    value: source,
                    label: source,
                  }))}
                />
                <TextAreaField
                  name="message"
                  label="Qué pidió"
                  rows={3}
                  placeholder="20 franelas para un colegio, necesita cotización"
                />
                <TextAreaField name="notes" label="Notas internas" rows={2} />
                <SelectField
                  name="status"
                  label="Estado"
                  value="new"
                  options={STATUSES.map((status) => ({
                    value: status,
                    label: LEAD_STATUS_LABELS[status],
                  }))}
                />
              </div>
            </ActionForm>
          </Card>
        </aside>
      </div>
    </>
  );
}
