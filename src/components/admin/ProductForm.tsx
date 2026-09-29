"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Save, TriangleAlert, X } from "lucide-react";

import { adminIdle, type AdminResult } from "@/components/admin/ActionForm";
import {
  CheckField,
  CheckGroup,
  SelectField,
  TagsField,
  TextAreaField,
  TextField,
} from "@/components/admin/Fields";
import { saveProductAction } from "@/app/admin/actions";
import { ProductImagesEditor } from "@/components/admin/ProductImagesEditor";
import { cn, formatVes } from "@/lib/utils";
import { PRINT_TECHNIQUES } from "@/lib/types";
import type { Category, Collection, Product, ProductImage } from "@/lib/types";

const SIZES = ["2", "4", "6", "8", "10", "12", "14", "16", "S", "M", "L", "XL", "XXL", "2XL", "3XL"];

const GARMENTS = [
  { value: "franela", label: "Franela" },
  { value: "remera", label: "Remera" },
  { value: "hoodie", label: "Hoodie" },
  { value: "sudadera", label: "Sudadera" },
  { value: "polo", label: "Polo" },
  { value: "camisa", label: "Camisa" },
  { value: "short", label: "Short" },
  { value: "accesorio", label: "Accesorio" },
];

// Solo las técnicas que el taller ofrece hoy. Cuando se sume serigrafía o
// bordado al servicio, se añaden aquí y en PRINT_TECHNIQUES a la vez.
const TECHNIQUES = [
  { value: "", label: "Sin especificar" },
  ...PRINT_TECHNIQUES.map((technique) => ({ value: technique.value, label: technique.label })),
];

/** Igual que en el servidor: "1.234,56" → 1234.56. */
function numero(raw: string): number {
  const value = Number(raw.trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? value : 0;
}

function colorsToText(product: Product | null): string {
  if (!product || product.colors.length === 0) return "Blanco #FFFFFF, Negro #000000";
  return product.colors.map((color) => `${color.name} ${color.hex}`).join(", ");
}

function bulkToText(product: Product | null): string {
  if (!product || product.bulk_prices.length === 0) return "";
  return product.bulk_prices.map((tier) => `${tier.min_qty}:${tier.unit_price_ves}`).join(", ");
}

/** Cabecera de cada bloque del formulario. */
function Bloque({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="card overflow-hidden">
      <div className="border-b border-ink-200 bg-ink-50 px-4 py-2.5">
        <h2 className="font-mono text-[0.67rem] font-bold tracking-[0.16em] uppercase">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-xs text-ink-600">{description}</p>}
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

/**
 * Formulario de producto: un solo bloque, un solo botón.
 *
 * Antes eran cuatro formularios con un «Guardar» cada uno que mandaban
 * porciones del mismo producto: si dos se pisaban, el que se guardaba al
 * último se comía al otro. Ahora todo viaja en el mismo `FormData`, incluidas
 * las imágenes, y hay un único «Guardar publicación» al final.
 *
 * Ningún campo es obligatorio a nivel de HTML. Lo único que no se puede
 * guardar es un producto sin nombre o sin precio, y eso se ve antes de
 * pulsar: el botón queda cruzado y al lado dice qué falta. Las mismas reglas
 * se repiten en `saveProductAction` (name ≥ 2, precio > 0), que es la que
 * manda.
 */
export function ProductForm({
  product,
  categories,
  collections,
  selectedCollectionIds,
  images,
}: {
  product: Product | null;
  categories: Category[];
  collections: Collection[];
  selectedCollectionIds: string[];
  images: ProductImage[];
}) {
  const router = useRouter();
  // Contador de guardados correctos: es la clave que reinicia el editor de
  // imágenes. Sin esto, la cola de imágenes seguiría viva tras guardar y el
  // siguiente guardado crearía las mismas filas otra vez.
  const [guardados, setGuardados] = useState(0);
  const [state, formAction, pending] = useActionState<AdminResult, FormData>(
    async (previous: AdminResult, formData: FormData) => {
      const result = await saveProductAction(previous, formData);
      if (result.status === "ok") setGuardados((prev) => prev + 1);
      // Al crear, la respuesta lleva la ruta del producto nuevo y el alta
      // termina ahí; al editar, basta con refrescar los datos del servidor.
      if (result.href) router.push(result.href);
      else router.refresh();
      return result;
    },
    adminIdle,
  );

  // Solo estos tres campos son controlados: los necesita el resumen de margen
  // y el botón, que cambian mientras se escribe.
  const [nombre, setNombre] = useState(product?.name ?? "");
  const [precio, setPrecio] = useState(product ? String(product.base_price_ves) : "");
  const [costo, setCosto] = useState(product ? String(product.cost_ves) : "0");

  const precioNum = numero(precio);
  const costoNum = numero(costo);
  const margen = precioNum > 0 ? ((precioNum - costoNum) / precioNum) * 100 : 0;

  const requisitos = [
    { ok: nombre.trim().length >= 2, texto: "El nombre necesita al menos 2 caracteres." },
    { ok: precioNum > 0, texto: "El precio debe ser mayor que cero." },
  ];
  const faltaAlgo = requisitos.some((requisito) => !requisito.ok);

  // Cada guardado confirma al instante que los cambios ya se ven en la tienda
  // (el backend es único: guardar = publicar), con enlace a la ficha pública.
  const storeHref = product ? `/producto/${product.slug}` : undefined;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={product?.id ?? ""} />

      {state.message.length > 0 && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={cn(
            "flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold",
            state.status === "error"
              ? "border border-ember-600 bg-ember-50 text-ember-900"
              : "border border-ink-200 bg-ink-50",
          )}
        >
          {state.status === "error" ? (
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-ember-600" />
          ) : (
            <Check className="mt-0.5 size-4 shrink-0 text-ember-600" />
          )}
          <span>
            {state.message}
            {state.status === "ok" && storeHref && (
              <Link
                href={storeHref}
                className="ml-1.5 font-bold text-ember-700 underline decoration-ember-300 underline-offset-2"
              >
                Ver en la tienda →
              </Link>
            )}
          </span>
        </p>
      )}

      {/* ---------- Ficha ---------- */}
      <Bloque title="Ficha del producto">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name="name"
            label="Nombre"
            value={nombre}
            onChange={setNombre}
            placeholder="Franela Samurai Zen"
            error={nombre.trim().length >= 2 ? undefined : state.errors?.name}
            className="sm:col-span-2"
          />
          <TextField
            name="subtitle"
            label="Subtítulo"
            value={product?.subtitle}
            placeholder="Estampado frontal y espalda"
          />
          <TextField
            name="slug"
            label="Slug"
            value={product?.slug}
            placeholder="franela-samurai-zen"
            hint={product ? `Product/${product.slug}` : "Se genera solo si lo dejas vacío."}
          />
          <TextField
            name="sku"
            label="SKU"
            value={product?.sku}
            placeholder="JLY-FRA-001"
            inputClassName="font-mono text-xs"
          />
          <SelectField
            name="category_id"
            label="Categoría"
            value={product?.category_id}
            placeholder="Sin categoría"
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          />
          <SelectField
            name="garment_type"
            label="Tipo de prenda"
            value={product?.garment_type ?? "franela"}
            options={GARMENTS}
          />
          <TextField
            name="material"
            label="Material"
            value={product?.material}
            placeholder="Algodón peinado 180 g/m²"
          />
          <SelectField
            name="print_technique"
            label="Técnica de estampado"
            value={product?.print_technique}
            options={TECHNIQUES}
          />
          <TextField name="fit" label="Corte" value={product?.fit} placeholder="Regular" />
          <TextField
            name="weight_grams"
            label="Peso (gramos)"
            type="number"
            value={product?.weight_grams}
            hint="Útil para calcular envíos."
          />
          <TextField
            name="lead_time_days"
            label="Plazo de producción (días)"
            type="number"
            value={product?.lead_time_days ?? 4}
          />
        </div>

        <TextAreaField
          name="description"
          label="Descripción"
          value={product?.description}
          rows={6}
          placeholder="Qué lleva el estampado, en qué prendas, para quién…"
          hint="Se usa en la ficha y en el SEO si no llenas el campo de abajo."
        />
        <TextAreaField
          name="care_instructions"
          label="Cuidados"
          value={product?.care_instructions}
          rows={2}
          placeholder="Lavar en reversa con agua fría. No usar secadora."
        />
      </Bloque>

      {/* ---------- Precio ---------- */}
      <Bloque title="Precio y lotes">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TextField
            name="base_price_ves"
            label="Precio base (Bs)"
            type="number"
            value={precio}
            onChange={setPrecio}
            error={precioNum > 0 ? undefined : state.errors?.base_price_ves}
          />
          <TextField
            name="compare_at_ves"
            label="Precio tachado (Bs)"
            type="number"
            value={product?.compare_at_ves}
            hint="Se ve solo si es mayor al precio."
          />
          <TextField
            name="cost_ves"
            label="Costo (Bs)"
            type="number"
            value={costo}
            onChange={setCosto}
            hint="Tela + impresión + empaque."
          />
          <TextField
            name="min_order_qty"
            label="Pedido mínimo"
            type="number"
            value={product?.min_order_qty ?? 1}
          />
        </div>

        <TextField
          name="bulk_prices"
          label="Precios por volumen (Bs)"
          value={bulkToText(product)}
          placeholder="10:85, 25:78, 50:70"
          hint="Formato cantidad:precio. El precio se aplica por unidad a partir de esa cantidad."
          inputClassName="font-mono text-xs"
        />

        <p className="border border-ink-200 p-3 text-sm">
          Margen bruto actual:{" "}
          <strong className={margen < 30 ? "underline decoration-2 underline-offset-2" : ""}>
            {margen.toFixed(1)}%
          </strong>{" "}
          <span className="text-ink-600">
            ({formatVes(precioNum)} precio · {formatVes(costoNum)} costo)
          </span>
        </p>
      </Bloque>

      {/* ---------- Tallas y colores ---------- */}
      <Bloque
        title="Tallas y colores"
        description="Las tallas alimentan el generador de variantes con existencias."
      >
        <CheckGroup
          name="sizes"
          legend="Tallas disponibles"
          options={SIZES}
          defaultValues={product?.sizes ?? []}
          columns={7}
        />
        <TextField
          name="colors"
          label="Colores"
          value={colorsToText(product)}
          hint="Nombre y hexadecimal separados por espacio: Negro #000000, Blanco #FFFFFF"
          placeholder="Negro #000000, Blanco #FFFFFF"
          inputClassName="font-mono text-xs"
        />
      </Bloque>

      {/* ---------- Imágenes ---------- */}
      <Bloque
        title="Imágenes"
        description="La primera es la portada. Se sube desde el equipo o por URL y entra con el resto al guardar."
      >
        <ProductImagesEditor
          key={guardados}
          productId={product?.id ?? null}
          initialImages={images}
          storeHref={storeHref}
        />
      </Bloque>

      {/* ---------- Publicación ---------- */}
      <Bloque title="Publicación">
        <div className="grid gap-2 sm:grid-cols-3">
          <CheckField
            name="is_active"
            label="Visible en la tienda"
            defaultChecked={product?.is_active ?? true}
          />
          <CheckField
            name="is_featured"
            label="Destacado"
            hint="Aparece en la portada."
            defaultChecked={product?.is_featured}
          />
          <CheckField
            name="is_custom_only"
            label="Solo a medida"
            hint="No se compra directo, se cotiza."
            defaultChecked={product?.is_custom_only}
          />
        </div>

        <TagsField
          name="tags"
          label="Etiquetas"
          values={product?.tags ?? []}
          hint="Sirven para buscar y para los filtros del catálogo."
        />

        <div>
          <p className="label">Colecciones</p>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <label
                key={collection.id}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 p-2 text-sm has-checked:border-ember-600 has-checked:bg-ember-600 has-checked:text-paper"
              >
                <input
                  type="checkbox"
                  name="collectionIds"
                  value={collection.id}
                  defaultChecked={selectedCollectionIds.includes(collection.id)}
                  className="size-3.5 accent-[#6b201a]"
                />
                <span className="truncate">{collection.name}</span>
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-500">
            Un producto puede estar en varias. Las promociones por colección se aplican a todo
            lo que esté dentro.
          </p>
        </div>

        <div className="grid gap-4">
          <TextField
            name="seo_title"
            label="Título SEO"
            value={product?.seo_title}
            hint="Si no, se usa el nombre del producto."
          />
          <TextAreaField
            name="seo_description"
            label="Descripción SEO"
            value={product?.seo_description}
            rows={2}
            hint="Dos líneas como máximo."
          />
        </div>
      </Bloque>

      {/* ---------- Guardado ---------- */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
          {requisitos.map((requisito) => (
            <li
              key={requisito.texto}
              className={cn(
                "flex items-center gap-1.5",
                requisito.ok ? "text-ink-500 line-through" : "font-bold text-ember-700",
              )}
            >
              {requisito.ok ? (
                <Check className="size-4 shrink-0" />
              ) : (
                <X className="size-4 shrink-0" />
              )}
              {requisito.texto}
            </li>
          ))}
        </ul>

        <button
          type="submit"
          disabled={pending || faltaAlgo}
          title={faltaAlgo ? "Faltan datos obligatorios para publicar" : undefined}
          // Tachado mientras falte el nombre o el precio: el botón se ve
          // cruzado en vez de tener que descubrir el error tras pulsarlo.
          className={cn("btn btn-solid btn-lg", faltaAlgo && "line-through decoration-2")}
        >
          {pending ? <Save className="size-4 animate-pulse" /> : <Save className="size-4" />}
          {pending ? "Guardando…" : "Guardar publicación"}
        </button>
      </div>
    </form>
  );
}
