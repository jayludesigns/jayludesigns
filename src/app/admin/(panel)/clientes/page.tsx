import Link from "next/link";
import { Search, Users } from "lucide-react";

import { ActionForm } from "@/components/admin/ActionForm";
import {
  Card,
  Empty,
  FilterInput,
  Filters,
  PageHeader,
  Stat,
  StatGrid,
} from "@/components/admin/AdminUI";
import { Pill } from "@/components/admin/Pill";
import { CheckField, TagsField, TextAreaField, TextField } from "@/components/admin/Fields";
import { saveCustomerAction } from "@/app/admin/actions";
import { getCustomers } from "@/lib/data/customers";
import { formatDate, formatVes, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminCustomersPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const raw = params.q;
  const term = ((Array.isArray(raw) ? raw[0] : raw) ?? "").trim();

  const customers = await getCustomers({ search: term || undefined });

  const totalSpent = customers.reduce((acc, customer) => acc + customer.total_spent_ves, 0);
  const repeat = customers.filter((customer) => customer.orders_count > 1).length;

  // Todas las etiquetas que se han usado, para el filtro.
  const tags = [...new Set(customers.flatMap((customer) => customer.tags))].sort();

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Quién compró, cuánto y cuándo. Se rellenan solos al crear pedidos; aquí se corrigen y se anotan cosas que no van en un pedido."
      />

      <StatGrid cols={4}>
        <Stat label="Clientes" value={customers.length} />
        <Stat label="Compraron más de una vez" value={repeat} />
        <Stat label="Facturado" value={formatVes(totalSpent)} />
        <Stat
          label="Con WhatsApp"
          value={customers.filter((customer) => customer.whatsapp).length}
          sub="Para recordatorios"
        />
      </StatGrid>

      <div className="mt-6">
        <Filters>
          <FilterInput
            name="q"
            label="Buscar"
            value={term}
            placeholder="nombre, correo o teléfono"
            className="min-w-52 flex-1"
          />
        </Filters>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          {customers.length === 0 ? (
            <Empty
              title="Ningún cliente coincide"
              body="Prueba con otro nombre o revisa los pedidos ya registrados."
              action={
                <Link href="/admin/pedidos" className="btn btn-sm">
                  Ver pedidos
                </Link>
              }
            />
          ) : (
            <div className="-mx-4 -my-4 overflow-x-auto">
              <table className="table-admin w-full min-w-3xl">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Contacto</th>
                    <th>Etiquetas</th>
                    <th className="text-center">Pedidos</th>
                    <th className="text-right">Total</th>
                    <th>Última compra</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <Link
                          href={`/admin/clientes/${customer.id}`}
                          className="font-semibold hover:underline"
                        >
                          {customer.full_name}
                        </Link>
                        <p className="font-mono text-[0.6rem] text-ink-500">
                          {[customer.city, customer.state].filter(Boolean).join(", ") || "sin ciudad"}
                        </p>
                      </td>
                      <td className="text-xs">
                        {customer.phone && <p className="font-mono">{customer.phone}</p>}
                        {customer.email && (
                          <p className="truncate text-ink-600">{customer.email}</p>
                        )}
                        {!customer.phone && !customer.email && "—"}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {customer.tags.slice(0, 3).map((tag) => (
                            <Pill key={tag} tone="outline">
                              {tag}
                            </Pill>
                          ))}
                          {customer.tags.length > 3 && (
                            <Pill tone="muted">+{customer.tags.length - 3}</Pill>
                          )}
                        </div>
                      </td>
                      <td className="text-center font-mono text-xs font-bold tabular">
                        {customer.orders_count}
                        {customer.designs_count > 0 && (
                          <span className="block font-mono text-[0.55rem] text-ink-500">
                            {customer.designs_count} diseños
                          </span>
                        )}
                      </td>
                      <td className="text-right font-mono text-xs font-bold tabular">
                        {formatVes(customer.total_spent_ves)}
                      </td>
                      <td className="font-mono text-[0.62rem] text-ink-600">
                        {customer.last_order_at
                          ? relativeTime(customer.last_order_at)
                          : formatDate(customer.created_at)}
                      </td>
                      <td className="text-right">
                        <Link href={`/admin/clientes/${customer.id}`} className="btn btn-sm">
                          Ficha
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <aside className="space-y-4">
          <Card title="Nuevo cliente" hint="Para los que llegan por teléfono o sin comprar aún.">
            <ActionForm
              action={saveCustomerAction}
              submitLabel="Crear cliente"
              submitClassName="btn btn-sm btn-solid w-full"
            >
              <div className="space-y-3">
                <TextField name="full_name" label="Nombre" required />
                <div className="grid grid-cols-2 gap-3">
                  <TextField name="phone" label="Teléfono" inputMode="tel" />
                  <TextField name="whatsapp" label="WhatsApp" inputMode="tel" />
                </div>
                <TextField name="email" label="Correo" type="email" />
                <div className="grid grid-cols-2 gap-3">
                  <TextField name="city" label="Ciudad" />
                  <TextField name="state" label="Estado" />
                </div>
                <TextField name="address" label="Dirección" />
                <TagsField name="tags" label="Etiquetas" hint="uniforme, colegio, empresa…" />
                <TextAreaField name="notes" label="Notas" rows={2} />
                <CheckField name="marketing_opt_in" label="Quiere recibir novedades" />
              </div>
            </ActionForm>
          </Card>

          {tags.length > 0 && (
            <Card title="Etiquetas en uso">
              <ul className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <li key={tag}>
                    <Link href={`/admin/clientes?q=${encodeURIComponent(tag)}`}>
                      <Pill tone="outline">{tag}</Pill>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <p className="hint">
            <Users className="mr-1 inline size-3" />
            Los clientes no se borran al cancelar un pedido: el historial vale
            para saber a quién volver a escribir.
          </p>
        </aside>
      </div>

      {customers.length > 0 && (
        <p className="mt-3 flex items-center gap-2 text-xs text-ink-500">
          <Search className="size-3" />
          {customers.length} clientes.
        </p>
      )}
    </>
  );
}
