import { cache } from "react";
import { getBackend, newId, type Backend } from "@/lib/db";
import type {
  BulkPriceTier,
  Category,
  Collection,
  CollectionTheme,
  ColorOption,
  Coupon,
  Product,
  ProductImage,
  ProductSpin360,
  PromoKind,
  PromoScope,
  Promotion,
  PublishStatus,
  Variant,
} from "@/lib/types";
import { slugify } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Productos                                                            */
/* ------------------------------------------------------------------ */

export interface ProductInput {
  id?: string;
  name: string;
  slug?: string;
  sku?: string | null;
  subtitle?: string | null;
  description?: string | null;
  category_id?: string | null;
  base_price_ves: number;
  compare_at_ves?: number | null;
  cost_ves?: number;
  garment_type?: string;
  material?: string | null;
  print_technique?: string | null;
  fit?: string | null;
  care_instructions?: string | null;
  sizes?: string[];
  colors?: ColorOption[];
  is_active?: boolean;
  is_featured?: boolean;
  is_custom_only?: boolean;
  min_order_qty?: number;
  bulk_prices?: BulkPriceTier[];
  lead_time_days?: number;
  weight_grams?: number | null;
  tags?: string[];
  seo_title?: string | null;
  seo_description?: string | null;
  collectionIds?: string[];
}

const BLANK = {
  sku: null,
  subtitle: null,
  description: null,
  category_id: null,
  compare_at_ves: null,
  cost_ves: 0,
  garment_type: "franela",
  material: null,
  print_technique: null,
  fit: null,
  care_instructions: null,
  sizes: [] as string[],
  colors: [] as ColorOption[],
  is_active: true,
  is_featured: false,
  is_custom_only: false,
  min_order_qty: 1,
  bulk_prices: [] as BulkPriceTier[],
  lead_time_days: 4,
  weight_grams: null,
  tags: [] as string[],
  seo_title: null,
  seo_description: null,
};

async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const backend = getBackend();
  const root = slugify(base) || "producto";
  for (let i = 0; i < 40; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const found = await backend.one<Product>("products", {
      where: [{ column: "slug", op: "eq", value: candidate }],
    });
    if (!found || found.id === ignoreId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function saveProduct(input: ProductInput): Promise<Product> {
  const backend = getBackend();
  const { collectionIds, ...fields } = input;
  const nowIso = new Date().toISOString();

  let saved: Product;
  if (input.id) {
    const slug = fields.slug?.trim() ? await uniqueSlug(fields.slug, input.id) : undefined;
    saved = await backend.update<Product>("products", input.id, {
      ...fields,
      ...(slug ? { slug } : {}),
      updated_at: nowIso,
    });
  } else {
    const slug = await uniqueSlug(fields.slug?.trim() || input.name);
    saved = await backend.insert<Product>("products", {
      ...BLANK,
      ...fields,
      id: newId(),
      slug,
      name: input.name.trim(),
      created_at: nowIso,
      updated_at: nowIso,
    } as Product);
  }

  if (collectionIds) {
    await backend.removeMany("product_collections", [
      { column: "product_id", op: "eq", value: saved.id },
    ]);
    if (collectionIds.length) {
      await backend.insertMany("product_collections", [
        ...new Set(collectionIds),
      ].map((collection_id, index) => ({
        product_id: saved.id,
        collection_id,
        sort_order: index,
      })));
    }
  }

  await backend.insert("activity_log", {
    user_id: null,
    user_email: null,
    action: input.id ? "update" : "create",
    entity: "product",
    entity_id: saved.id,
    summary: `Producto ${saved.name}`,
    meta: null,
  });
  return saved;
}

export async function toggleProductActive(id: string) {
  const backend = getBackend();
  const product = await backend.one<Product>("products", {
    where: [{ column: "id", op: "eq", value: id }],
  });
  if (!product) throw new Error("Producto no encontrado");
  return backend.update<Product>("products", id, {
    is_active: !product.is_active,
    updated_at: new Date().toISOString(),
  });
}

export async function removeProduct(id: string) {
  const backend = getBackend();
  await backend.removeMany("variants", [{ column: "product_id", op: "eq", value: id }]);
  await backend.removeMany("product_images", [{ column: "product_id", op: "eq", value: id }]);
  await backend.removeMany("product_collections", [{ column: "product_id", op: "eq", value: id }]);
  await backend.remove("products", id);
}

export async function addProductImage(input: {
  product_id: string;
  url: string;
  alt?: string | null;
  kind?: ProductImage["kind"];
}) {
  const backend = getBackend();
  const current = await backend.list<ProductImage>("product_images", {
    where: [{ column: "product_id", op: "eq", value: input.product_id }],
  });
  // Si se sube como portada, pasa a ser la primera (orden 0): el resto baja un
  // puesto y la portada anterior vuelve a galería.
  if (input.kind === "main") {
    await demoteMain(backend, current);
  }
  // Se usa el máximo + 1 (y no `current.length`) para que añadir nunca pise
  // un orden existente si la lista quedó con huecos tras algún borrado.
  const lastOrder = current.reduce((max, img) => Math.max(max, img.sort_order), 0);
  return backend.insert<ProductImage>("product_images", {
    id: newId(),
    product_id: input.product_id,
    url: input.url,
    alt: input.alt ?? null,
    kind: input.kind ?? "gallery",
    sort_order: input.kind === "main" ? 0 : lastOrder + 1,
  });
}

/** Baja un puesto todas menos la nueva y deja solo una portada. */
async function demoteMain(
  backend: Backend,
  siblings: ProductImage[],
  exceptImageId?: string,
) {
  await Promise.all(
    siblings
      .filter((img) => img.id !== exceptImageId)
      .map((img) =>
        backend.update<ProductImage>("product_images", img.id, {
          sort_order: img.sort_order + 1,
          kind: img.kind === "main" ? "gallery" : img.kind,
        }),
      ),
  );
}

/** Convierte una imagen en la portada (orden 0) y baja el resto. */
export async function setCoverImage(imageId: string) {
  const backend = getBackend();
  const image = await backend.one<ProductImage>("product_images", {
    where: [{ column: "id", op: "eq", value: imageId }],
  });
  if (!image) throw new Error("Imagen no encontrada.");
  const siblings = await backend.list<ProductImage>("product_images", {
    where: [{ column: "product_id", op: "eq", value: image.product_id }],
  });
  // Si ya es la primera no se mueve nada: solo pasa a ser la portada y las
  // demás portadas (si hubiera) vuelven a galería sin alterar el orden.
  if (image.sort_order !== 0) {
    await demoteMain(backend, siblings, imageId);
  } else {
    await Promise.all(
      siblings
        .filter((img) => img.id !== imageId && img.kind === "main")
        .map((img) => backend.update<ProductImage>("product_images", img.id, { kind: "gallery" })),
    );
  }
  return backend.update<ProductImage>("product_images", imageId, {
    sort_order: 0,
    kind: "main",
  });
}

export async function removeProductImage(id: string) {
  const backend = getBackend();
  const image = await backend.one<ProductImage>("product_images", {
    where: [{ column: "id", op: "eq", value: id }],
  });
  if (!image) return;
  await backend.remove("product_images", id);

  const rest = await backend.list<ProductImage>("product_images", {
    where: [{ column: "product_id", op: "eq", value: image.product_id }],
  });
  if (rest.length === 0) return;

  // Tras borrar se renumeran las que quedan (0..n−1) y se garantiza una sola
  // portada, siempre en la primera posición: si se quitó la portada, la
  // primera imagen restante pasa a ser la nueva, y cualquier otra "main"
  // residual vuelve a galería.
  const sorted = [...rest].sort((a, b) => a.sort_order - b.sort_order);
  const hasMain = sorted.some((img) => img.kind === "main");
  const coverId = hasMain ? sorted.find((img) => img.kind === "main")!.id : sorted[0].id;
  await Promise.all(
    sorted.map((img, index) =>
      backend.update<ProductImage>("product_images", img.id, {
        sort_order: index,
        kind: img.id === coverId ? "main" : img.kind === "main" ? "gallery" : img.kind,
      }),
    ),
  );
}

export async function saveSpin360(input: {
  product_id: string;
  frames: string[];
  poster_url?: string | null;
}) {
  const backend = getBackend();
  const frames = input.frames.filter(Boolean);
  if (frames.length < 2) throw new Error("Hacen falta al menos 2 fotogramas para el visor 360°.");
  return backend.upsert<ProductSpin360>("product_spin360", {
    product_id: input.product_id,
    frames,
    frame_count: frames.length,
    poster_url: input.poster_url ?? frames[0],
    updated_at: new Date().toISOString(),
  });
}

/* ------------------------------------------------------------------ */
/* Variantes                                                            */
/* ------------------------------------------------------------------ */

export interface VariantInput {
  id?: string;
  product_id: string;
  size?: string | null;
  color?: string | null;
  color_hex?: string | null;
  stock: number;
  min_stock?: number;
  cost_ves?: number;
  price_delta_ves?: number;
  sku?: string | null;
  barcode?: string | null;
  is_active?: boolean;
}

export async function saveVariant(input: VariantInput): Promise<Variant> {
  const backend = getBackend();
  const nowIso = new Date().toISOString();
  const patch = {
    product_id: input.product_id,
    size: input.size?.trim() || null,
    color: input.color?.trim() || null,
    color_hex: input.color_hex ?? null,
    stock: Math.max(0, Math.round(input.stock)),
    min_stock: Math.max(0, Math.round(input.min_stock ?? 3)),
    cost_ves: input.cost_ves ?? 0,
    price_delta_ves: input.price_delta_ves ?? 0,
    sku: input.sku ?? null,
    barcode: input.barcode ?? null,
    is_active: input.is_active ?? true,
    updated_at: nowIso,
  };
  if (input.id) return backend.update<Variant>("variants", input.id, patch);
  return backend.insert<Variant>("variants", {
    ...patch,
    id: newId(),
    reserved_stock: 0,
    created_at: nowIso,
  } as Variant);
}

export async function removeVariant(id: string) {
  const backend = getBackend();
  await backend.remove("variants", id);
}

/** Genera el grillete talla × color que declara el producto. */
export async function syncProductVariants(productId: string) {
  const backend = getBackend();
  const product = await backend.one<Product>("products", {
    where: [{ column: "id", op: "eq", value: productId }],
  });
  if (!product) throw new Error("Producto no encontrado");

  const existing = await backend.list<Variant>("variants", {
    where: [{ column: "product_id", op: "eq", value: productId }],
  });
  const wanted = new Set<string>();
  const created: Variant[] = [];

  for (const color of product.colors.length ? product.colors : [{ name: "Único", hex: "#FFFFFF" }]) {
    for (const size of product.sizes.length ? product.sizes : ["Única"]) {
      const key = `${size}|${color.name}`;
      wanted.add(key);
      const found = existing.find((v) => `${v.size}|${v.color}` === key);
      if (found) continue;
      created.push({
        id: newId(),
        product_id: productId,
        sku: `${product.sku ?? product.slug.slice(0, 6).toUpperCase()}-${size}-${color.name}`
          .replace(/\s+/g, "")
          .slice(0, 32)
          .toUpperCase(),
        size,
        color: color.name,
        color_hex: color.hex,
        stock: 0,
        reserved_stock: 0,
        min_stock: 3,
        cost_ves: product.cost_ves,
        price_delta_ves: 0,
        is_active: true,
        barcode: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  if (created.length) await backend.insertMany<Variant>("variants", created);
  return { created: created.length, total: wanted.size };
}

/* ------------------------------------------------------------------ */
/* Colecciones                                                          */
/* ------------------------------------------------------------------ */

export interface CollectionInput {
  id?: string;
  name: string;
  slug?: string;
  tagline?: string | null;
  description?: string | null;
  theme?: CollectionTheme;
  banner_url?: string | null;
  status?: PublishStatus;
  starts_at?: string | null;
  ends_at?: string | null;
  sort_order?: number;
  seo_title?: string | null;
  seo_description?: string | null;
}

export async function saveCollection(input: CollectionInput): Promise<Collection> {
  const backend = getBackend();
  const nowIso = new Date().toISOString();
  const fields = {
    name: input.name.trim(),
    tagline: input.tagline ?? null,
    description: input.description ?? null,
    theme: input.theme ?? ("otro" as CollectionTheme),
    banner_url: input.banner_url ?? null,
    status: input.status ?? ("draft" as PublishStatus),
    starts_at: input.starts_at ?? null,
    ends_at: input.ends_at ?? null,
    sort_order: input.sort_order ?? 0,
    seo_title: input.seo_title ?? null,
    seo_description: input.seo_description ?? null,
    updated_at: nowIso,
  };

  if (input.id) {
    const slug = input.slug?.trim() ? await uniqueCollectionSlug(input.slug, input.id) : undefined;
    return backend.update<Collection>("collections", input.id, {
      ...fields,
      ...(slug ? { slug } : {}),
    });
  }

  return backend.insert<Collection>("collections", {
    ...fields,
    id: newId(),
    slug: await uniqueCollectionSlug(input.slug?.trim() || input.name),
    created_at: nowIso,
  } as Collection);
}

async function uniqueCollectionSlug(base: string, ignoreId?: string) {
  const backend = getBackend();
  const root = slugify(base) || "coleccion";
  for (let i = 0; i < 40; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const found = await backend.one<Collection>("collections", {
      where: [{ column: "slug", op: "eq", value: candidate }],
    });
    if (!found || found.id === ignoreId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function removeCollection(id: string) {
  const backend = getBackend();
  await backend.removeMany("product_collections", [{ column: "collection_id", op: "eq", value: id }]);
  await backend.remove("collections", id);
}

/* ------------------------------------------------------------------ */
/* Categorías                                                           */
/* ------------------------------------------------------------------ */

export async function saveCategory(input: {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  hero_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}) {
  const backend = getBackend();
  const fields = {
    name: input.name.trim(),
    description: input.description ?? null,
    hero_url: input.hero_url ?? null,
    sort_order: input.sort_order ?? 0,
    is_active: input.is_active ?? true,
  };
  if (input.id) {
    const slug = input.slug?.trim() ? await uniqueCategorySlug(input.slug, input.id) : undefined;
    return backend.update<Category>("categories", input.id, {
      ...fields,
      ...(slug ? { slug } : {}),
    });
  }
  return backend.insert<Category>("categories", {
    ...fields,
    id: newId(),
    slug: await uniqueCategorySlug(input.slug?.trim() || input.name),
    created_at: new Date().toISOString(),
  } as Category);
}

async function uniqueCategorySlug(base: string, ignoreId?: string) {
  const backend = getBackend();
  const root = slugify(base) || "categoria";
  for (let i = 0; i < 40; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const found = await backend.one<Category>("categories", {
      where: [{ column: "slug", op: "eq", value: candidate }],
    });
    if (!found || found.id === ignoreId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

/* ------------------------------------------------------------------ */
/* Promociones                                                          */
/* ------------------------------------------------------------------ */

export interface PromotionInput {
  id?: string;
  name: string;
  scope: PromoScope;
  product_id?: string | null;
  collection_id?: string | null;
  kind: PromoKind;
  value: number;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
  priority?: number;
}

export async function savePromotion(input: PromotionInput): Promise<Promotion> {
  const backend = getBackend();
  const fields = {
    name: input.name.trim(),
    scope: input.scope,
    product_id: input.scope === "product" ? (input.product_id ?? null) : null,
    collection_id: input.scope === "collection" ? (input.collection_id ?? null) : null,
    kind: input.kind,
    value: Math.max(0, input.value),
    starts_at: input.starts_at ?? null,
    ends_at: input.ends_at ?? null,
    is_active: input.is_active ?? true,
    priority: input.priority ?? 0,
  };
  if (!fields.product_id && !fields.collection_id) {
    throw new Error("Indica el producto o la colección que recibe el descuento.");
  }
  if (input.id) return backend.update<Promotion>("promotions", input.id, fields);
  return backend.insert<Promotion>("promotions", {
    ...fields,
    id: newId(),
    created_at: new Date().toISOString(),
  } as Promotion);
}

export async function togglePromotion(id: string) {
  const backend = getBackend();
  const promo = await backend.one<Promotion>("promotions", {
    where: [{ column: "id", op: "eq", value: id }],
  });
  if (!promo) throw new Error("Promoción no encontrada");
  return backend.update<Promotion>("promotions", id, { is_active: !promo.is_active });
}

export async function removePromotion(id: string) {
  const backend = getBackend();
  await backend.remove("promotions", id);
}

export const getPromotions = cache(
  async (): Promise<(Promotion & { target: string; state: "activa" | "programada" | "expirada" | "inactiva" })[]> => {
    const backend = getBackend();
    const [promotions, products, collections] = await Promise.all([
      backend.list<Promotion>("promotions", { order: [{ column: "priority", asc: false }] }),
      backend.list<Product>("products"),
      backend.list<Collection>("collections"),
    ]);
    const now = Date.now();
    return promotions.map((promo) => {
      const target =
        promo.scope === "product"
          ? (products.find((p) => p.id === promo.product_id)?.name ?? "(producto borrado)")
          : (collections.find((c) => c.id === promo.collection_id)?.name ?? "(colección borrada)");
      const starts = promo.starts_at ? new Date(promo.starts_at).getTime() : -Infinity;
      const ends = promo.ends_at ? new Date(promo.ends_at).getTime() : Infinity;
      const state = !promo.is_active
        ? "inactiva"
        : now < starts
          ? "programada"
          : now > ends
            ? "expirada"
            : "activa";
      return { ...promo, target, state };
    });
  },
);

/* ------------------------------------------------------------------ */
/* Cupones                                                              */
/* ------------------------------------------------------------------ */

export interface CouponInput {
  id?: string;
  code: string;
  kind: PromoKind;
  value: number;
  min_subtotal_ves?: number;
  max_uses?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active?: boolean;
  description?: string | null;
}

export async function saveCoupon(input: CouponInput): Promise<Coupon> {
  const backend = getBackend();
  const fields = {
    code: input.code.trim().toUpperCase(),
    kind: input.kind,
    value: Math.max(0, input.value),
    min_subtotal_ves: input.min_subtotal_ves ?? 0,
    max_uses: input.max_uses ?? null,
    starts_at: input.starts_at ?? null,
    ends_at: input.ends_at ?? null,
    is_active: input.is_active ?? true,
    description: input.description ?? null,
  };
  if (input.id) return backend.update<Coupon>("coupons", input.id, fields);

  const clash = await backend.one<Coupon>("coupons", {
    where: [{ column: "code", op: "eq", value: fields.code }],
  });
  if (clash) throw new Error(`El código ${fields.code} ya existe.`);
  return backend.insert<Coupon>("coupons", {
    ...fields,
    id: newId(),
    used_count: 0,
    created_at: new Date().toISOString(),
  } as Coupon);
}

export async function toggleCoupon(id: string) {
  const backend = getBackend();
  const coupon = await backend.one<Coupon>("coupons", {
    where: [{ column: "id", op: "eq", value: id }],
  });
  if (!coupon) throw new Error("Cupón no encontrado");
  return backend.update<Coupon>("coupons", id, { is_active: !coupon.is_active });
}

export async function removeCoupon(id: string) {
  const backend = getBackend();
  await backend.remove("coupons", id);
}

export const getCoupons = cache(async (): Promise<Coupon[]> => {
  const backend = getBackend();
  return backend.list<Coupon>("coupons", { order: [{ column: "created_at", asc: false }] });
});

/* ------------------------------------------------------------------ */
/* Activity log                                                         */
/* ------------------------------------------------------------------ */

export const getActivityLog = cache(async (limit = 40) => {
  const backend = getBackend();
  return backend.list<{
    id: string;
    user_email: string | null;
    action: string;
    entity: string | null;
    summary: string | null;
    created_at: string;
  }>("activity_log", {
    order: [{ column: "created_at", asc: false }],
    limit,
  });
});
