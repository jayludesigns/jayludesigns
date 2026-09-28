"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import { EmptyState } from "@/components/shop/EmptyState";
import { PriceDisplay } from "@/components/currency/PriceDisplay";
import { useToast } from "@/components/ui/Toast";
import { formatVes, round2 } from "@/lib/utils";

export function CartClient({
  shippingFlat,
  freeOver,
  whatsapp,
}: {
  shippingFlat: number;
  freeOver: number;
  whatsapp: string;
}) {
  const { items, subtotal, savings, setQuantity, remove, clear } = useCart();
  const { toast } = useToast();
  const [coupon, setCoupon] = useState("");

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Tu carrito está vacío"
        description="Mira el catálogo o cuéntanos qué quieres estampar: también hacemos pedidos a medida desde una unidad."
        actions={
          <>
            <Link href="/catalogo" className="btn btn-solid btn-lg">
              Ver catálogo
            </Link>
            <Link href="/diseno-a-medida" className="btn btn-lg">
              Diseño a medida
            </Link>
          </>
        }
      />
    );
  }

  const missingForFree = Math.max(0, freeOver - subtotal);
  const shipping = freeOver > 0 && subtotal >= freeOver ? 0 : shippingFlat;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
      {/* -------- Líneas -------- */}
      <div>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.key} className="card flex gap-4 p-4">
              <Link
                href={`/producto/${item.slug}`}
                className="w-24 shrink-0 overflow-hidden rounded-lg bg-ink-50 sm:w-28"
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                ) : null}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {item.collection && (
                      <p className="font-mono text-[0.55rem] tracking-[0.16em] text-ink-500 uppercase">
                        {item.collection}
                      </p>
                    )}
                    <h3 className="font-display text-lg leading-tight">
                      <Link href={`/producto/${item.slug}`} className="link-underline">
                        {item.name}
                      </Link>
                    </h3>
                    <p className="mt-0.5 font-mono text-[0.62rem] text-ink-500">
                      {item.variantLabel}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      remove(item.key);
                      toast("Quitado del carrito", { detail: item.name });
                    }}
                    aria-label={`Quitar ${item.name}`}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-ink-500 transition-colors hover:bg-ink-50 hover:text-ember-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                  <div className="flex items-center rounded-full border border-ink-200">
                    <button
                      type="button"
                      onClick={() => setQuantity(item.key, item.quantity - 1)}
                      aria-label="Quitar una unidad"
                      className="grid size-8 place-items-center rounded-full transition-colors hover:bg-ember-600 hover:text-paper"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="grid w-9 place-items-center border-x border-ink-100 font-mono text-xs tabular">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(item.key, item.quantity + 1)}
                      disabled={item.quantity >= item.maxQuantity}
                      aria-label="Añadir una unidad"
                      className="grid size-8 place-items-center rounded-full transition-colors hover:bg-ember-600 hover:text-paper disabled:opacity-30"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <PriceDisplay
                      ves={round2(item.unitPrice * item.quantity)}
                      size="md"
                      align="right"
                      className="text-ember-600"
                    />
                    {item.quantity > 1 && (
                      <p className="font-mono text-[0.58rem] text-ink-500">
                        {formatVes(item.unitPrice)} c/u
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/catalogo" className="btn btn-sm">
            Seguir comprando
          </Link>
          <button
            type="button"
            onClick={() => {
              clear();
              toast("Carrito vaciado");
            }}
            className="text-xs font-bold tracking-wider text-ink-500 uppercase transition-colors hover:text-ember-600"
          >
            Vaciar carrito
          </button>
        </div>
      </div>

      {/* -------- Resumen -------- */}
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="card overflow-hidden">
          <p className="bg-ink-950 px-4 py-3 font-mono text-[0.62rem] font-bold tracking-[0.18em] text-paper uppercase">
            Resumen
          </p>

          <div className="space-y-2.5 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-600">Subtotal</span>
              <span className="font-semibold tabular">{formatVes(subtotal)}</span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-600">Ahorras con promociones</span>
                <span className="font-semibold text-ember-600 tabular">−{formatVes(savings)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-600">Envío</span>
              <span className="font-semibold tabular">
                {shipping === 0 ? "Gratis" : formatVes(shipping)}
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-ink-100 pt-3">
              <span className="font-bold">Total estimado</span>
              <PriceDisplay
                ves={round2(subtotal + shipping)}
                size="lg"
                align="right"
                className="text-ember-600"
              />
            </div>
          </div>

          {freeOver > 0 && missingForFree > 0 && (
            <p className="border-t border-ink-100 bg-ember-50 px-4 py-3 text-xs text-ember-900">
              Te faltan{" "}
              <strong className="tabular">{formatVes(missingForFree)}</strong> para el
              envío gratis.
            </p>
          )}

          <div className="border-t border-ink-100 p-4">
            <label htmlFor="coupon" className="label">
              Código de descuento
            </label>
            <div className="flex gap-2">
              <input
                id="coupon"
                value={coupon}
                onChange={(event) => setCoupon(event.target.value.toUpperCase())}
                placeholder="JAYLU10"
                className="field font-mono text-sm uppercase"
              />
              <Link
                href={
                  coupon.trim()
                    ? `/checkout?cupon=${encodeURIComponent(coupon.trim())}`
                    : "/checkout"
                }
                className="btn btn-ink shrink-0 px-4"
                aria-label="Aplicar código"
              >
                →
              </Link>
            </div>
            <p className="hint">
              El descuento se confirma al registrar el pedido.
            </p>
          </div>

          <div className="border-t border-ink-100 p-4">
            <Link href="/checkout" className="btn btn-solid btn-lg w-full">
              Finalizar pedido
            </Link>
            {whatsapp && (
              <a
                href={`https://wa.me/58${whatsapp.replace(/\D/g, "").replace(/^58/, "")}`}
                target="_blank"
                rel="noreferrer noopener"
                className="btn mt-2 w-full"
              >
                Pedir por WhatsApp
              </a>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
