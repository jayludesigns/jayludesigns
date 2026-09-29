import Link from "next/link";
import { Boxes, Trash2, TriangleAlert } from "lucide-react";

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
import { SelectField, TextAreaField, TextField } from "@/components/admin/Fields";
import {
  adjustMaterialAction,
  deleteMaterialAction,
  saveMaterialAction,
} from "@/app/admin/actions";
import {
  getMaterialMovements,
  getMaterialSummary,
  getRawMaterials,
} from "@/lib/data/inventory";
import {
  MATERIAL_CATEGORIES,
  MATERIAL_CATEGORY_LABELS,
  MATERIAL_UNITS,
} from "@/lib/types";
import { formatDateTime, formatVes } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function RawMaterialsPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const one = (key: string) => {
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  };

  const [materials, summary, movements] = await Promise.all([
    getRawMaterials({
      search: one("q") || undefined,
      category: one("categoria") || "todos",
      lowStockOnly: one("stock") === "bajo",
    }),
    getMaterialSummary(),
    getMaterialMovements(15),
  ]);

  return (
    <>
      <PageHeader
        title="Materia prima"
        description="Telas, tintas, papel de sublimación y consumibles. Sirve para saber qué reponer antes de que falte y para costear la producción."
        actions={
          <Link href="/admin/inventario" className="btn btn-sm">
            Producto terminado
          </Link>
        }
      />

      <StatGrid cols={4}>
        <Stat label="Referencias" value={summary.totalItems} />
        <Stat
          label="Unidades"
          value={summary.totalUnits.toFixed(0)}
          sub={MATERIAL_UNITS.length + " unidades de medida"}
        />
        <Stat label="Valor" value={formatVes(summary.totalValue)} />
        <Stat
          label="Por reponer"
          value={summary.lowStock}
          tone={summary.lowStock > 0 ? "alert" : "plain"}
        />
      </StatGrid>

      <div className="mt-6">
        <Filters>
          <FilterInput
            name="q"
            label="Buscar"
            value={one("q")}
            placeholder="nombre, SKU o proveedor"
            className="min-w-52 flex-1"
          />
          <div className="w-40">
            <label htmlFor="f-categoria" className="label">
              Categoría
            </label>
            <select
              id="f-categoria"
              name="categoria"
              defaultValue={one("categoria") || "todos"}
              className="field py-1.5 text-sm"
            >
              <option value="todos">Todas</option>
              {MATERIAL_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {MATERIAL_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <label htmlFor="f-stock" className="label">
              Existencias
            </label>
            <select
              id="f-stock"
              name="stock"
              defaultValue={one("stock")}
              className="field py-1.5 text-sm"
            >
              <option value="">Todas</option>
              <option value="bajo">Bajo mínimo</option>
            </select>
          </div>
        </Filters>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Card title={`Materiales (${materials.length})`}>
            {materials.length === 0 ? (
              <Empty title="Nada con esos filtros" body="Añade el primer material con el formulario de la derecha." />
            ) : (
              <div className="-mx-4 -my-4 overflow-x-auto">
                <table className="table-admin w-full min-w-3xl">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Categoría</th>
                      <th className="text-right">Existencia</th>
                      <th className="text-right">Costo unit.</th>
                      <th className="text-right">Valor</th>
                      <th>Proveedor</th>
                      <th>Ajustar</th>
                      <th>
                        <span className="sr-only">Borrar</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((material) => (
                      <tr key={material.id}>
                        <td>
                          <p className="truncate font-semibold">{material.name}</p>
                          <p className="font-mono text-[0.62rem] text-ink-500">
                            {material.sku ?? "—"} · {material.location ?? "sin ubicación"}
                          </p>
                        </td>
                        <td>
                          <Pill tone="plain">
                            {MATERIAL_CATEGORY_LABELS[material.category]}
                          </Pill>
                        </td>
                        <td className="text-right">
                          <span
                            className={`font-mono text-xs font-bold tabular ${
                              material.is_low ? "underline decoration-2 underline-offset-2" : ""
                            }`}
                          >
                            {material.stock}
                          </span>
                          <span className="block font-mono text-[0.57rem] text-ink-500">
                            {material.unit} · mín {material.min_stock}
                          </span>
                        </td>
                        <td className="text-right font-mono text-xs tabular">
                          {material.cost_ves > 0 ? formatVes(material.cost_ves) : "—"}
                        </td>
                        <td className="text-right font-mono text-xs font-bold tabular">
                          {formatVes(material.stock_value)}
                        </td>
                        <td className="text-xs text-ink-600">{material.supplier ?? "—"}</td>
                        <td>
                          <ActionForm
                            action={adjustMaterialAction}
                            hiddenFields={{ material_id: material.id }}
                            className="flex items-center gap-1"
                          >
                            <input
                              aria-label={`Ajuste de ${material.name}`}
                              name="delta"
                              type="number"
                              step="0.01"
                              placeholder="+0"
                              className="field w-16 px-1.5 py-1 text-center font-mono text-xs"
                            />
                            <input type="hidden" name="reason" value="Ajuste desde materia prima" />
                            <button type="submit" className="btn btn-sm">
                              <Boxes className="size-3" />
                            </button>
                          </ActionForm>
                        </td>
                        <td className="text-right">
                          <ActionForm
                            action={deleteMaterialAction}
                            hiddenFields={{ id: material.id }}
                            confirm={`¿Borrar «${material.name}»? Se borra también su historial de movimientos.`}
                          >
                            <button
                              type="submit"
                              className="btn btn-sm px-2"
                              title={`Borrar ${material.name}`}
                            >
                              <Trash2 className="size-3" />
                              <span className="sr-only">Borrar {material.name}</span>
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

          <Card title="Movimientos recientes">
            {movements.length === 0 ? (
              <Empty title="Sin movimientos" />
            ) : (
              <ul className="divide-y divide-ink-100 text-sm">
                {movements.map((movement) => {
                  const material = materials.find((m) => m.id === movement.material_id);
                  return (
                    <li key={movement.id} className="flex flex-wrap items-center gap-2 py-2">
                      <Pill
                        tone={
                          movement.quantity > 0
                            ? "solid"
                            : movement.type === "waste"
                              ? "outline"
                              : "plain"
                        }
                      >
                        {movement.quantity > 0 ? "+" : ""}
                        {movement.quantity}
                      </Pill>
                      <span className="min-w-0 flex-1 truncate">
                        {material?.name ?? movement.material_id}
                        {movement.type === "waste" ? " · merma" : ""}
                      </span>
                      <span className="font-mono text-[0.64rem] text-ink-500">
                        {movement.reason} · {formatDateTime(movement.created_at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card title="Añadir material">
            <ActionForm action={saveMaterialAction} submitLabel="Guardar" submitClassName="btn btn-sm btn-solid w-full">
              <div className="space-y-3">
                <TextField name="name" label="Nombre" required placeholder="Rollo de film DTF 33 cm" />
                <TextField name="sku" label="SKU" placeholder="MAT-TIN-001" inputClassName="font-mono text-xs" />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    name="category"
                    label="Categoría"
                    value="tela"
                    options={MATERIAL_CATEGORIES.map((category) => ({
                      value: category,
                      label: MATERIAL_CATEGORY_LABELS[category],
                    }))}
                  />
                  <SelectField
                    name="unit"
                    label="Unidad"
                    value="unidad"
                    options={MATERIAL_UNITS.map((unit) => ({ value: unit, label: unit }))}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <TextField name="stock" label="Stock" type="number" value={0} step="0.01" />
                  <TextField name="min_stock" label="Mínimo" type="number" value={0} step="0.01" />
                  <TextField name="cost_ves" label="Costo" type="number" value={0} />
                </div>
                <TextField name="supplier" label="Proveedor" placeholder="Nombre del proveedor" />
                <TextField name="location" label="Ubicación" placeholder="Estante B, repisa 2" />
                <TextAreaField name="notes" label="Notas" rows={2} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="is_active" defaultChecked className="size-4 accent-[#6b201a]" />
                  Activo
                </label>
              </div>
            </ActionForm>
          </Card>

          <Card title="Editar material">
            <p className="mb-3 text-xs text-ink-600">
              Elige un material de la tabla para cargar sus datos aquí y corregirlos.
            </p>
            <ActionForm action={saveMaterialAction} submitLabel="Guardar cambios" submitClassName="btn btn-sm w-full">
              <div className="space-y-3">
                <select name="id" required className="field">
                  <option value="">— elige un material —</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
                <TextField name="name" label="Nombre" />
                <TextField name="supplier" label="Proveedor" />
                <div className="grid grid-cols-3 gap-3">
                  <TextField name="stock" label="Stock" type="number" step="0.01" />
                  <TextField name="min_stock" label="Mínimo" type="number" step="0.01" />
                  <TextField name="cost_ves" label="Costo" type="number" />
                </div>
                <TextField name="location" label="Ubicación" />
              </div>
            </ActionForm>
          </Card>

          {summary.lowStock > 0 && (
            <p className="flex items-start gap-2 rounded-xl border-2 border-ink-300 bg-ink-50 p-3 text-xs font-bold">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              {summary.lowStock} referencias en o por debajo del mínimo.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
