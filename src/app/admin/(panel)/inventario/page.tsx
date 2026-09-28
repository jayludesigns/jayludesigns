import Link from "next/link";
import { ArrowDownUp, TriangleAlert } from "lucide-react";

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
import { adjustStockAction } from "@/app/admin/actions";
import { getStockMovements, getStockSummary, getVariantsWithProduct } from "@/lib/data/inventory";
import { formatDateTime, formatVes } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminInventoryPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const one = (key: string) => {
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  };

  const filters = {
    search: one("q") || undefined,
    lowStockOnly: one("stock") === "bajo",
    outOfStockOnly: one("stock") === "agotado",
    includeInactive: one("inactivos") === "1",
  };

  const [rows, summary, movements] = await Promise.all([
    getVariantsWithProduct(filters),
    getStockSummary(),
    getStockMovements(20),
  ]);

  return (
    <>
      <PageHeader
        title="Inventario de producto terminado"
        description="Existencias por talla y color. Cuando un pedido se marca pagado, el stock reservado se descuenta de aquí."
        actions={
          <Link href="/admin/inventario/materia-prima" className="btn btn-sm">
            Materia prima
          </Link>
        }
      />

      <StatGrid>
        <Stat label="Referencias" value={summary.totalSkus} />
        <Stat label="Unidades" value={summary.totalUnits} />
        <Stat
          label="Reservadas"
          value={summary.reservedUnits}
          sub="En pedidos sin entregar"
        />
        <Stat label="Valor a costo" value={formatVes(summary.valueAtCost)} sub={`Venta: ${formatVes(summary.valueAtRetail)}`} />
      </StatGrid>

      {(summary.lowStock > 0 || summary.outOfStock > 0) && (
        <p className="mt-4 flex items-center gap-2.5 rounded-xl border-2 border-ink-300 bg-ink-50 p-3 text-sm font-bold">
          <TriangleAlert className="size-4" />
          {summary.outOfStock > 0 && `${summary.outOfStock} agotadas`}
          {summary.outOfStock > 0 && summary.lowStock > 0 && " · "}
          {summary.lowStock > 0 && `${summary.lowStock} por debajo del mínimo`}
        </p>
      )}

      <div className="mt-6">
        <Filters>
          <FilterInput
            name="q"
            label="Buscar"
            value={one("q")}
            placeholder="producto o SKU"
            className="min-w-52 flex-1"
          />
          <FilterSelectStock value={one("stock")} />
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              name="inactivos"
              value="1"
              defaultChecked={filters.includeInactive}
              className="size-4 accent-[#6b201a]"
            />
            Incluir variantes inactivas
          </label>
        </Filters>
      </div>

      <Card>
        {rows.length === 0 ? (
          <Empty
            title="No hay variantes con esos filtros"
            body="Las variantes se crean desde la ficha de cada producto."
            action={
              <Link href="/admin/productos" className="btn btn-sm">
                Ir a productos
              </Link>
            }
          />
        ) : (
          <div className="-mx-4 -my-4 overflow-x-auto">
            <table className="table-admin w-full min-w-5xl">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Variante</th>
                  <th className="text-right">Precio</th>
                  <th className="text-right">Costo</th>
                  <th className="text-center">Stock</th>
                  <th className="text-center">Reservado</th>
                  <th className="text-center">Disponible</th>
                  <th>Ajustar</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        {row.product_image && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={row.product_image}
                            alt=""
                            className="size-8 shrink-0 border border-ink-200 object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/admin/productos/${row.product_id}`}
                            className="block truncate font-semibold hover:underline"
                          >
                            {row.product_name}
                          </Link>
                          <span className="font-mono text-[0.6rem] text-ink-500">
                            {row.sku ?? "—"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm">
                      {row.size ?? "Única"}
                      {row.color ? ` · ${row.color}` : ""}
                      {!row.product_active && (
                        <Pill tone="muted" className="ml-1.5">
                          producto oculto
                        </Pill>
                      )}
                    </td>
                    <td className="text-right font-mono text-xs font-bold tabular">
                      {formatVes(row.price_ves)}
                    </td>
                    <td className="text-right font-mono text-xs text-ink-600 tabular">
                      {row.cost_ves > 0 ? formatVes(row.cost_ves) : "—"}
                    </td>
                    <td className="text-center font-mono text-xs font-bold tabular">
                      {row.stock}
                    </td>
                    <td className="text-center font-mono text-xs text-ink-500 tabular">
                      {row.reserved_stock}
                    </td>
                    <td className="text-center">
                      <span
                        className={`font-mono text-xs font-bold tabular ${
                          row.is_low ? "underline decoration-2 underline-offset-2" : ""
                        }`}
                      >
                        {row.available}
                      </span>
                    </td>
                    <td>
                      <ActionForm
                        action={adjustStockAction}
                        hiddenFields={{ variant_id: row.id }}
                        className="flex items-center gap-1"
                      >
                        <input
                          aria-label={`Ajuste de stock para ${row.product_name}`}
                          name="delta"
                          type="number"
                          placeholder="+0"
                          className="field w-16 px-1.5 py-1 text-center font-mono text-xs"
                        />
                        <input type="hidden" name="reason" value="Ajuste desde inventario" />
                        <button type="submit" className="btn btn-sm">
                          <ArrowDownUp className="size-3" />
                        </button>
                      </ActionForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-6">
        <Card title="Últimos movimientos" hint="Entradas, salidas y ajustes con su motivo.">
          {movements.length === 0 ? (
            <Empty title="Sin movimientos" />
          ) : (
            <ul className="divide-y divide-ink-100 text-sm">
              {movements.map((movement) => {
                const row = rows.find((r) => r.id === movement.variant_id);
                return (
                  <li key={movement.id} className="flex flex-wrap items-center gap-2 py-2">
                    <Pill
                      tone={
                        movement.quantity > 0 ? "solid" : movement.quantity < 0 ? "outline" : "plain"
                      }
                    >
                      {movement.quantity > 0 ? "+" : ""}
                      {movement.quantity}
                    </Pill>
                    <span className="min-w-0 flex-1 truncate">
                      {row?.product_name ?? movement.variant_id}
                      {movement.note ? ` — ${movement.note}` : ""}
                    </span>
                    <span className="font-mono text-[0.62rem] text-ink-500">
                      {movement.reason} · {formatDateTime(movement.created_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function FilterSelectStock({ value }: { value: string }) {
  return (
    <div className="w-40">
      <label htmlFor="f-stock" className="label">
        Existencias
      </label>
      <select id="f-stock" name="stock" defaultValue={value} className="field py-1.5 text-sm">
        <option value="">Todas</option>
        <option value="bajo">Bajo mínimo</option>
        <option value="agotado">Agotadas</option>
      </select>
    </div>
  );
}
