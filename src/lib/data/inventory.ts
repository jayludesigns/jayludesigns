import { cache } from "react";
import { getBackend } from "@/lib/db";
import type {
  Product,
  Promotion,
  RawMaterial,
  StockMovement,
  MaterialMovement,
  Variant,
} from "@/lib/types";
import { computePrice, resolvePromotion } from "@/lib/data/catalog";

/* ------------------------------------------------------------------ */
/* Producto terminado                                                  */
/* ------------------------------------------------------------------ */

export interface VariantRow extends Variant {
  product_name: string;
  product_slug: string;
  product_image: string | null;
  garment_type: string;
  base_price_ves: number;
  product_active: boolean;
  price_ves: number;
  available: number;
  is_low: boolean;
}

export interface InventoryFilters {
  search?: string;
  lowStockOnly?: boolean;
  outOfStockOnly?: boolean;
  includeInactive?: boolean;
}

export const getVariantsWithProduct = cache(
  async (filters: InventoryFilters = {}): Promise<VariantRow[]> => {
    const backend = getBackend();
    const [variants, products, images, promotions, links] = await Promise.all([
      backend.list<Variant>("variants"),
      backend.list<Product>("products"),
      backend.list<{ product_id: string; url: string; sort_order: number }>("product_images"),
      backend.list<Promotion>("promotions"),
      backend.list<{ product_id: string; collection_id: string }>("product_collections"),
    ]);

    let rows = variants.map<VariantRow>((variant) => {
      const product = products.find((p) => p.id === variant.product_id);
      const image =
        images
          .filter((i) => i.product_id === variant.product_id)
          .sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null;
      const promo = product
        ? resolvePromotion(
            promotions,
            product.id,
            links.filter((l) => l.product_id === product.id).map((l) => l.collection_id),
          )
        : null;
      const price = product ? computePrice(product, promo, { delta: variant.price_delta_ves }) : null;
      const available = Math.max(0, variant.stock - variant.reserved_stock);
      return {
        ...variant,
        product_name: product?.name ?? "(producto eliminado)",
        product_slug: product?.slug ?? "",
        product_image: image,
        garment_type: product?.garment_type ?? "franela",
        base_price_ves: product?.base_price_ves ?? 0,
        product_active: product?.is_active ?? false,
        price_ves: price?.unit ?? product?.base_price_ves ?? 0,
        available,
        is_low: available <= variant.min_stock,
      };
    });

    if (!filters.includeInactive) rows = rows.filter((r) => r.product_active && r.is_active);
    if (filters.search) {
      const term = filters.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.product_name.toLowerCase().includes(term) ||
          (r.sku ?? "").toLowerCase().includes(term) ||
          (r.color ?? "").toLowerCase().includes(term) ||
          (r.size ?? "").toLowerCase().includes(term),
      );
    }
    if (filters.lowStockOnly) rows = rows.filter((r) => r.is_low && r.available > 0);
    if (filters.outOfStockOnly) rows = rows.filter((r) => r.available === 0);

    return rows.sort((a, b) => a.product_name.localeCompare(b.product_name, "es") || (a.size ?? "").localeCompare(b.size ?? ""));
  },
);

export interface StockSummary {
  totalSkus: number;
  totalUnits: number;
  reservedUnits: number;
  valueAtCost: number;
  valueAtRetail: number;
  lowStock: number;
  outOfStock: number;
}

export const getStockSummary = cache(async (): Promise<StockSummary> => {
  const rows = await getVariantsWithProduct({ includeInactive: false });
  return rows.reduce<StockSummary>(
    (acc, r) => {
      acc.totalSkus += 1;
      acc.totalUnits += r.stock;
      acc.reservedUnits += r.reserved_stock;
      acc.valueAtCost += r.stock * (r.cost_ves || r.base_price_ves * 0.4);
      acc.valueAtRetail += r.stock * r.price_ves;
      if (r.available === 0) acc.outOfStock += 1;
      else if (r.is_low) acc.lowStock += 1;
      return acc;
    },
    { totalSkus: 0, totalUnits: 0, reservedUnits: 0, valueAtCost: 0, valueAtRetail: 0, lowStock: 0, outOfStock: 0 },
  );
});

/** Ajusta el stock de una variante dejando registro del movimiento. */
export async function adjustVariantStock(input: {
  variantId: string;
  delta: number;
  reason: string;
  note?: string | null;
  orderId?: string | null;
  userId?: string | null;
}) {
  const backend = getBackend();
  const variant = await backend.one<Variant>("variants", {
    where: [{ column: "id", op: "eq", value: input.variantId }],
  });
  if (!variant) throw new Error("Variante no encontrada");

  const next = Math.max(0, variant.stock + input.delta);
  // Se anota el delta realmente aplicado, no el pedido. Si hay 3 unidades y
  // se restan 10, la existencia queda en 0 pero el movimiento diría -10 y el
  // libro dejaría de cuadrar con el stock. Un movimiento que no cambia nada
  // tampoco se escribe: `stock_movements` exige quantity <> 0.
  const applied = next - variant.stock;
  if (applied === 0) {
    throw new Error(
      `El ajuste no cambiaría el stock: hay ${variant.stock} unidades y pediste ${input.delta}.`,
    );
  }
  await backend.update<Variant>("variants", variant.id, {
    stock: next,
    updated_at: new Date().toISOString(),
  });
  const type = applied > 0 ? "in" : applied < 0 ? "out" : "adjust";
  await backend.insert<StockMovement>("stock_movements", {
    variant_id: variant.id,
    type,
    quantity: applied,
    reason: input.reason,
    order_id: input.orderId ?? null,
    user_id: input.userId ?? null,
    note: input.note ?? null,
  });
  return { stock: next };
}

export const getStockMovements = cache(async (limit = 60) => {
  const backend = getBackend();
  return backend.list<StockMovement>("stock_movements", {
    order: [{ column: "created_at", asc: false }],
    limit,
  });
});

/* ------------------------------------------------------------------ */
/* Materia prima                                                       */
/* ------------------------------------------------------------------ */

export interface MaterialRow extends RawMaterial {
  available: number;
  is_low: boolean;
  stock_value: number;
}

export const getRawMaterials = cache(
  async (filters: { search?: string; category?: string; lowStockOnly?: boolean } = {}): Promise<MaterialRow[]> => {
    const backend = getBackend();
    const materials = await backend.list<RawMaterial>("raw_materials", {
      order: [{ column: "name", asc: true }],
    });

    let rows = materials.map<MaterialRow>((m) => ({
      ...m,
      available: Math.max(0, m.stock),
      is_low: m.stock <= m.min_stock,
      stock_value: Math.round(m.stock * m.cost_ves * 100) / 100,
    }));

    if (filters.search) {
      const term = filters.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          (r.sku ?? "").toLowerCase().includes(term) ||
          (r.supplier ?? "").toLowerCase().includes(term),
      );
    }
    if (filters.category && filters.category !== "todos") rows = rows.filter((r) => r.category === filters.category);
    if (filters.lowStockOnly) rows = rows.filter((r) => r.is_low);
    return rows;
  },
);

export interface MaterialSummary {
  totalItems: number;
  totalUnits: number;
  totalValue: number;
  lowStock: number;
  byCategory: { category: string; items: number; value: number }[];
}

export const getMaterialSummary = cache(async (): Promise<MaterialSummary> => {
  const rows = await getRawMaterials();
  const byCategory = new Map<string, { items: number; value: number }>();
  for (const row of rows) {
    const entry = byCategory.get(row.category) ?? { items: 0, value: 0 };
    entry.items += 1;
    entry.value = Math.round((entry.value + row.stock_value) * 100) / 100;
    byCategory.set(row.category, entry);
  }
  return {
    totalItems: rows.length,
    totalUnits: rows.reduce((acc, r) => acc + r.stock, 0),
    totalValue: rows.reduce((acc, r) => acc + r.stock_value, 0),
    lowStock: rows.filter((r) => r.is_low).length,
    byCategory: [...byCategory.entries()]
      .map(([category, value]) => ({ category, ...value }))
      .sort((a, b) => b.value - a.value),
  };
});

export async function saveRawMaterial(input: Partial<RawMaterial> & { name: string }) {
  const backend = getBackend();
  if (input.id) {
    return backend.update<RawMaterial>("raw_materials", input.id, input);
  }
  return backend.insert<RawMaterial>("raw_materials", input as RawMaterial);
}

export async function removeRawMaterial(id: string) {
  const backend = getBackend();
  await backend.remove("raw_materials", id);
}

export async function adjustMaterialStock(input: {
  materialId: string;
  delta: number;
  reason: string;
  type?: MaterialMovement["type"];
  note?: string | null;
  orderId?: string | null;
  userId?: string | null;
}) {
  const backend = getBackend();
  const material = await backend.one<RawMaterial>("raw_materials", {
    where: [{ column: "id", op: "eq", value: input.materialId }],
  });
  if (!material) throw new Error("Material no encontrado");

  const next = Math.max(0, Math.round((material.stock + input.delta) * 1000) / 1000);
  // Igual que en las variantes: al libro va lo que se aplicó de verdad, para
  // que el historial cuadre con la existencia aunque se topa en cero.
  const applied = Math.round((next - material.stock) * 1000) / 1000;
  if (applied === 0) {
    throw new Error(
      `El ajuste no cambiaría la existencia: hay ${material.stock} y pediste ${input.delta}.`,
    );
  }
  await backend.update<RawMaterial>("raw_materials", material.id, {
    stock: next,
    updated_at: new Date().toISOString(),
  });
  await backend.insert<MaterialMovement>("material_movements", {
    material_id: material.id,
    type: input.type ?? (applied > 0 ? "in" : applied < 0 ? "out" : "adjust"),
    quantity: applied,
    reason: input.reason,
    order_id: input.orderId ?? null,
    user_id: input.userId ?? null,
    note: input.note ?? null,
  });
  return { stock: next };
}

export const getMaterialMovements = cache(async (limit = 60) => {
  const backend = getBackend();
  return backend.list<MaterialMovement>("material_movements", {
    order: [{ column: "created_at", asc: false }],
    limit,
  });
});
