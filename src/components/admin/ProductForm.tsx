import { Save } from "lucide-react";
import Link from "next/link";

import { ActionForm } from "@/components/admin/ActionForm";
import {
  CheckField,
  CheckGroup,
  Fieldset,
  SelectField,
  TagsField,
  TextAreaField,
  TextField,
} from "@/components/admin/Fields";
import { saveProductAction } from "@/app/admin/actions";
import { ProductImagesEditor } from "@/components/admin/ProductImagesEditor";
import { formatVes } from "@/lib/utils";
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

function colorsToText(product: Product | null): string {
  if (!product || product.colors.length === 0) return "Blanco #FFFFFF, Negro #000000";
  return product.colors.map((color) => `${color.name} ${color.hex}`).join(", ");
}

function bulkToText(product: Product | null): string {
  if (!product || product.bulk_prices.length === 0) return "";
  return product.bulk_prices.map((tier) => `${tier.min_qty}:${tier.unit_price_ves}`).join(", ");
}

/**
 * Formulario de producto.
 *
 * Lo usan la pantalla de alta y la de edición: los valores por defecto
 * vienen del producto o, si es nuevo, de cadenas vacías.
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
  const prices = product
    ? {
        price: product.base_price_ves,
        compare: product.compare_at_ves,
        cost: product.cost_ves,
        margin:
          product.base_price_ves > 0
            ? ((product.base_price_ves - product.cost_ves) / product.base_price_ves) * 100
            : 0,
      }
    : null;

  // Cada guardado confirma al instante que los cambios ya se ven en la tienda
  // (el backend es único: guardar = publicar), con enlace a la ficha pública.
  const storeHref = product ? `/producto/${product.slug}` : undefined;
  const storeHint = storeHref ? (
    <Link
      href={storeHref}
      className="font-bold text-ember-700 underline decoration-ember-300 underline-offset-2"
    >
      Ver en la tienda →
    </Link>
  ) : undefined;

  return (
    <div className="space-y-4">
      {/* ---------- Datos ---------- */}
      <ActionForm
        action={saveProductAction}
        submitLabel={product ? "Guardar cambios" : "Crear producto"}
        submitIcon={<Save className="size-4" />}
        successHint={storeHint}
        hiddenFields={{ id: product?.id }}
        className="card overflow-hidden"
      >
        <div className="border-b border-ink-200 bg-ink-50 px-4 py-2.5">
          <h2 className="font-mono text-[0.67rem] font-bold tracking-[0.16em] uppercase">
            Ficha del producto
          </h2>
          <p className="mt-0.5 text-xs text-ink-600">
            Con el nombre y el precio base ya se puede publicar; el resto es
            recomendado.
          </p>
        </div>

        <div className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name="name"
              label="Nombre"
              value={product?.name}
              required
              placeholder="Franela Samurai Zen"
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
              hint={
                product
                  ? `Product/${product.slug}`
                  : "Se genera solo si lo dejas vacío."
              }
            />
            <TextField
              name="sku"
              label="SKU"
              value={product?.sku}
              placeholder="JLY-FRA-001"
              className="font-mono"
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
            <TextField
              name="fit"
              label="Corte"
              value={product?.fit}
              placeholder="Regular"
            />
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
        </div>
      </ActionForm>

      {/* ---------- Precio ---------- */}
      <ActionForm
        action={saveProductAction}
        submitLabel="Guardar precio"
        submitIcon={<Save className="size-4" />}
        successHint={storeHint}
        hiddenFields={{ id: product?.id }}
        className="card overflow-hidden"
      >
        <div className="border-b border-ink-200 bg-ink-50 px-4 py-2.5">
          <h2 className="font-mono text-[0.67rem] font-bold tracking-[0.16em] uppercase">
            Precio y lotes
          </h2>
        </div>
        <div className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField
              name="base_price_ves"
              label="Precio base (Bs)"
              type="number"
              value={product?.base_price_ves ?? 0}
              required
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
              value={product?.cost_ves ?? 0}
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

          {prices && (
            <p className="border border-ink-200 p-3 text-sm">
              Margen bruto actual:{" "}
              <strong
                className={
                  prices.margin < 30
                    ? "underline decoration-2 underline-offset-2"
                    : ""
                }
              >
                {prices.margin.toFixed(1)}%
              </strong>{" "}
              <span className="text-ink-600">
                ({formatVes(prices.price)} precio · {formatVes(prices.cost)} costo)
              </span>
              {prices.compare && prices.compare > prices.price && (
                <span className="ml-2 text-ink-600">
                  Con el tachado se muestra como promotion del{" "}
                  {Math.round(((prices.price - (prices.compare ?? 0)) / (prices.compare ?? 1)) * 100)}%.
                </span>
              )}
            </p>
          )}
        </div>
      </ActionForm>

      {/* ---------- Tallas y colores ---------- */}
      <ActionForm
        action={saveProductAction}
        submitLabel="Guardar tallas y colores"
        submitIcon={<Save className="size-4" />}
        successHint={storeHint}
        hiddenFields={{ id: product?.id }}
        className="card overflow-hidden"
      >
        <div className="border-b border-ink-200 bg-ink-50 px-4 py-2.5">
          <h2 className="font-mono text-[0.67rem] font-bold tracking-[0.16em] uppercase">
            Tallas y colores
          </h2>
          <p className="mt-0.5 text-xs text-ink-600">
            Las tallas alimentan el generador de variantes con existencias.
          </p>
        </div>
        <div className="space-y-4 p-4">
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
        </div>
      </ActionForm>

      {/* ---------- Publicación ---------- */}
      <ActionForm
        action={saveProductAction}
        submitLabel="Guardar publicación"
        submitIcon={<Save className="size-4" />}
        successHint={storeHint}
        hiddenFields={{ id: product?.id }}
        className="card overflow-hidden"
      >
        <div className="border-b border-ink-200 bg-ink-50 px-4 py-2.5">
          <h2 className="font-mono text-[0.67rem] font-bold tracking-[0.16em] uppercase">
            Publicación
          </h2>
        </div>
        <div className="space-y-4 p-4">
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
              Un producto puede estar en varias. Las promociones por colección
              se aplican a todo lo que esté dentro.
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
        </div>
      </ActionForm>

      {/* ---------- Imágenes ---------- */}
      {product && (
        <Fieldset
          title="Imágenes"
          description="La primera es la portada. Cualquier imagen que subas o pegues aparece aquí al instante y se guarda en el almacenamiento local."
        >
          <ProductImagesEditor
            productId={product.id}
            initialImages={images}
            storeHref={`/producto/${product.slug}`}
          />
        </Fieldset>
      )}
    </div>
  );
}
