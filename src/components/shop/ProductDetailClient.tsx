"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ImageOff, Minus, Plus, Ruler, ShoppingBag } from "lucide-react";
import { PriceDisplay } from "@/components/currency/PriceDisplay";
import { useCart } from "@/components/cart/CartContext";
import { useToast } from "@/components/ui/Toast";
import { cn, formatVes } from "@/lib/utils";
import { techniqueLabel } from "@/lib/types";
import type { PricedProduct } from "@/lib/types";

/** Etiqueta corta de una variante para mostrarla en el carrito. */
function variantLabel(size: string | null, color: string | null): string {
  const parts = [size ?? "Única", color].filter(Boolean);
  return parts.join(" · ");
}

export function ProductDetailClient({ product }: { product: PricedProduct }) {
  const { add } = useCart();
  const { toast } = useToast();

  const active = product.variants.filter((v) => v.is_active);
  const colors = useMemo(() => {
    const map = new Map<string, string>();
    for (const variant of active) if (variant.color) map.set(variant.color, variant.color_hex ?? "#FFFFFF");
    return [...map.entries()];
  }, [active]);

  const firstAvailable =
    active.find((v) => v.stock - v.reserved_stock > 0) ?? active[0] ?? null;

  const [color, setColor] = useState<string | null>(firstAvailable?.color ?? colors[0]?.[0] ?? null);
  const [size, setSize] = useState<string | null>(firstAvailable?.size ?? null);
  const [quantity, setQuantity] = useState(1);

  // Todas las imágenes del producto (portada y galería) son las que se
  // muestran en la ficha; el visor 360° está en pausa por ahora.
  const gallery = product.images;

  const available = useMemo(
    () =>
      active.filter(
        (v) =>
          (!color || v.color === color) && (!size || v.size === size),
      ),
    [active, color, size],
  );

  const selected = available[0] ?? null;
  const stock = selected ? Math.max(0, selected.stock - selected.reserved_stock) : 0;
  const maxQuantity = Math.max(1, Math.min(10, stock));
  const unitPrice =
    selected && selected.price_delta_ves
      ? product.price_ves + selected.price_delta_ves
      : product.price_ves;
  const listPrice =
    selected && selected.price_delta_ves
      ? product.list_price_ves + selected.price_delta_ves
      : product.list_price_ves;

  const sizes = useMemo(() => {
    const seen: string[] = [];
    for (const variant of active) {
      const value = variant.size ?? "Única";
      if (!seen.includes(value)) seen.push(value);
    }
    return seen;
  }, [active]);

  const onAdd = () => {
    if (!selected) {
      toast("Elige talla y color", { tone: "error" });
      return;
    }
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        variantId: selected.id,
        variantLabel: variantLabel(selected.size, selected.color),
        image: product.images[0]?.url ?? null,
        unitPrice,
        listPrice,
        maxQuantity,
        collection: product.collections[0]?.name ?? null,
      },
      quantity,
    );
    toast("Añadido al carrito", {
      detail: `${quantity} × ${product.name} · ${variantLabel(selected.size, selected.color)}`,
    });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_26rem]">
      {/* --------- Fotos --------- */}
      <div>
        <div className="grid gap-4 sm:grid-cols-2">
          {gallery.map((image, index) => (
            <div
              key={image.id}
              className={cn(
                "card-dark overflow-hidden",
                index === 0 && "sm:col-span-2",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.alt ?? product.name}
                loading={index === 0 ? "eager" : "lazy"}
                className="aspect-square w-full object-cover"
              />
            </div>
          ))}
          {gallery.length === 0 && (
            <span className="card-dark grid aspect-square place-items-center text-ink-400 sm:col-span-2">
              <ImageOff className="size-10" />
            </span>
          )}
        </div>
      </div>

      {/* --------- Compra --------- */}
      <div className="lg:sticky lg:top-32 lg:self-start">
        {product.collections.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {product.collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/colecciones/${collection.slug}`}
                className="tag text-ink-300 transition-colors hover:border-ember-400 hover:bg-ember-600 hover:text-paper"
              >
                {collection.name}
              </Link>
            ))}
          </div>
        )}

        <h1 className="font-display text-4xl leading-[0.9] sm:text-5xl">{product.name}</h1>
        {product.subtitle && (
          <p className="mt-2 text-sm leading-relaxed text-ink-300">{product.subtitle}</p>
        )}

        <div className="mt-5 rounded-2xl bg-ink-900/60 p-4">
          <div className="flex items-end justify-between gap-3">
            <PriceDisplay ves={unitPrice} size="xl" className="text-ember-400" />
            {listPrice > unitPrice && (
              <span className="font-mono text-sm text-ink-400 line-through">
                {formatVes(listPrice)}
              </span>
            )}
          </div>
          {product.promotion && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-ember-600 px-2.5 py-1 font-mono text-[0.6rem] font-bold tracking-wider text-paper uppercase">
              Promo: {product.promotion.name} −
              {product.promotion.kind === "percent"
                ? `${product.promotion.value}%`
                : formatVes(product.promotion.value)}
            </p>
          )}
        </div>

        {/* Talla */}
        {sizes.length > 0 && sizes[0] !== "Única" && (
          <div className="mt-6">
            <p className="label flex items-center gap-1.5">
              <Ruler className="size-3" /> Talla
              {size && <span className="font-normal text-ink-400 normal-case">· {size}</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((value) => {
                const inStock = active.some(
                  (v) => v.size === value && (!color || v.color === color) && v.stock - v.reserved_stock > 0,
                );
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!inStock}
                    onClick={() => setSize(value)}
                    className={cn(
                      "min-w-11 rounded-lg px-3 py-2 font-mono text-xs font-bold transition-all duration-200",
                      size === value
                        ? "bg-ember-600 text-paper shadow-ember"
                        : "border border-ink-800 text-ink-200 hover:border-ember-400 hover:bg-ember-950/60",
                      !inStock && "cursor-not-allowed opacity-30 line-through",
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Color */}
        {colors.length > 0 && (
          <div className="mt-5">
            <p className="label">
              Color{color && <span className="font-normal text-ink-400 normal-case">· {color}</span>}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {colors.map(([name, hex]) => {
                const inStock = active.some(
                  (v) => v.color === name && (!size || v.size === size) && v.stock - v.reserved_stock > 0,
                );
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={!inStock}
                    onClick={() => setColor(name)}
                    title={name}
                    aria-label={`Color ${name}`}
                    aria-pressed={color === name}
                    className={cn(
                      "grid size-9 place-items-center rounded-full border transition-all duration-200",
                      color === name
                        ? "border-ember-600 ring-2 ring-ember-600 ring-offset-2 ring-offset-ink-950"
                        : "border-ink-700 hover:border-ink-400",
                      !inStock && "cursor-not-allowed opacity-25",
                    )}
                    style={{ backgroundColor: hex }}
                  >
                    {color === name &&
                      (hex.toUpperCase() === "#000000" ? (
                        <Check className="size-4 text-paper" strokeWidth={3} />
                      ) : (
                        <Check className="size-4 text-ink-950" strokeWidth={3} />
                      ))}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Cantidad */}
        <div className="mt-7 flex items-stretch gap-0">
          <div className="flex items-center rounded-full border border-ink-800">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Quitar una unidad"
              className="grid size-11 place-items-center rounded-full text-paper transition-colors hover:border-paper hover:bg-paper hover:text-ember-600 active:border-paper active:bg-paper active:text-ember-600 focus-visible:border-paper focus-visible:bg-paper focus-visible:text-ember-600 disabled:opacity-30"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="grid w-11 place-items-center border-x border-ink-800 font-mono text-sm tabular text-ink-200">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity}
              aria-label="Añadir una unidad"
              className="grid size-11 place-items-center rounded-full text-paper transition-colors hover:border-paper hover:bg-paper hover:text-ember-600 active:border-paper active:bg-paper active:text-ember-600 focus-visible:border-paper focus-visible:bg-paper focus-visible:text-ember-600 disabled:opacity-30"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <p className="ml-3 self-center font-mono text-[0.65rem] text-ink-400">
            {stock > 0 ? `${stock} disponibles` : "Sin stock"}
            {selected?.sku ? ` · ${selected.sku}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={stock === 0 || !selected}
          className="btn btn-light btn-lg mt-5 w-full"
        >
          <ShoppingBag className="size-4" />
          {stock === 0 ? "Agotado por ahora" : "Añadir al carrito"}
        </button>

        {product.min_order_qty > 1 && (
          <p className="hint">
            Pedido mínimo de {product.min_order_qty} unidades. Para pedidos al
            mayoreo o uniformes,{" "}
            <Link href="/diseno-a-medida" className="link-underline font-semibold text-ember-400">
              cuéntanos tu cantidad
            </Link>
            .
          </p>
        )}

        {/* Volumen */}
        {product.bulk_prices.length > 0 && (
          <div className="card-dark mt-6 overflow-hidden">
            <p className="bg-ink-900 px-3.5 py-2.5 font-mono text-[0.6rem] font-bold tracking-[0.14em] text-paper uppercase">
              Precio por volumen
            </p>
            <ul className="divide-y divide-ink-800">
              {product.bulk_prices.map((tier) => (
                <li key={tier.min_qty} className="flex items-center justify-between px-3.5 py-2.5 text-sm">
                  <span className="font-mono text-xs">Desde {tier.min_qty} uds.</span>
                  <span className="font-semibold text-ember-400 tabular">{formatVes(tier.unit_price_ves)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ficha técnica */}
        <dl className="mt-6 divide-y divide-ink-800 text-sm">
          {[
            ["Prenda", product.garment_type],
            ["Tela", product.material],
            ["Estampado", product.print_technique ? techniqueLabel(product.print_technique) : null],
            ["Corte", product.fit],
            ["Preparación", `${product.lead_time_days} días`],
            ["Peso", product.weight_grams ? `${product.weight_grams} g` : null],
          ]
            .filter(([, value]) => Boolean(value))
            .map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-2.5">
                <dt className="font-mono text-[0.65rem] tracking-wider text-ink-400 uppercase">
                  {label}
                </dt>
                <dd className="text-right font-medium text-ink-200">{value}</dd>
              </div>
            ))}
        </dl>

        {product.description && (
          <div className="mt-6">
            <h2 className="mb-2 font-display text-xl">El detalle</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line text-ink-300">
              {product.description}
            </p>
          </div>
        )}

        {product.care_instructions && (
          <p className="hint mt-4 rounded-xl bg-ink-900/60 p-3.5 text-ink-300">
            <strong className="font-bold uppercase">Cuidado:</strong> {product.care_instructions}
          </p>
        )}
      </div>
    </div>
  );
}