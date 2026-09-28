import { cache } from "react";
import { getBackend } from "@/lib/db";
import type {
  ActivePromotion,
  Category,
  Collection,
  CollectionWithStats,
  HeaderPromo,
  Product,
  ProductImage,
  ProductSpin360,
  PricedProduct,
  Promotion,
  Variant,
} from "@/lib/types";
import { round2 } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Promociones                                                         */
/* ------------------------------------------------------------------ */

function isLive(promo: Promotion, now = Date.now()): boolean {
  if (!promo.is_active) return false;
  const starts = promo.starts_at ? new Date(promo.starts_at).getTime() : -Infinity;
  const ends = promo.ends_at ? new Date(promo.ends_at).getTime() : Infinity;
  return starts <= now && now <= ends;
}

/**
 * Elige la promoción aplicable: gana la de mayor prioridad entre las que
 * apliquen al producto directo o a cualquiera de sus colecciones.
 */
export function resolvePromotion(
  promotions: Promotion[],
  productId: string,
  collectionIds: string[],
  now = Date.now(),
): ActivePromotion | null {
  const candidates = promotions.filter((promo) => {
    if (!isLive(promo, now)) return false;
    if (promo.scope === "product") return promo.product_id === productId;
    return Boolean(promo.collection_id && collectionIds.includes(promo.collection_id));
  });
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (a.scope !== b.scope) return a.scope === "product" ? -1 : 1;
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (a.kind !== b.kind) return a.kind === "percent" ? -1 : 1;
    return b.value - a.value;
  });

  const best = candidates[0];
  return {
    id: best.id,
    name: best.name,
    scope: best.scope,
    kind: best.kind,
    value: best.value,
    starts_at: best.starts_at,
    ends_at: best.ends_at,
    priority: best.priority,
  };
}

export interface PriceResult {
  /** Precio final por unidad en VES. */
  unit: number;
  /** Precio de referencia para tachar. */
  list: number;
  discount_percent: number;
  applied_promotion: ActivePromotion | null;
}

/**
 * Calcula el precio de una unidad. La cantidad solo importa para los precios
 * por volumen declarados en el producto.
 */
export function computePrice(
  product: Pick<Product, "id" | "base_price_ves" | "compare_at_ves" | "bulk_prices">,
  promotion: ActivePromotion | null,
  options: { quantity?: number; delta?: number } = {},
): PriceResult {
  const quantity = Math.max(1, options.quantity ?? 1);
  const base = round2(product.base_price_ves + (options.delta ?? 0));

  // El precio de lista es el de referencia; el "antes" explícito manda.
  const list = round2(Math.max(base, product.compare_at_ves ?? base));

  let unit = base;
  if (product.bulk_prices?.length) {
    const tiers = [...product.bulk_prices].sort((a, b) => b.min_qty - a.min_qty);
    const tier = tiers.find((t) => quantity >= t.min_qty);
    if (tier) unit = round2(tier.unit_price_ves + (options.delta ?? 0));
  }

  let applied: ActivePromotion | null = null;
  if (promotion) {
    const discounted =
      promotion.kind === "percent"
        ? unit * (1 - promotion.value / 100)
        : unit - promotion.value;
    // No dejamos que la promoción deje el producto en cero o negativo.
    if (discounted > 0 && discounted < unit) {
      unit = round2(discounted);
      applied = promotion;
    }
  }

  const discount_percent = list > 0 ? Math.round(((list - unit) / list) * 100) : 0;
  return { unit, list, discount_percent, applied_promotion: applied };
}

/* ------------------------------------------------------------------ */
/* Lecturas del catálogo                                               */
/* ------------------------------------------------------------------ */

export type SortOption =
  | "destacados"
  | "nuevos"
  | "precio-asc"
  | "precio-desc"
  | "nombre";

export interface CatalogFilters {
  search?: string;
  category?: string;
  collection?: string;
  sizes?: string[];
  colors?: string[];
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: SortOption;
  featuredOnly?: boolean;
  customOnly?: boolean;
  excludeCustomOnly?: boolean;
  limit?: number;
}

async function loadAll() {
  const backend = getBackend();
  const [products, images, links, collections, categories, variants, spins, promotions, reviews] =
    await Promise.all([
      backend.list<Product>("products"),
      backend.list<ProductImage>("product_images"),
      backend.list<{ product_id: string; collection_id: string; sort_order: number }>("product_collections"),
      backend.list<Collection>("collections"),
      backend.list<Category>("categories"),
      backend.list<Variant>("variants"),
      backend.list<ProductSpin360>("product_spin360"),
      backend.list<Promotion>("promotions"),
      backend.list<{ product_id: string; rating: number }>("reviews", {
        where: [{ column: "is_approved", op: "eq", value: true }],
      }),
    ]);

  // Promedios de valoración en un mapa: una sola pasada por las reseñas y la
  // ficha, el catálogo y las tarjetas lo consultan sin N+1.
  const totals = new Map<string, { sum: number; count: number }>();
  for (const review of reviews) {
    const acc = totals.get(review.product_id) ?? { sum: 0, count: 0 };
    acc.sum += review.rating;
    acc.count += 1;
    totals.set(review.product_id, acc);
  }
  const reviewStats = new Map<string, { avg: number; count: number }>();
  for (const [productId, { sum, count }] of totals) {
    reviewStats.set(productId, { avg: round2(sum / count), count });
  }

  return { products, images, links, collections, categories, variants, spins, promotions, reviewStats };
}

type PriceContext = Awaited<ReturnType<typeof loadAll>>;

function buildPriced(
  product: Product,
  ctx: PriceContext,
  options: { includeInactive: boolean; quantity?: number },
): PricedProduct {
  const collections = ctx.collections.filter(
    (c) => ctx.links.some((l) => l.product_id === product.id && l.collection_id === c.id),
  );
  const collectionIds = collections.map((c) => c.id);
  const images = ctx.images
    .filter((i) => i.product_id === product.id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const variants = ctx.variants.filter((v) => v.product_id === product.id);
  const category = ctx.categories.find((c) => c.id === product.category_id) ?? null;
  const spin = ctx.spins.find((s) => s.product_id === product.id) ?? null;
  const promotion = resolvePromotion(ctx.promotions, product.id, collectionIds);
  const price = computePrice(product, promotion, { quantity: options.quantity });

  const stockTotal = variants
    .filter((v) => v.is_active)
    .reduce((acc, v) => acc + Math.max(0, v.stock - v.reserved_stock), 0);

  const rating = ctx.reviewStats.get(product.id);

  return {
    ...product,
    images,
    collections: collections.map((c) => ({ id: c.id, slug: c.slug, name: c.name, theme: c.theme })),
    category: category ? { id: category.id, slug: category.slug, name: category.name } : null,
    variants: variants.filter((v) => v.is_active || options.includeInactive),
    spin,
    promotion: price.applied_promotion,
    price_ves: price.unit,
    list_price_ves: price.list,
    discount_percent: price.discount_percent,
    stock_total: stockTotal,
    in_stock: stockTotal > 0,
    category_name: category?.name ?? null,
    review_avg: rating?.avg ?? null,
    review_count: rating?.count ?? 0,
  };
}

function matchesSearch(product: Product, term: string): boolean {
  const haystack = [product.name, product.subtitle, product.description, ...product.tags]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return term
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/** Catálogo con filtros. Es la función central de /catalogo y del home. */
export const getCatalog = cache(async (filters: CatalogFilters = {}): Promise<PricedProduct[]> => {
  const ctx = await loadAll();
  const {
    search, category, collection, sizes, colors, tags,
    minPrice, maxPrice, inStockOnly, sort = "destacados", featuredOnly,
    excludeCustomOnly, limit,
  } = filters;

  const categoryId = category ? ctx.categories.find((c) => c.slug === category)?.id : undefined;
  const collectionId = collection ? ctx.collections.find((c) => c.slug === collection)?.id : undefined;

  let products = ctx.products.filter((p) => p.is_active);

  if (filters.customOnly) products = products.filter((p) => p.is_custom_only);
  if (excludeCustomOnly) products = products.filter((p) => !p.is_custom_only);
  if (featuredOnly) products = products.filter((p) => p.is_featured);
  if (categoryId) products = products.filter((p) => p.category_id === categoryId);
  if (search) products = products.filter((p) => matchesSearch(p, search));
  if (tags?.length) products = products.filter((p) => tags.every((t) => p.tags.includes(t)));

  if (collectionId) {
    const allowed = new Set(
      ctx.links.filter((l) => l.collection_id === collectionId).map((l) => l.product_id),
    );
    products = products.filter((p) => allowed.has(p.id));
  }

  let priced = products.map((p) => buildPriced(p, ctx, { includeInactive: false }));

  if (sizes?.length) {
    priced = priced.filter((p) => p.sizes.some((s) => sizes.includes(s)));
  }
  if (colors?.length) {
    priced = priced.filter((p) => p.colors.some((c) => colors.includes(c.name)));
  }
  if (typeof minPrice === "number") priced = priced.filter((p) => p.price_ves >= minPrice);
  if (typeof maxPrice === "number") priced = priced.filter((p) => p.price_ves <= maxPrice);
  if (inStockOnly) priced = priced.filter((p) => p.in_stock);

  switch (sort) {
    case "precio-asc":
      priced.sort((a, b) => a.price_ves - b.price_ves);
      break;
    case "precio-desc":
      priced.sort((a, b) => b.price_ves - a.price_ves);
      break;
    case "nombre":
      priced.sort((a, b) => a.name.localeCompare(b.name, "es"));
      break;
    case "nuevos":
      priced.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      break;
    default:
      priced.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        const discount = b.discount_percent - a.discount_percent;
        if (discount) return discount;
        return +new Date(b.created_at) - +new Date(a.created_at);
      });
  }

  return limit ? priced.slice(0, limit) : priced;
});

/** Producto completo por slug, para la ficha. */
export const getProductBySlug = cache(async (slug: string): Promise<PricedProduct | null> => {
  const backend = getBackend();
  const product = await backend.one<Product>("products", { where: [{ column: "slug", op: "eq", value: slug }] });
  if (!product) return null;
  const ctx = await loadAll();
  return buildPriced(product, ctx, { includeInactive: false });
});

/** Igual que getProductBySlug pero incluyendo productos no publicados (admin). */
export async function getProductForAdmin(id: string) {
  const backend = getBackend();
  const product = await backend.one<Product>("products", { where: [{ column: "id", op: "eq", value: id }] });
  if (!product) return null;
  const ctx = await loadAll();
  return buildPriced(product, ctx, { includeInactive: true });
}

export const getCategories = cache(async (onlyActive = true): Promise<Category[]> => {
  const backend = getBackend();
  return backend.list<Category>("categories", {
    where: onlyActive ? [{ column: "is_active", op: "eq", value: true }] : undefined,
    order: [{ column: "sort_order", asc: true }],
  });
});

/** Colecciones publicadas con su conteo de productos y promo vigente. */
export const getCollections = cache(async (includeDrafts = false): Promise<CollectionWithStats[]> => {
  const backend = getBackend();
  const [collections, products, links, promotions] = await Promise.all([
    backend.list<Collection>("collections", {
      where: includeDrafts ? undefined : [{ column: "status", op: "eq", value: "published" }],
      order: [{ column: "sort_order", asc: true }],
    }),
    backend.list<Product>("products", { where: [{ column: "is_active", op: "eq", value: true }] }),
    backend.list<{ product_id: string; collection_id: string }>("product_collections"),
    backend.list<Promotion>("promotions"),
  ]);

  return collections.map((collection) => {
    const ids = new Set(
      links.filter((l) => l.collection_id === collection.id).map((l) => l.product_id),
    );
    const inCollection = products.filter((p) => ids.has(p.id));
    const promo = resolvePromotion(promotions, "__none__", [collection.id]);
    return { ...collection, product_count: inCollection.length, active_promotion: promo };
  });
});

export const getCollectionBySlug = cache(async (slug: string) => {
  const all = await getCollections(true);
  return all.find((c) => c.slug === slug) ?? null;
});

/** Productos relacionados: misma categoría o colecciones compartidas. */
export const getRelatedProducts = cache(
  async (product: Pick<Product, "id" | "category_id" | "tags">, limit = 4) => {
    const catalog = await getCatalog({});
    return catalog
      .filter((p) => p.id !== product.id)
      .map((p) => {
        let score = 0;
        if (p.category_id === product.category_id) score += 2;
        score += p.tags.filter((t) => product.tags.includes(t)).length;
        return { p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.p);
  },
);

/** Todos los productos (incluye borradores) para el panel. */
export const getAllProducts = cache(async (): Promise<Product[]> => {
  const backend = getBackend();
  return backend.list<Product>("products", { order: [{ column: "name", asc: true }] });
});

/** Reseñas aprobadas de un producto. */
export const getProductReviews = cache(async (productId: string) => {
  const backend = getBackend();
  return backend.list<{
    id: string; product_id: string; author_name: string; rating: number;
    title: string | null; body: string | null; created_at: string;
  }>("reviews", {
    where: [
      { column: "product_id", op: "eq", value: productId },
      { column: "is_approved", op: "eq", value: true },
    ],
    order: [{ column: "created_at", asc: false }],
  });
});

/**
 * Mejor promoción vigente para la caja de la cabecera y las tarjetas: la de
 * mayor prioridad entre las publicadas y activas, sin importar su alcance.
 */
export const getHeaderPromo = cache(async (): Promise<HeaderPromo | null> => {
  const backend = getBackend();
  const promotions = await backend.list<Promotion>("promotions");
  const live = promotions
    .filter(isLive)
    .sort((a, b) => b.priority - a.priority || b.value - a.value);
  const best = live[0];
  if (!best) return null;
  return {
    id: best.id,
    name: best.name,
    scope: best.scope,
    kind: best.kind,
    value: best.value,
  };
});

/** Opciones de filtro disponibles en el catálogo (para la barra lateral). */
export const getCatalogFacets = cache(async () => {
  const catalog = await getCatalog({});
  const sizes = new Set<string>();
  const colors = new Map<string, string>();
  for (const p of catalog) {
    p.sizes.forEach((s) => sizes.add(s));
    p.colors.forEach((c) => colors.set(c.name, c.hex));
  }
  const prices = catalog.map((p) => p.price_ves);
  return {
    sizes: [...sizes],
    colors: [...colors.entries()].map(([name, hex]) => ({ name, hex })),
    minPrice: prices.length ? Math.floor(Math.min(...prices)) : 0,
    maxPrice: prices.length ? Math.ceil(Math.max(...prices)) : 0,
  };
});
