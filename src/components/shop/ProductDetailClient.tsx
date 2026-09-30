"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ImageOff, Maximize2, Minus, Plus, Ruler, ShoppingBag } from "lucide-react";
import { PriceDisplay } from "@/components/currency/PriceDisplay";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { useCart } from "@/components/cart/CartContext";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { techniqueLabel } from "@/lib/types";
import type { PricedProduct, Variant } from "@/lib/types";

/** Etiqueta corta de una variante para mostrarla en el carrito. */
function variantLabel(size: string | null, color: string | null): string {
  const parts = [size ?? "Única", colorLabel(color)].filter(Boolean);
  return parts.join(" · ");
}

/**
 * El nombre del color se guarda tal como se escribió en el panel ("negro",
 * "AZUL REY"), pero al cliente se le muestra con la primera letra en mayúscula
 * para que no se lea como un dato suelto.
 */
function colorLabel(color: string | null): string {
  if (!color) return "";
  return color.charAt(0).toLocaleUpperCase("es") + color.slice(1);
}

/** Talla normalizada: las variantes sin talla se agrupan como "Única". */
function sizeKey(size: string | null): string {
  return size ?? "Única";
}

export function ProductDetailClient({ product }: { product: PricedProduct }) {
  const { add } = useCart();
  const { toast } = useToast();

  const active = useMemo(
    () => product.variants.filter((v) => v.is_active),
    [product.variants],
  );
  const hayStock = (variant: Variant) => variant.stock - variant.reserved_stock > 0;

  const colors = useMemo(() => {
    const map = new Map<string, string>();
    for (const variant of active) {
      if (variant.color) map.set(variant.color, variant.color_hex ?? "#FFFFFF");
    }
    return [...map.entries()];
  }, [active]);

  const firstAvailable = useMemo(
    () => active.find(hayStock) ?? active[0] ?? null,
    [active],
  );

  const [color, setColor] = useState<string | null>(
    firstAvailable?.color ?? colors[0]?.[0] ?? null,
  );
  const [size, setSize] = useState<string | null>(firstAvailable?.size ?? null);
  const [quantity, setQuantity] = useState(1);

  // Todas las imágenes del producto (portada y galería) son las que se
  // muestran en la ficha; el visor 360° está en pausa por ahora.
  const gallery = product.images;
  const [foto, setFoto] = useState(0);
  const [lupa, setLupa] = useState(false);

  const available = useMemo(
    () =>
      active.filter(
        (v) => v.color === color && sizeKey(v.size) === sizeKey(size),
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
      const value = sizeKey(variant.size);
      if (!seen.includes(value)) seen.push(value);
    }
    return seen;
  }, [active]);

  /* ---------------------------------------------------------------- */
  /* Tallas y colores: sin callejones sin salida                        */
  /* ---------------------------------------------------------------- */

  // Qué opciones tienen existencias, mirando solo su propia variante. La
  // lista NO se cruza con la opción ya elegida: al cruzarse, un producto con
  // combinaciones sueltas (L·negro y M·azul rey, sin las otras dos) quedaba
  // bloqueado, porque elegir una tachaba la otra y no había forma de llegar
  // a la segunda. Ahora se puede saltar a cualquier talle o color con stock y
  // el otro selector se ajusta solo.
  const conStock = useMemo(() => active.filter(hayStock), [active]);
  const tallasConStock = useMemo(
    () => new Set(conStock.map((v) => sizeKey(v.size))),
    [conStock],
  );
  const coloresConStock = useMemo(
    () =>
      new Set(
        conStock
          .map((v) => v.color)
          .filter((value): value is string => Boolean(value)),
      ),
    [conStock],
  );

  const elegirTalla = (valor: string) => {
    setSize(valor);
    if (!color || conStock.some((v) => sizeKey(v.size) === valor && v.color === color)) {
      return;
    }
    const plan = conStock.find((v) => sizeKey(v.size) === valor);
    if (plan) setColor(plan.color);
  };

  const elegirColor = (nombre: string) => {
    setColor(nombre);
    if (conStock.some((v) => v.color === nombre && sizeKey(v.size) === sizeKey(size))) {
      return;
    }
    const plan = conStock.find((v) => v.color === nombre);
    if (plan) setSize(plan.size);
  };

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

  const ficha = [
    ["Prenda", product.garment_type],
    ["Tela", product.material],
    ["Estampado", product.print_technique ? techniqueLabel(product.print_technique) : null],
    ["Corte", product.fit],
    ["Preparación", `${product.lead_time_days} días`],
    ["Peso", product.weight_grams ? `${product.weight_grams} g` : null],
  ].filter(([, value]) => Boolean(value)) as [string, string][];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_25rem] xl:gap-7">
      {/* --------- Fotos: una grande y las miniaturas; al pulsar, la lupa --- */}
      <div className="flex flex-col gap-2.5">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => gallery.length > 0 && setLupa(true)}
            className="card-dark group relative block max-w-full overflow-hidden text-left"
            aria-label={gallery.length > 0 ? "Ampliar la foto" : undefined}
          >
            {foto < gallery.length ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={gallery[foto].url}
                  alt={gallery[foto].alt ?? product.name}
                  loading="eager"
                  // La foto se ajusta al hueco y nunca se recorta: el alto se
                  // topa con el de la pantalla para que la prenda entera y el
                  // bloque de compra quepan sin desplazar, y «contain» evita
                  // que se corte ni un centímetro (las prendas se
                  // fotografiaron en 4:5, 1080×1350).
                  className="block max-h-[min(74vh,44rem)] max-w-full object-contain"
                />
                <span className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-ink-950/85 px-3 py-1.5 font-mono text-[0.6rem] font-bold tracking-[0.14em] text-paper uppercase opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Maximize2 className="size-3" />
                  Ampliar
                </span>
              </>
            ) : (
              <span className="grid aspect-4/5 w-64 place-items-center text-ink-400">
                <ImageOff className="size-10" />
              </span>
            )}
          </button>
        </div>

        {gallery.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            {gallery.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setFoto(index)}
                onDoubleClick={() => setLupa(true)}
                aria-label={`Foto ${index + 1} de ${gallery.length}`}
                aria-pressed={foto === index}
                className={cn(
                  "size-14 shrink-0 overflow-hidden border transition-colors sm:size-16",
                  foto === index
                    ? "border-ember-600"
                    : "border-ink-800 hover:border-ink-400",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* --------- Compra --------- */}
      <div className="lg:sticky lg:top-28 lg:self-start">
        {product.collections.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
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

        <h1 className="font-display text-3xl leading-[0.9] sm:text-4xl">{product.name}</h1>
        {product.subtitle && (
          <p className="mt-1.5 text-sm leading-snug text-ink-300">{product.subtitle}</p>
        )}

        <div className="mt-3.5 rounded-2xl bg-ink-900/60 p-3.5">
          <div className="flex items-end justify-between gap-3">
            <PriceDisplay ves={unitPrice} size="xl" className="text-ember-400" />
            {listPrice > unitPrice && (
              <PriceDisplay
                ves={listPrice}
                size="sm"
                strike
                dim
                className="pb-1 text-ink-400"
              />
            )}
          </div>
          {product.promotion && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-ember-600 px-2.5 py-1 font-mono text-[0.62rem] font-bold tracking-wider text-paper uppercase">
              Promo: {product.promotion.name} −
              {product.promotion.kind === "percent" ? (
                `${product.promotion.value}%`
              ) : (
                <PriceDisplay
                  ves={product.promotion.value}
                  size="sm"
                  inline
                  secondaryClassName="text-paper/70"
                  className="[&>span]:text-[0.62rem] [&>span]:font-bold"
                />
              )}
            </p>
          )}
        </div>

        {/* Talla */}
        {sizes.length > 0 && sizes[0] !== "Única" && (
          <div className="mt-4">
            <p className="label flex items-center gap-1.5">
              <Ruler className="size-3" /> Talla
              {size && <span className="font-normal text-ink-400 normal-case">· {size}</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((value) => {
                const inStock = tallasConStock.has(value);
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!inStock}
                    onClick={() => elegirTalla(value)}
                    className={cn(
                      "min-w-10 rounded-lg px-2.5 py-1.5 font-mono text-xs font-bold transition-all duration-200",
                      size === value
                        ? "bg-ember-600 text-paper shadow-ember"
                        : "border border-ink-800 text-ink-200 hover:border-ember-400 hover:bg-ink-950/60",
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
          <div className="mt-3.5">
            <p className="label">
              Color
              {color && (
                <span className="font-normal text-ink-400 normal-case">
                  · {colorLabel(color)}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {colors.map(([name, hex]) => {
                const inStock = coloresConStock.has(name);
                return (
                  <button
                    key={name}
                    type="button"
                    disabled={!inStock}
                    onClick={() => elegirColor(name)}
                    title={inStock ? colorLabel(name) : `${colorLabel(name)} · agotado`}
                    aria-label={`Color ${colorLabel(name)}`}
                    aria-pressed={color === name}
                    className={cn(
                      "grid size-8 place-items-center rounded-full border transition-all duration-200",
                      color === name
                        ? "border-ember-600 ring-2 ring-ember-600 ring-offset-2 ring-offset-ink-950"
                        : "border-ink-700 hover:border-ink-400",
                      !inStock && "cursor-not-allowed opacity-25",
                    )}
                    style={{ backgroundColor: hex }}
                  >
                    {color === name &&
                      (hex.toUpperCase() === "#000000" ? (
                        <Check className="size-3.5 text-paper" strokeWidth={3} />
                      ) : (
                        <Check className="size-3.5 text-ink-950" strokeWidth={3} />
                      ))}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Cantidad */}
        <div className="mt-4 flex items-stretch gap-0">
          <div className="flex items-center rounded-full border border-ink-800">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Quitar una unidad"
              className="grid size-10 place-items-center rounded-full text-paper transition-colors hover:border-paper hover:bg-paper hover:text-ember-600 active:border-paper active:bg-paper active:text-ember-600 focus-visible:border-paper focus-visible:bg-paper focus-visible:text-ember-600 disabled:opacity-30"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="grid w-10 place-items-center border-x border-ink-800 font-mono text-sm tabular text-ink-200">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity}
              aria-label="Añadir una unidad"
              className="grid size-10 place-items-center rounded-full text-paper transition-colors hover:border-paper hover:bg-paper hover:text-ember-600 active:border-paper active:bg-paper active:text-ember-600 focus-visible:border-paper focus-visible:bg-paper focus-visible:text-ember-600 disabled:opacity-30"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
          <p className="ml-3 self-center font-mono text-[0.67rem] text-ink-400">
            {stock > 0 ? `${stock} disponibles` : "Sin stock"}
            {selected?.sku ? ` · ${selected.sku}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          disabled={stock === 0 || !selected}
          className="btn btn-light btn-lg mt-3.5 w-full"
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
          <div className="card-dark mt-4 overflow-hidden">
            <p className="bg-ink-900 px-3.5 py-2 font-mono text-[0.62rem] font-bold tracking-[0.14em] text-paper uppercase">
              Precio por volumen
            </p>
            <ul className="divide-y divide-ink-800">
              {product.bulk_prices.map((tier) => (
                <li key={tier.min_qty} className="flex items-center justify-between px-3.5 py-2 text-sm">
                  <span className="font-mono text-xs">Desde {tier.min_qty} uds.</span>
                  <PriceDisplay
                    ves={tier.unit_price_ves}
                    size="sm"
                    dim
                    className="text-ember-400"
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ficha técnica: plegada para que el bloque de compra entre entero */}
        {ficha.length > 0 && (
          <details className="group mt-4 border-t border-ink-800 pt-2.5">
            <summary className="flex cursor-pointer list-none items-center justify-between font-mono text-[0.64rem] font-bold tracking-[0.16em] text-ink-300 uppercase transition-colors hover:text-paper [&::-webkit-details-marker]:hidden">
              Ficha técnica
              <span aria-hidden className="text-ember-400 transition-all group-open:rotate-45">
                +
              </span>
            </summary>
            <dl className="mt-2.5 grid grid-cols-2 gap-x-5 gap-y-1">
              {ficha.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-2 border-b border-ink-800/70 pb-1"
                >
                  <dt className="font-mono text-[0.6rem] tracking-wider text-ink-400 uppercase">
                    {label}
                  </dt>
                  <dd className="truncate text-right text-sm font-medium text-ink-200">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        )}

        {product.description && (
          <div className="mt-4">
            <h2 className="mb-1.5 font-display text-lg">El detalle</h2>
            <p className="text-sm leading-relaxed whitespace-pre-line text-ink-300">
              {product.description}
            </p>
          </div>
        )}

        {product.care_instructions && (
          <p className="hint mt-3 rounded-xl bg-ink-900/60 p-3 text-ink-300">
            <strong className="font-bold uppercase">Cuidado:</strong> {product.care_instructions}
          </p>
        )}
      </div>

      {lupa && gallery.length > 0 && (
        <ImageLightbox
          images={gallery.map((image) => ({
            id: image.id,
            url: image.url,
            alt: image.alt,
          }))}
          index={foto}
          onIndexChange={setFoto}
          onClose={() => setLupa(false)}
          label={`Fotos de ${product.name}`}
        />
      )}
    </div>
  );
}
