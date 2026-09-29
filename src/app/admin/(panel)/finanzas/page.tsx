import { Percent, TrendingUp, Wallet } from "lucide-react";

import { Card, PageHeader, Stat, StatGrid } from "@/components/admin/AdminUI";
import { RankBars, SalesChart } from "@/components/admin/Charts";
import { StatePill } from "@/components/admin/Pill";
import { getFinanceSummary } from "@/lib/data/finance";
import { getMaterialSummary } from "@/lib/data/inventory";
import { getStockSummary } from "@/lib/data/inventory";
import { getStoreSettings, isSupabaseConfigured } from "@/lib/db";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/types";
import { formatDateTime, formatVes } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

const RANGES = [
  { value: "7", label: "7 días" },
  { value: "30", label: "30 días" },
  { value: "90", label: "90 días" },
  { value: "365", label: "Un año" },
];

export default async function AdminFinancePage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const raw = params.rango;
  const range = Number(Array.isArray(raw) ? raw[0] : raw) || 30;
  const days = RANGES.some((option) => option.value === String(range)) ? range : 30;

  const [summary, stock, materials, settings] = await Promise.all([
    getFinanceSummary(days),
    getStockSummary(),
    getMaterialSummary(),
    getStoreSettings(),
  ]);

  const rate = settings.bcv_rate;
  const statusMax = Math.max(...summary.byStatus.map((row) => row.amount_ves), 1);
  const methodMax = Math.max(...summary.byPaymentMethod.map((row) => row.amount_ves), 1);

  return (
    <>
      <PageHeader
        title="Finanzas"
        description="Cómo va el negocio en números: lo cobrado, lo que está por cobrar y el margen real una vez descontada la tela y la impresión."
      >
        <form method="get" className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[0.62rem] tracking-wider text-ink-500 uppercase">
            Periodo
          </span>
          {RANGES.map((option) => (
            <button
              key={option.value}
              type="submit"
              name="rango"
              value={option.value}
              className={`btn btn-sm ${
                String(days) === option.value ? "btn-solid" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </form>
      </PageHeader>

      <StatGrid cols={5}>
        <Stat
          label="Cobrado"
          value={formatVes(summary.month.revenue_ves)}
          sub={`${summary.month.orders} pedidos este mes`}
        />
        <Stat
          label="Por cobrar"
          value={formatVes(summary.pending.amount_ves)}
          sub={`${summary.pending.count} pedidos`}
          tone={summary.pending.count > 0 ? "alert" : "plain"}
        />
        <Stat
          label="Ticket medio"
          value={formatVes(summary.averageTicket.ves)}
          sub={`${formatVes(summary.averageTicket.eur, "€")} por pedido`}
        />
        <Stat
          label="Costo de lo vendido"
          value={formatVes(summary.costOfGoods)}
          sub="Tela, impresión y empaque"
        />
        <Stat
          label="Margen"
          value={`${summary.marginPercent}%`}
          sub={formatVes(summary.grossMargin)}
          tone={summary.marginPercent < 30 ? "alert" : "good"}
        />
      </StatGrid>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card
          title={`Ventas cobradas por día (${days} días)`}
          hint="Solo pedidos con pago confirmado"
        >
          <SalesChart points={summary.series} height={170} />
        </Card>

        <Card title="Cómo se cobra" hint="Método de pago de lo pagado">
          {summary.byPaymentMethod.length === 0 ? (
            <p className="text-sm text-ink-600">Todavía no hay pagos registrados.</p>
          ) : (
            <ul className="space-y-3">
              {summary.byPaymentMethod.map((row) => (
                <li key={row.method}>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span>
                      {PAYMENT_METHOD_LABELS[row.method as PaymentMethod] ?? row.method}
                    </span>
                    <span className="font-mono text-xs font-bold tabular">
                      {formatVes(row.amount_ves)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-ink-100">
                    <div
                      className="h-full bg-ember-600"
                      style={{ width: `${Math.max(3, (row.amount_ves / methodMax) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-0.5 font-mono text-[0.6rem] text-ink-500">
                    {row.count} {row.count === 1 ? "pedido" : "pedidos"} ·{" "}
                    {Math.round((row.amount_ves / methodMax) * 100)}% del máximo
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card
          title="Productos que más venden"
          hint="Por unidades y por importe"
          action={
            <TrendingUp className="size-4 opacity-30" />
          }
        >
          {summary.topProducts.length === 0 ? (
            <p className="text-sm text-ink-600">Sin ventas que analizar todavía.</p>
          ) : (
            <RankBars rows={summary.topProducts} formatValue={(value) => formatVes(value)} />
          )}
        </Card>

        <Card
          title="Por colección"
          hint="Qué línea está moviendo más"
          action={
            <Percent className="size-4 opacity-30" />
          }
        >
          {summary.byCollection.length === 0 ? (
            <p className="text-sm text-ink-600">
              Asigna productos a colecciones para ver este desglose.
            </p>
          ) : (
            <RankBars rows={summary.byCollection} formatValue={(value) => formatVes(value)} />
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Peso de cada estado" hint="Dónde se acumula el dinero">
          <ul className="space-y-2.5">
            {summary.byStatus.map((row) => (
              <li key={row.status}>
                <div className="flex items-center justify-between gap-2">
                  <StatePill
                    state={row.status}
                    label={ORDER_STATUS_LABELS[row.status as OrderStatus] ?? row.status}
                  />
                  <span className="font-mono text-xs font-bold tabular">
                    {formatVes(row.amount_ves)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full bg-ink-100">
                  <div
                    className="h-full bg-ember-600"
                    style={{ width: `${Math.max(2, (row.amount_ves / statusMax) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title="Inventario y tasa"
          hint="Lo que está parado en el almacén"
          action={<Wallet className="size-4 opacity-30" />}
        >
          <dl className="space-y-2.5 text-sm">
            {[
              ["Producto terminado a costo", formatVes(stock.valueAtCost)],
              ["Producto terminado a venta", formatVes(stock.valueAtRetail)],
              [
                "Materia prima",
                formatVes(materials.totalValue),
              ],
              [
                "Inmovilizado total",
                formatVes(stock.valueAtCost + materials.totalValue),
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 border-b border-ink-100 pb-2">
                <dt className="text-ink-600">{label}</dt>
                <dd className="font-mono font-bold tabular">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 border-t border-ink-200 pt-3 text-xs leading-relaxed text-ink-600">
            <p>
              Tasa BCV en uso:{" "}
              <strong className="font-mono">
                {formatVes(rate, "Bs/€", false)}
              </strong>{" "}
              ({settings.bcv_source === "bcv" ? "automática" : "manual"} ·{" "}
              {settings.bcv_updated_at
                ? formatDateTime(settings.bcv_updated_at)
                : "sin fecha"}
              ).
            </p>
            <p className="mt-1.5">
              Base de datos:{" "}
              <strong>{isSupabaseConfigured() ? "Supabase" : ".data/db.json local"}</strong>.
              Cambia la tasa y el resto de ajustes en{" "}
              <a href="/admin/ajustes" className="link-underline font-bold">
                Ajustes
              </a>
              .
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
