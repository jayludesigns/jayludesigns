import Link from "next/link";
import { ArrowRight, Boxes, Brush, Package, ShoppingCart, TriangleAlert, Users } from "lucide-react";

import { Card, Empty, PageHeader, Stat, StatGrid } from "@/components/admin/AdminUI";
import { SalesChart } from "@/components/admin/Charts";
import { Pill, StatePill } from "@/components/admin/Pill";
import { getActivityLog, getPromotions } from "@/lib/data/admin-catalog";
import { getCrmSummary, getLeads, getPendingTasks } from "@/lib/data/customers";
import { getDesignSummary, getDesigns } from "@/lib/data/designs";
import { getFinanceSummary } from "@/lib/data/finance";
import { getStockSummary } from "@/lib/data/inventory";
import { getOpenOrders } from "@/lib/data/orders";
import { getAllProducts, getCategories, getCollections } from "@/lib/data/catalog";
import { getStoreSettings, isSupabaseConfigured } from "@/lib/db";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/types";
import { formatDateTime, formatVes, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [finance, stock, orders, designSummary, crm, activities, products, collections, categories, promotions, newDesigns, leads, tasks, settings] =
    await Promise.all([
      getFinanceSummary(30),
      getStockSummary(),
      getOpenOrders(),
      getDesignSummary(),
      getCrmSummary(),
      getActivityLog(12),
      getAllProducts(),
      getCollections(true),
      getCategories(false),
      getPromotions(),
      getDesigns({ status: "new" }),
      getLeads("new"),
      getPendingTasks(),
      getStoreSettings(),
    ]);

  const supabase = isSupabaseConfigured();
  const pendingPayment = orders.filter((o) => o.payment_status === "pending");
  const toPrint = orders.filter((o) => o.status === "paid");
  const toShip = orders.filter((o) => o.status === "ready");
  const lowStock = stock.lowStock + stock.outOfStock;

  return (
    <>
      <PageHeader
        title="Resumen"
        description="Lo que hay que mirar hoy: qué falta por cobrar, qué está parado en el taller y qué se está agotando."
        actions={
          <>
            <Link href="/admin/pedidos/nuevo" className="btn btn-sm">
              <ShoppingCart className="size-3.5" />
              Pedido manual
            </Link>
            <Link href="/admin/productos/nuevo" className="btn btn-sm btn-solid">
              <Package className="size-3.5" />
              Nuevo producto
            </Link>
          </>
        }
      />

      {/* ---------- Cifras ---------- */}
      <StatGrid>
        <Stat
          label="Ventas hoy"
          value={formatVes(finance.today.revenue_ves)}
          sub={`${finance.today.orders} ${finance.today.orders === 1 ? "pedido" : "pedidos"}`}
        />
        <Stat
          label="Ventas del mes"
          value={formatVes(finance.month.revenue_ves)}
          sub={`margen ${finance.marginPercent.toFixed(0)}%`}
          href="/admin/finanzas"
        />
        <Stat
          label="Por cobrar"
          value={formatVes(finance.pending.amount_ves)}
          sub={`${finance.pending.count} ${finance.pending.count === 1 ? "pedido" : "pedidos"}`}
          tone={finance.pending.count > 0 ? "alert" : "plain"}
          href="/admin/pedidos?pago=pending"
        />
        <Stat
          label="Ticket medio"
          value={formatVes(finance.averageTicket.ves)}
          sub={`${formatVes(finance.averageTicket.eur, "€")} de media`}
        />
      </StatGrid>

      {/* ---------- Taller ---------- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="En el taller" hint="Órdenes de trabajo abiertas">
          <ul className="divide-y divide-ink-100">
            {[
              ["Por imprimir", toPrint, "/admin/pedidos?estado=paid"],
              ["Listos para enviar", toShip, "/admin/pedidos?estado=ready"],
              [
                "Esperando pago",
                pendingPayment,
                "/admin/pedidos?pago=pending",
              ],
            ].map(([label, list, href]) => {
              const rows = list as typeof orders;
              return (
                <li key={String(label)} className="flex items-center justify-between py-2.5">
                  <span className="text-sm">{String(label)}</span>
                  <Link
                    href={href as string}
                    className="flex items-center gap-2 font-mono text-sm font-bold hover:underline"
                  >
                    {rows.length}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 border-t border-ink-200 pt-3 text-xs text-ink-600">
            {orders.length} pedidos abiertos en total.
          </p>
        </Card>

        <Card title="Inventario" hint="Producto terminado y materia prima">
          <dl className="space-y-2.5 text-sm">
            {[
              ["Referencias activas", formatVes(stock.totalSkus)],
              ["Unidades en almacén", formatVes(stock.totalUnits)],
              ["Reservadas por pedidos", formatVes(stock.reservedUnits)],
              ["Valor a costo", formatVes(stock.valueAtCost)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-ink-600">{label}</dt>
                <dd className="font-mono font-bold tabular">{value}</dd>
              </div>
            ))}
          </dl>
          {lowStock > 0 && (
            <p className="mt-3 flex items-center gap-2 rounded-xl border-2 border-ink-300 bg-ink-50 p-2.5 text-xs font-bold">
              <TriangleAlert className="size-3.5" />
              {lowStock} referencias en stock bajo
            </p>
          )}
          <Link href="/admin/inventario" className="btn btn-sm mt-3 w-full">
            <Boxes className="size-3.5" />
            Ver inventario
          </Link>
        </Card>

        <Card title="Clientes y diseños" hint="Lo que entra por la puerta">
          <dl className="space-y-2.5 text-sm">
            {[
              ["Clientes registrados", formatVes(crm.customers)],
              ["Diseños nuevos", formatVes(designSummary.new)],
              ["En cotización", formatVes(designSummary.quoting)],
              ["Contactos sin responder", formatVes(crm.leadsNew)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-ink-600">{label}</dt>
                <dd className="font-mono font-bold tabular">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link href="/admin/disenos" className="btn btn-sm">
              <Brush className="size-3.5" />
              Diseños
            </Link>
            <Link href="/admin/crm" className="btn btn-sm">
              <Users className="size-3.5" />
              CRM
            </Link>
          </div>
        </Card>
      </div>

      {/* ---------- Gráfico ---------- */}
      <div className="mt-6">
        <Card
          title="Ventas de los últimos 30 días"
          hint={`Tasa BCV en uso: ${formatVes(settings.bcv_rate, "Bs/€", false)}`}
          action={
            <Link href="/admin/finanzas" className="btn btn-sm">
              Detalle
            </Link>
          }
        >
          <SalesChart points={finance.series} />
        </Card>
      </div>

      {/* ---------- Pedidos recientes ---------- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card
          title="Pedidos recientes"
          action={
            <Link href="/admin/pedidos" className="btn btn-sm">
              Ver todos
            </Link>
          }
        >
          {orders.length === 0 ? (
            <Empty title="Todavía no hay pedidos" body="Cuando alguien compre, aparecerá aquí." />
          ) : (
            <ul className="divide-y divide-ink-100 text-sm">
              {orders.slice(0, 6).map((order) => (
                <li key={order.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="font-mono text-xs font-bold hover:underline"
                    >
                      {order.order_number}
                    </Link>
                    <p className="truncate text-xs text-ink-600">{order.customer_name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatePill
                      state={order.status}
                      label={ORDER_STATUS_LABELS[order.status]}
                    />
                    {order.payment_status === "pending" && (
                      <Pill tone="outline">{PAYMENT_STATUS_LABELS.pending}</Pill>
                    )}
                    <span className="font-mono text-xs font-bold tabular">
                      {formatVes(order.total_ves)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Últimos movimientos"
          hint="Registro de cambios del panel"
          action={
            <Link href="/admin/colecciones" className="btn btn-sm">
              Catálogo
            </Link>
          }
        >
          {activities.length === 0 ? (
            <Empty title="Sin movimientos" />
          ) : (
            <ul className="space-y-2 text-sm">
              {activities.map((entry) => (
                <li key={entry.id} className="flex gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 bg-ink" aria-hidden />
                  <span className="min-w-0">
                    <span className="block leading-snug">{entry.summary}</span>
                    <span className="font-mono text-[0.62rem] text-ink-500">
                      {entry.entity} · {relativeTime(entry.created_at)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ---------- Lotes de trabajo ---------- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card
          title="Diseños a medida por revisar"
          action={
            <Link href="/admin/disenos" className="btn btn-sm">
              Abrir
            </Link>
          }
        >
          {newDesigns.length === 0 ? (
            <Empty title="Nada pendiente" body="Las solicitudes nuevas aparecen aquí." />
          ) : (
            <ul className="divide-y divide-ink-100 text-sm">
              {newDesigns.slice(0, 5).map((design) => (
                <li key={design.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/disenos/${design.id}`}
                      className="font-mono text-xs font-bold hover:underline"
                    >
                      {design.code}
                    </Link>
                    <p className="truncate text-sm">{design.name ?? "Sin título"}</p>
                    <p className="truncate text-xs text-ink-500">
                      {design.contact_name ?? design.contact_phone ?? "Sin contacto"}
                    </p>
                  </div>
                  <Pill tone="solid">
                    {design.reference_urls.length ? "con foto" : "solo texto"}
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Tareas y seguimientos"
          action={
            <Link href="/admin/crm" className="btn btn-sm">
              CRM
            </Link>
          }
        >
          {tasks.length === 0 ? (
            <Empty title="Sin tareas pendientes" />
          ) : (
            <ul className="divide-y divide-ink-100 text-sm">
              {tasks.slice(0, 5).map((task) => (
                <li key={task.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{task.title ?? task.kind}</p>
                    <p className="truncate text-xs text-ink-600">{task.customer_name}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[0.62rem] text-ink-500">
                    {task.due_at ? formatDateTime(task.due_at) : "sin fecha"}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {leads.length > 0 && (
            <p className="mt-3 border-t border-ink-200 pt-3 text-xs text-ink-600">
              {leads.length} contactos nuevos esperando primer contacto.
            </p>
          )}
        </Card>
      </div>

      {/* ---------- Estado del catálogo ---------- */}
      <div className="mt-6">
        <Card title="Catálogo" hint="Estado de publicación">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="font-mono text-[0.62rem] tracking-wider text-ink-500 uppercase">
                Productos
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular">{products.length}</p>
              <p className="text-xs text-ink-600">
                {products.filter((p) => p.is_active).length} visibles ·{" "}
                {products.filter((p) => p.is_featured).length} destacados
              </p>
            </div>
            <div>
              <p className="font-mono text-[0.62rem] tracking-wider text-ink-500 uppercase">
                Colecciones
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular">{collections.length}</p>
              <p className="text-xs text-ink-600">
                {collections.filter((c) => c.status === "published").length} publicadas
              </p>
            </div>
            <div>
              <p className="font-mono text-[0.62rem] tracking-wider text-ink-500 uppercase">
                Categorías
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular">{categories.length}</p>
              <p className="text-xs text-ink-600">
                {categories.filter((c) => c.is_active).length} activas
              </p>
            </div>
            <div>
              <p className="font-mono text-[0.62rem] tracking-wider text-ink-500 uppercase">
                Promociones
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular">{promotions.length}</p>
              <p className="text-xs text-ink-600">
                {promotions.filter((p) => p.is_active).length} activas ahora
              </p>
            </div>
          </div>

          <p className="mt-4 border-t border-ink-200 pt-3 text-xs text-ink-600">
            {designSummary.total} diseños registrados · {designSummary.quoting} cotizando ·{" "}
            {designSummary.inProduction} en producción.{" "}
            {supabase
              ? "Datos en Supabase."
              : "Datos en el archivo local .data/db.json."}{" "}
            <Link href="/admin/ajustes" className="link-underline font-bold">
              Ajustes
            </Link>
          </p>
        </Card>
      </div>

      <p className="mt-8 text-xs text-ink-500">
        Los pedidos se actualizan solos: el panel no guarda nada en el
        navegador, todo sale de la base de datos en cada carga.
      </p>
    </>
  );
}
