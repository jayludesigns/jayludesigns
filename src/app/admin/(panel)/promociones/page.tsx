import { Percent, Trash2 } from "lucide-react";

import { ActionForm } from "@/components/admin/ActionForm";
import { Card, PageHeader } from "@/components/admin/AdminUI";
import { Pill } from "@/components/admin/Pill";
import { SelectField, TextField } from "@/components/admin/Fields";
import {
  deleteCouponAction,
  deletePromotionAction,
  saveCouponAction,
  savePromotionAction,
  toggleCouponAction,
  togglePromotionAction,
} from "@/app/admin/actions";
import { getCoupons, getPromotions } from "@/lib/data/admin-catalog";
import { getAllProducts, getCollections } from "@/lib/data/catalog";
import { formatDate, formatVes } from "@/lib/utils";
import type { PromoKind } from "@/lib/types";

export const dynamic = "force-dynamic";

const KINDS: { value: PromoKind; label: string }[] = [
  { value: "percent", label: "Porcentaje (%)" },
  { value: "fixed", label: "Monto fijo (Bs)" },
];

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminPromotionsPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const raw = params.coleccion;
  const preset = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  const [promotions, coupons, products, collections] = await Promise.all([
    getPromotions(),
    getCoupons(),
    getAllProducts(),
    getCollections(true),
  ]);

  const productOptions = products.map((product) => ({
    value: product.id,
    label: product.name,
  }));
  const collectionOptions = collections.map((collection) => ({
    value: collection.id,
    label: collection.name,
  }));

  return (
    <>
      <PageHeader
        title="Promociones y cupones"
        description="Las promociones cambian el precio de un producto o de una colección sin tocar el precio base. Si dos se solapan, gana la de mayor prioridad."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-4">
          {/* ---------- Promociones ---------- */}
          <Card
            title={`Promociones (${promotions.length})`}
            hint="Se aplican solas en la ficha de producto y en el carrito."
          >
            {promotions.length === 0 ? (
              <p className="text-sm text-ink-600">No hay promociones todavía.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {promotions.map((promotion) => (
                  <li key={promotion.id} className="py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 font-semibold">
                          {promotion.name}
                          <Pill
                            tone={
                              promotion.state === "activa"
                                ? "solid"
                                : promotion.state === "inactiva"
                                  ? "muted"
                                  : "outline"
                            }
                          >
                            {promotion.state}
                          </Pill>
                          <Pill tone="plain">
                            {promotion.kind === "percent"
                              ? `−${promotion.value}%`
                              : `−${formatVes(promotion.value)}`}
                          </Pill>
                        </p>
                        <p className="mt-0.5 font-mono text-[0.62rem] text-ink-500">
                          {promotion.scope === "product" ? "Producto" : "Colección"}:{" "}
                          {promotion.target} · prioridad {promotion.priority}
                        </p>
                        {(promotion.starts_at || promotion.ends_at) && (
                          <p className="font-mono text-[0.62rem] text-ink-500">
                            {promotion.starts_at ? formatDate(promotion.starts_at) : "siempre"} →{" "}
                            {promotion.ends_at ? formatDate(promotion.ends_at) : "sin fin"}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <ActionForm
                          action={togglePromotionAction}
                          hiddenFields={{ id: promotion.id }}
                        >
                          <button type="submit" className="btn btn-sm">
                            {promotion.is_active ? "Pausar" : "Activar"}
                          </button>
                        </ActionForm>
                        <ActionForm
                          action={deletePromotionAction}
                          hiddenFields={{ id: promotion.id }}
                          confirm={`Se elimina la promoción "${promotion.name}".`}
                        >
                          <button type="submit" className="btn btn-sm" title="Eliminar">
                            <Trash2 className="size-3.5" />
                          </button>
                        </ActionForm>
                      </div>
                    </div>

                    <ActionForm
                      action={savePromotionAction}
                      hiddenFields={{
                        id: promotion.id,
                        scope: promotion.scope,
                        product_id: promotion.product_id ?? "",
                        collection_id: promotion.collection_id ?? "",
                      }}
                      className="mt-3 grid gap-2 border-t border-ink-100 pt-3 sm:grid-cols-6"
                    >
                      <TextField
                        name="name"
                        label="Nombre"
                        value={promotion.name}
                        className="sm:col-span-2"
                      />
                      <SelectField
                        name="kind"
                        label="Tipo"
                        value={promotion.kind}
                        options={KINDS}
                      />
                      <TextField
                        name="value"
                        label="Valor"
                        type="number"
                        value={promotion.value}
                      />
                      <TextField
                        name="priority"
                        label="Prioridad"
                        type="number"
                        value={promotion.priority}
                      />
                      <div className="flex items-end">
                        <button type="submit" className="btn btn-sm btn-solid w-full">
                          Guardar
                        </button>
                      </div>
                    </ActionForm>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* ---------- Cupones ---------- */}
          <Card
            title={`Cupones (${coupons.length})`}
            hint="El cliente los escribe en /checkout; también vale pasarlos por la URL con ?cupon=CODIGO."
          >
            {coupons.length === 0 ? (
              <p className="text-sm text-ink-600">No hay cupones.</p>
            ) : (
              <div className="-mx-4 -my-4 overflow-x-auto">
                <table className="table-admin w-full min-w-3xl">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Descuento</th>
                      <th>Mínimo</th>
                      <th>Usos</th>
                      <th>Vigencia</th>
                      <th>Estado</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((coupon) => (
                      <tr key={coupon.id}>
                        <td className="font-mono text-xs font-bold">{coupon.code}</td>
                        <td className="font-mono text-xs">
                          {coupon.kind === "percent"
                            ? `−${coupon.value}%`
                            : `−${formatVes(coupon.value)}`}
                        </td>
                        <td className="font-mono text-xs">
                          {coupon.min_subtotal_ves > 0
                            ? formatVes(coupon.min_subtotal_ves)
                            : "—"}
                        </td>
                        <td className="font-mono text-xs">
                          {coupon.used_count}
                          {coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
                        </td>
                        <td className="font-mono text-[0.62rem] text-ink-600">
                          {coupon.starts_at ? formatDate(coupon.starts_at) : "siempre"}
                          {coupon.ends_at ? ` → ${formatDate(coupon.ends_at)}` : ""}
                        </td>
                        <td>
                          <ActionForm action={toggleCouponAction} hiddenFields={{ id: coupon.id }}>
                            <button type="submit">
                              <Pill tone={coupon.is_active ? "solid" : "muted"}>
                                {coupon.is_active ? "activo" : "inactivo"}
                              </Pill>
                            </button>
                          </ActionForm>
                        </td>
                        <td className="text-right">
                          <ActionForm
                            action={deleteCouponAction}
                            hiddenFields={{ id: coupon.id }}
                            confirm={`Se elimina el cupón ${coupon.code}.`}
                          >
                            <button type="submit" title="Eliminar">
                              <Trash2 className="size-3.5" />
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
        </div>

        {/* ---------- Formularios ---------- */}
        <aside className="space-y-4">
          <Card title="Nueva promoción" hint="Se aplica a un producto o a una colección completa.">
            <ActionForm action={savePromotionAction} submitLabel="Crear promoción" submitClassName="btn btn-sm btn-solid w-full">
              <div className="space-y-3">
                <TextField name="name" label="Nombre" required placeholder="Drop de invierno" />
                <SelectField
                  name="scope"
                  label="Alcance"
                  value="product"
                  options={[
                    { value: "product", label: "Un producto" },
                    { value: "collection", label: "Una colección" },
                  ]}
                />
                <SelectField
                  name="product_id"
                  label="Producto"
                  value={preset}
                  placeholder="Elige un producto"
                  options={productOptions}
                />
                <SelectField
                  name="collection_id"
                  label="Colección"
                  value={preset}
                  placeholder="Elige una colección"
                  options={collectionOptions}
                />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField name="kind" label="Tipo" value="percent" options={KINDS} />
                  <TextField name="value" label="Valor" type="number" value={15} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField name="starts_at" label="Empieza" type="date" />
                  <TextField name="ends_at" label="Termina" type="date" />
                </div>
                <TextField
                  name="priority"
                  label="Prioridad"
                  type="number"
                  value={0}
                  hint="Si se solapan, gana el número mayor."
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked
                    className="size-4 accent-[#6b201a]"
                  />
                  Activa desde ya
                </label>
              </div>
            </ActionForm>
          </Card>

          <Card title="Nuevo cupón">
            <ActionForm action={saveCouponAction} submitLabel="Crear cupón" submitClassName="btn btn-sm btn-solid w-full">
              <div className="space-y-3">
                <TextField
                  name="code"
                  label="Código"
                  required
                  placeholder="BIENVENIDO10"
                  inputClassName="font-mono text-xs uppercase"
                />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField name="kind" label="Tipo" value="percent" options={KINDS} />
                  <TextField name="value" label="Valor" type="number" value={10} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    name="min_subtotal_ves"
                    label="Mínimo (Bs)"
                    type="number"
                    value={0}
                  />
                  <TextField name="max_uses" label="Usos máx." type="number" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField name="starts_at" label="Empieza" type="date" />
                  <TextField name="ends_at" label="Termina" type="date" />
                </div>
                <TextField
                  name="description"
                  label="Descripción interna"
                  placeholder="Para qué campaña es"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked
                    className="size-4 accent-[#6b201a]"
                  />
                  Activo
                </label>
              </div>
            </ActionForm>
          </Card>

          <p className="hint">
            <Percent className="mr-1 inline size-3" />
            El precio que ve el cliente siempre se recalcula en el servidor al
            crear el pedido: lo que envíe el navegador no cuenta.
          </p>
        </aside>
      </div>
    </>
  );
}
