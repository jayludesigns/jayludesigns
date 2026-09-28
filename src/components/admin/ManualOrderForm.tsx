"use client";

import { useActionState, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, TriangleAlert } from "lucide-react";

import { createManualOrderAction, type AdminResult } from "@/app/admin/actions";
import { adminIdle } from "@/components/admin/ActionForm";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";
import { formatVes } from "@/lib/utils";

/** Datos mínimos del catálogo que necesita el editor de líneas. */
export interface ManualProduct {
  id: string;
  name: string;
  sku: string | null;
  price_ves: number;
  variants: { id: string; label: string; available: number }[];
}

interface Line {
  key: number;
  productId: string;
  variantId: string;
  quantity: number;
}

let nextKey = 1;

const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as (keyof typeof PAYMENT_METHOD_LABELS)[];

const inputClass = "field py-1.5 text-sm";

/**
 * Alta de pedidos sin cliente en la tienda.
 *
 * Sirve sobre todo para uniformes, grupos y eventos: la cotización llega por
 * teléfono o en persona y hay que meterla al sistema para que el taller la vea
 * y para que el cliente pueda rastrearla igual que una compra online.
 *
 * Los importes que se muestran son una cortesía: los definitivos los calcula
 * `createOrder` en el servidor, con las promociones vigentes.
 */
export function ManualOrderForm({
  products,
  rate,
}: {
  products: ManualProduct[];
  rate: number;
}) {
  const [lines, setLines] = useState<Line[]>([
    { key: nextKey++, productId: products[0]?.id ?? "", variantId: "", quantity: 1 },
  ]);
  const [state, formAction, pending] = useActionState<AdminResult, FormData>(
    createManualOrderAction,
    adminIdle,
  );

  const byId = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  // La estimación usa el precio del producto, sin el ajuste por talla o color:
  // es una Orientación mientras se escribe, y al guardar el servidor recalcula
  // la línea entera contra la base de datos.
  const estimate = lines.reduce((acc, line) => {
    const product = byId.get(line.productId);
    if (!product) return acc;
    return acc + product.price_ves * Math.max(0, line.quantity);
  }, 0);

  function addLine() {
    setLines((current) => [
      ...current,
      { key: nextKey++, productId: products[0]?.id ?? "", variantId: "", quantity: 1 },
    ]);
  }

  function patchLine(key: number, changes: Partial<Line>) {
    setLines((current) =>
      current.map((line) => {
        if (line.key !== key) return line;
        const next = { ...line, ...changes };
        // Al cambiar de producto, la variante anterior deja de tener sentido.
        if (changes.productId && changes.productId !== line.productId) next.variantId = "";
        return next;
      }),
    );
  }

  function removeLine(key: number) {
    setLines((current) => (current.length === 1 ? current : current.filter((l) => l.key !== key)));
  }

  const payload = lines.map((line) => ({
    productId: line.productId,
    variantId: line.variantId || null,
    quantity: Number(line.quantity) || 0,
  }));

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="lines" value={JSON.stringify(payload)} />

      {state.message.length > 0 && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className="flex items-start gap-2.5 rounded-xl border-2 border-ink-300 bg-ink-50 p-3 text-sm font-semibold"
        >
          {state.status === "error" ? (
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          ) : null}
          {state.message}
        </p>
      )}

      {/* ---------- Productos ---------- */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-200 bg-ink-50 px-4 py-2.5">
          <h2 className="font-mono text-[0.65rem] font-bold tracking-[0.16em] uppercase">
            Artículos
          </h2>
          <button type="button" onClick={addLine} className="btn btn-sm">
            <Plus className="size-3.5" />
            Añadir línea
          </button>
        </div>

        <div className="space-y-2 p-4">
          {lines.map((line) => {
            const product = byId.get(line.productId);
            return (
              <div
                key={line.key}
                className="grid gap-2 border border-ink-200 p-2.5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_5rem_5rem_auto] sm:items-end"
              >
                <div>
                  <label className="label" htmlFor={`p-${line.key}`}>
                    Producto
                  </label>
                  <select
                    id={`p-${line.key}`}
                    className={inputClass}
                    value={line.productId}
                    onChange={(event) => patchLine(line.key, { productId: event.target.value })}
                  >
                    {products.length === 0 && <option value="">Sin productos</option>}
                    {products.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                        {option.sku ? ` · ${option.sku}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label" htmlFor={`v-${line.key}`}>
                    Talla / color
                  </label>
                  <select
                    id={`v-${line.key}`}
                    className={inputClass}
                    value={line.variantId}
                    onChange={(event) => patchLine(line.key, { variantId: event.target.value })}
                  >
                    <option value="">Sin variante</option>
                    {product?.variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.label} · {variant.available} disp.
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label" htmlFor={`q-${line.key}`}>
                    Cant.
                  </label>
                  <input
                    id={`q-${line.key}`}
                    type="number"
                    min={1}
                    className={`${inputClass} text-center font-mono`}
                    value={line.quantity}
                    onChange={(event) =>
                      patchLine(line.key, { quantity: Number(event.target.value) || 0 })
                    }
                  />
                </div>

                <div>
                  <span className="label">Subtotal</span>
                  <p className="py-1.5 text-center font-mono text-xs font-bold tabular">
                    {product ? formatVes(product.price_ves * (line.quantity || 0)) : "—"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeLine(line.key)}
                  disabled={lines.length === 1}
                  title="Quitar línea"
                  className="btn btn-sm justify-self-end disabled:opacity-30"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <p className="border-t border-ink-200 px-4 py-3 text-sm">
          <span className="text-ink-600">Estimado sin promociones ni envío: </span>
          <strong className="font-mono tabular">{formatVes(estimate)}</strong>
          <span className="ml-2 font-mono text-[0.62rem] text-ink-500">
            ≈ {formatVes(rate > 0 ? estimate / rate : 0, "€")}
          </span>
        </p>
      </section>

      {/* ---------- Cliente ---------- */}
      <section className="grid gap-4 card p-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="font-mono text-[0.65rem] font-bold tracking-[0.16em] uppercase">
            Quién recibe
          </h2>
          <div>
            <label htmlFor="customerName" className="label">
              Nombre <span className="text-ink-500">*</span>
            </label>
            <input id="customerName" name="customerName" required className={inputClass} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="customerPhone" className="label">
                Teléfono <span className="text-ink-500">*</span>
              </label>
              <input
                id="customerPhone"
                name="customerPhone"
                required
                inputMode="tel"
                placeholder="0412-1234567"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="customerEmail" className="label">
                Correo
              </label>
              <input id="customerEmail" name="customerEmail" type="email" className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="address" className="label">Dirección</label>
            <input id="address" name="address" className={inputClass} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className="label">Ciudad</label>
              <input id="city" name="city" className={inputClass} />
            </div>
            <div>
              <label htmlFor="state" className="label">Estado</label>
              <input id="state" name="state" className={inputClass} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-mono text-[0.65rem] font-bold tracking-[0.16em] uppercase">
            Pago y envío
          </h2>
          <div>
            <label htmlFor="paymentMethod" className="label">Método de pago</label>
            <select id="paymentMethod" name="paymentMethod" defaultValue="efectivo" className={inputClass}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="couponCode" className="label">Cupón</label>
            <input
              id="couponCode"
              name="couponCode"
              placeholder="Código, si aplica"
              className={`${inputClass} font-mono uppercase`}
            />
          </div>
          <div>
            <label htmlFor="notes" className="label">Notas del pedido</label>
            <textarea id="notes" name="notes" rows={3} className={inputClass} />
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-ink-200 p-2.5 text-sm">
            <input
              type="checkbox"
              name="markAsPaid"
              defaultChecked
              className="mt-0.5 size-4 accent-[#6b201a]"
            />
            <span>
              <span className="block font-semibold leading-tight">Ya está pagado</span>
              <span className="mt-0.5 block text-xs text-ink-500">
                Se registra como pagado y descuenta el stock reservado.
              </span>
            </span>
          </label>
        </div>
      </section>

      <button type="submit" disabled={pending} className="btn btn-solid btn-lg">
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? "Creando pedido…" : "Crear pedido"}
      </button>
    </form>
  );
}
