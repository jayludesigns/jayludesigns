import Link from "next/link";
import { Plus, Search } from "lucide-react";

import {
  Card,
  Empty,
  FilterInput,
  FilterSelect,
  Filters,
  PageHeader,
  Stat,
  StatGrid,
} from "@/components/admin/AdminUI";
import { StatePill } from "@/components/admin/Pill";
import { getOrders, type OrderFilters } from "@/lib/data/orders";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/types";
import { formatDateTime, formatVes } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

const STATUSES: OrderStatus[] = [
  "draft",
  "pending_payment",
  "paid",
  "in_production",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENTS: PaymentStatus[] = ["pending", "paid", "refunded", "failed"];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const one = (key: string) => {
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  };

  const filters: OrderFilters = {
    status: (one("estado") || "todos") as OrderStatus | "todos",
    paymentStatus: (one("pago") || "todos") as PaymentStatus | "todos",
    kind: (one("tipo") || "todos") as "product" | "custom" | "wholesale" | "todos",
    search: one("q") || undefined,
    limit: 200,
  };

  const orders = await getOrders(filters);

  const totals = orders.reduce(
    (acc, order) => {
      if (order.status === "cancelled") return acc;
      acc.count += 1;
      acc.amount += order.total_ves;
      if (order.payment_status === "pending") acc.pending += order.total_ves;
      return acc;
    },
    { count: 0, amount: 0, pending: 0 },
  );

  return (
    <>
      <PageHeader
        title="Pedidos"
        description="Del registro a la entrega. Al marcar un pedido como pagado, el stock reservado se descuenta del inventario."
        actions={
          <Link href="/admin/pedidos/nuevo" className="btn btn-sm btn-solid">
            <Plus className="size-3.5" />
            Pedido manual
          </Link>
        }
      />

      <StatGrid cols={3}>
        <Stat label="Pedidos" value={totals.count} sub="sin contar cancelados" />
        <Stat label="Importe" value={formatVes(totals.amount)} />
        <Stat
          label="Por cobrar"
          value={formatVes(totals.pending)}
          tone={totals.pending > 0 ? "alert" : "plain"}
        />
      </StatGrid>

      <div className="mt-6">
        <Filters>
          <FilterInput
            name="q"
            label="Buscar"
            value={one("q")}
            placeholder="número, cliente o teléfono"
            className="min-w-52 flex-1"
          />
          <FilterSelect
            name="estado"
            label="Estado"
            value={one("estado")}
            className="w-44"
            options={[
              { value: "", label: "Todos" },
              ...STATUSES.map((status) => ({
                value: status,
                label: ORDER_STATUS_LABELS[status],
              })),
            ]}
          />
          <FilterSelect
            name="pago"
            label="Pago"
            value={one("pago")}
            className="w-40"
            options={[
              { value: "", label: "Todos" },
              ...PAYMENTS.map((payment) => ({
                value: payment,
                label: PAYMENT_STATUS_LABELS[payment],
              })),
            ]}
          />
          <FilterSelect
            name="tipo"
            label="Tipo"
            value={one("tipo")}
            className="w-36"
            options={[
              { value: "", label: "Todos" },
              { value: "product", label: "Catálogo" },
              { value: "custom", label: "A medida" },
              { value: "wholesale", label: "Mayorista" },
            ]}
          />
        </Filters>
      </div>

      <Card>
        {orders.length === 0 ? (
          <Empty
            title="Ningún pedido coincide"
            body="Cambia los filtros o revisa el rango de fechas."
          />
        ) : (
          <div className="-mx-4 -my-4 overflow-x-auto">
            <table className="table-admin w-full min-w-5xl">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Artículos</th>
                  <th className="text-right">Total</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="font-mono text-xs font-bold hover:underline"
                      >
                        {order.order_number}
                      </Link>
                      {order.kind !== "product" && (
                        <span className="mt-0.5 block font-mono text-[0.55rem] text-ink-500">
                          {order.kind === "wholesale" ? "mayorista" : "a medida"}
                        </span>
                      )}
                    </td>
                    <td>
                      <p className="truncate text-sm font-semibold">
                        {order.customer_name}
                      </p>
                      <p className="font-mono text-[0.6rem] text-ink-500">
                        {order.customer_phone ?? "—"}
                      </p>
                    </td>
                    <td className="font-mono text-xs">
                      {order.items.reduce((acc, item) => acc + item.quantity, 0)} u
                    </td>
                    <td className="text-right font-mono text-xs font-bold tabular">
                      {formatVes(order.total_ves)}
                      {order.discount_ves > 0 && (
                        <span className="block font-mono text-[0.55rem] text-ink-500">
                          −{formatVes(order.discount_ves)}
                        </span>
                      )}
                    </td>
                    <td>
                      <StatePill
                        state={order.payment_status}
                        label={PAYMENT_STATUS_LABELS[order.payment_status]}
                      />
                      {order.payment_method && (
                        <span className="mt-0.5 block font-mono text-[0.55rem] text-ink-500">
                          {PAYMENT_METHOD_LABELS[order.payment_method]}
                        </span>
                      )}
                    </td>
                    <td>
                      <StatePill
                        state={order.status}
                        label={ORDER_STATUS_LABELS[order.status]}
                      />
                    </td>
                    <td className="font-mono text-[0.62rem] text-ink-600">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="text-right">
                      <Link href={`/admin/pedidos/${order.id}`} className="btn btn-sm">
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {orders.length > 0 && (
        <p className="mt-3 flex items-center gap-2 text-xs text-ink-500">
          <Search className="size-3" />
          {orders.length} pedidos en la lista.
        </p>
      )}
    </>
  );
}
