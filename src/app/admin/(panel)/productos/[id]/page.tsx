import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Eye, Trash2 } from "lucide-react";

import { ActionForm } from "@/components/admin/ActionForm";
import { Pill } from "@/components/admin/Pill";
import { ProductForm } from "@/components/admin/ProductForm";
import { Card } from "@/components/admin/AdminUI";
import {
  deleteProductAction,
  deleteVariantAction,
  saveVariantAction,
  syncVariantsAction,
  toggleProductAction,
} from "@/app/admin/actions";
import { getProductForAdmin } from "@/lib/data/catalog";
import { getCategories, getCollections } from "@/lib/data/catalog";
import { getBackend } from "@/lib/db";
import type { ProductImage, Variant } from "@/lib/types";
import { formatDateTime, formatVes } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;
  const product = await getProductForAdmin(id);
  if (!product) notFound();

  const backend = getBackend();
  const [categories, collections, images, variants, links] = await Promise.all([
    getCategories(false),
    getCollections(true),
    backend.list<ProductImage>("product_images", {
      where: [{ column: "product_id", op: "eq", value: id }],
      order: [{ column: "sort_order", asc: true }],
    }),
    backend.list<Variant>("variants", {
      where: [{ column: "product_id", op: "eq", value: id }],
      order: [{ column: "created_at", asc: true }],
    }),
    backend.list<{ collection_id: string }>("product_collections", {
      where: [{ column: "product_id", op: "eq", value: id }],
    }),
  ]);

  const selectedCollectionIds = links.map((link) => link.collection_id);
  const lowStock = variants.filter((v) => v.stock <= v.min_stock);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/productos" className="btn btn-sm">
          <ChevronLeft className="size-3.5" />
          Productos
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/producto/${product.slug}`} target="_blank" className="btn btn-sm">
            <Eye className="size-3.5" />
            Ver en la tienda
          </Link>
          <ActionForm
            action={toggleProductAction}
            hiddenFields={{ id: product.id }}
            submitLabel={product.is_active ? "Ocultar" : "Publicar"}
            submitClassName="btn btn-sm"
          />
          <ActionForm
            action={deleteProductAction}
            hiddenFields={{ id: product.id }}
            submitLabel="Eliminar"
            submitIcon={<Trash2 className="size-3.5" />}
            submitClassName="btn btn-sm"
            confirm={`Se elimina "${product.name}" con sus imágenes y variantes. No se puede deshacer.`}
          />
        </div>
      </div>

      <header className="mb-6 border-b border-ink-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-4xl leading-none">{product.name}</h1>
          <Pill tone={product.is_active ? "solid" : "muted"}>
            {product.is_active ? "visible" : "oculto"}
          </Pill>
          {product.is_featured && <Pill tone="outline">destacado</Pill>}
          {product.is_custom_only && <Pill tone="outline">solo a medida</Pill>}
        </div>
        <p className="mt-2 font-mono text-xs text-ink-600">
          /producto/{product.slug} · {product.sku ?? "sin SKU"} · actualizado{" "}
          {formatDateTime(product.updated_at)}
        </p>
        {lowStock.length > 0 && (
          <p className="mt-3 rounded-xl border-2 border-ink-300 bg-ink-50 p-2.5 text-sm font-bold">
            {lowStock.length} {lowStock.length === 1 ? "variante" : "variantes"} en o por
            debajo del mínimo de stock.
          </p>
        )}
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <ProductForm
            product={product}
            categories={categories}
            collections={collections}
            selectedCollectionIds={selectedCollectionIds}
            images={images}
          />
        </div>

        {/* ---------- Variantes ---------- */}
        <aside className="space-y-4">
          <Card
            title={`Variantes (${variants.length})`}
            hint="Existencias por talla y color. Solo «Existencias» decide lo que se puede vender: «Aviso bajo» solo marca la variante en el inventario y «Costo» va al margen del pedido."
            action={
              <ActionForm
                action={syncVariantsAction}
                hiddenFields={{ product_id: product.id }}
                submitLabel="Generar"
                submitClassName="btn btn-sm"
                confirm="Se crearán las combinaciones de talla × color que falten."
              />
            }
          >
            {variants.length === 0 ? (
              <p className="text-sm text-ink-600">
                Este producto no tiene variantes. Pulsa «Generar» para crear una
                por cada combinación de talla y color, o añade una a mano.
              </p>
            ) : (
              <ul className="space-y-2">
                {variants.map((variant) => (
                  <li
                    key={variant.id}
                    id={`variante-${variant.id}`}
                    className="border border-ink-200 p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {variant.color_hex && (
                          <span
                            className="size-3.5 rounded-sm border border-ink-300"
                            style={{ background: variant.color_hex }}
                            aria-hidden
                          />
                        )}
                        {variant.size ?? "Única"}
                        {variant.color ? ` · ${variant.color}` : ""}
                      </span>
                      <span className="font-mono text-xs tabular">
                        {variant.stock} u
                        {variant.reserved_stock > 0 && (
                          <span className="text-ink-500"> (−{variant.reserved_stock})</span>
                        )}
                      </span>
                    </div>

                    <ActionForm
                      action={saveVariantAction}
                      hiddenFields={{
                        id: variant.id,
                        product_id: product.id,
                        color: variant.color,
                        color_hex: variant.color_hex,
                      }}
                      className="mt-2 grid grid-cols-3 gap-1.5"
                    >
                      <input
                        type="hidden"
                        name="size"
                        value={variant.size ?? ""}
                      />
                      {/* Antes eran tres casillas idénticas y sin nombre: solo
                          «Existencias» decide lo que se puede vender. «Aviso
                          bajo» solo marca la variante para el inventario
                          (inventory.ts: available <= min_stock) y «Costo» va al
                          margen del pedido (finance.ts: unitCost). */}
                      <label>
                        <span className="label">Existencias</span>
                        <input
                          name="stock"
                          type="number"
                          min={0}
                          defaultValue={variant.stock}
                          className="field px-1.5 py-1 text-center font-mono text-xs"
                        />
                      </label>
                      <label>
                        <span className="label">Aviso bajo</span>
                        <input
                          name="min_stock"
                          type="number"
                          min={0}
                          defaultValue={variant.min_stock}
                          className="field px-1.5 py-1 text-center font-mono text-xs"
                        />
                      </label>
                      <label>
                        <span className="label">Costo</span>
                        <input
                          name="cost_ves"
                          type="number"
                          min={0}
                          step="0.01"
                          defaultValue={variant.cost_ves}
                          className="field px-1.5 py-1 text-center font-mono text-xs"
                        />
                      </label>
                      <button type="submit" className="btn btn-sm col-span-3">
                        Guardar
                      </button>
                    </ActionForm>

                    <ActionForm
                      action={deleteVariantAction}
                      hiddenFields={{ id: variant.id }}
                      className="mt-1.5"
                    >
                      <button
                        type="submit"
                        className="font-mono text-[0.62rem] text-ink-500 uppercase hover:text-ink hover:underline"
                      >
                        Eliminar variante
                      </button>
                    </ActionForm>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Añadir variante" hint="Para tallas o colores sueltos.">
            <ActionForm action={saveVariantAction} hiddenFields={{ product_id: product.id }}>
              <div className="grid grid-cols-2 gap-2">
                <label>
                  <span className="label">Talla</span>
                  <input
                    name="size"
                    placeholder="M, G, XL"
                    className="field px-2 py-1.5 text-sm"
                  />
                </label>
                <label>
                  <span className="label">Color</span>
                  <input
                    name="color"
                    placeholder="Negro"
                    className="field px-2 py-1.5 text-sm"
                  />
                </label>
                <label>
                  <span className="label">Color hex</span>
                  <input
                    name="color_hex"
                    type="text"
                    placeholder="#000000"
                    className="field px-2 py-1.5 font-mono text-xs"
                  />
                </label>
                <label>
                  <span className="label">Existencias</span>
                  <input
                    name="stock"
                    type="number"
                    min={0}
                    defaultValue={0}
                    className="field px-2 py-1.5 font-mono text-xs"
                  />
                </label>
                <label>
                  <span className="label">Aviso bajo</span>
                  <input
                    name="min_stock"
                    type="number"
                    min={0}
                    defaultValue={2}
                    className="field px-2 py-1.5 font-mono text-xs"
                  />
                </label>
                <label>
                  <span className="label">Costo</span>
                  <input
                    name="cost_ves"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={0}
                    className="field px-2 py-1.5 font-mono text-xs"
                  />
                </label>
                <label>
                  <span className="label">Precio extra</span>
                  <input
                    name="price_delta_ves"
                    type="number"
                    defaultValue={0}
                    className="field px-2 py-1.5 font-mono text-xs"
                  />
                </label>
                <label className="flex items-center gap-2 self-end pb-1.5">
                  <input
                    name="is_active"
                    type="checkbox"
                    defaultChecked
                    className="size-4 accent-[#6b201a]"
                  />
                  <span className="label mb-0">Activa</span>
                </label>
              </div>
              <button type="submit" className="btn btn-sm btn-solid mt-3 w-full">
                Añadir variante
              </button>
            </ActionForm>
          </Card>

          <Card title="Resumen rápido">
            <dl className="space-y-2 text-sm">
              {[
                ["Precio", formatVes(product.base_price_ves)],
                ["Costo", formatVes(product.cost_ves)],
                [
                  "Unidades",
                  formatVes(variants.reduce((acc, v) => acc + v.stock, 0)),
                ],
                [
                  "Reservadas",
                  formatVes(variants.reduce((acc, v) => acc + v.reserved_stock, 0)),
                ],
                ["Imágenes", String(images.length)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-ink-600">{label}</dt>
                  <dd className="font-mono text-xs font-bold tabular">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </aside>
      </div>
    </>
  );
}
