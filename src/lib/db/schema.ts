/**
 * Definición de tablas compartida por los dos backends (Supabase y local).
 * La lista de columnas se usa como whitelist para evitar inyección en el
 * nombre de columna tanto en el driver local como en las queries de PostgREST.
 */

export const TABLES = {
  profiles: "profiles",
  settings: "settings",
  categories: "categories",
  collections: "collections",
  products: "products",
  product_collections: "product_collections",
  product_images: "product_images",
  product_spin360: "product_spin360",
  promotions: "promotions",
  coupons: "coupons",
  variants: "variants",
  stock_movements: "stock_movements",
  raw_materials: "raw_materials",
  material_movements: "material_movements",
  customers: "customers",
  crm_activities: "crm_activities",
  leads: "leads",
  orders: "orders",
  order_items: "order_items",
  custom_designs: "custom_designs",
  reviews: "reviews",
  activity_log: "activity_log",
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];

const COLUMNS: Record<TableName, string[]> = {
  profiles: ["id", "email", "full_name", "role", "avatar_url", "is_active", "created_at", "updated_at"],
  settings: ["key", "value", "updated_at"],
  categories: ["id", "slug", "name", "description", "hero_url", "sort_order", "is_active", "created_at"],
  collections: [
    "id", "slug", "name", "tagline", "description", "theme", "banner_url", "status",
    "starts_at", "ends_at", "sort_order", "seo_title", "seo_description", "created_at", "updated_at",
  ],
  products: [
    "id", "slug", "sku", "name", "subtitle", "description", "category_id", "base_price_ves",
    "compare_at_ves", "cost_ves", "garment_type", "material", "print_technique", "fit",
    "care_instructions", "sizes", "colors", "is_active", "is_featured", "is_custom_only",
    "min_order_qty", "bulk_prices", "lead_time_days", "weight_grams", "tags",
    "seo_title", "seo_description", "created_at", "updated_at",
  ],
  product_collections: ["product_id", "collection_id", "sort_order"],
  product_images: ["id", "product_id", "url", "alt", "kind", "sort_order"],
  product_spin360: ["product_id", "frames", "frame_count", "poster_url", "updated_at"],
  promotions: [
    "id", "name", "scope", "product_id", "collection_id", "kind", "value",
    "starts_at", "ends_at", "is_active", "priority", "created_at",
  ],
  coupons: [
    "id", "code", "kind", "value", "min_subtotal_ves", "max_uses", "used_count",
    "starts_at", "ends_at", "is_active", "description", "created_at",
  ],
  variants: [
    "id", "product_id", "sku", "size", "color", "color_hex", "stock", "reserved_stock",
    "min_stock", "cost_ves", "price_delta_ves", "is_active", "barcode", "created_at", "updated_at",
  ],
  stock_movements: ["id", "variant_id", "type", "quantity", "reason", "order_id", "user_id", "note", "created_at"],
  raw_materials: [
    "id", "sku", "name", "description", "category", "unit", "stock", "min_stock",
    "cost_ves", "supplier", "location", "is_active", "notes", "created_at", "updated_at",
  ],
  material_movements: ["id", "material_id", "type", "quantity", "reason", "order_id", "user_id", "note", "created_at"],
  customers: [
    "id", "full_name", "email", "phone", "whatsapp", "document_id", "city", "state",
    "address", "tags", "marketing_opt_in", "notes", "created_at", "updated_at",
  ],
  crm_activities: ["id", "customer_id", "user_id", "kind", "title", "body", "due_at", "is_done", "created_at"],
  leads: ["id", "name", "email", "phone", "message", "source", "status", "notes", "created_at"],
  orders: [
    "id", "order_number", "customer_id", "customer_name", "customer_email", "customer_phone",
    "kind", "status", "payment_method", "payment_status", "payment_ref", "online_payment_id",
    "items_subtotal_ves", "discount_ves", "shipping_ves", "total_ves", "total_eur", "bcv_rate",
    "coupon_code", "shipping_address", "notes", "internal_notes", "created_at", "updated_at",
    "paid_at", "shipped_at", "delivered_at",
  ],
  order_items: [
    "id", "order_id", "product_id", "variant_id", "name", "sku", "variant_label",
    "unit_price_ves", "quantity", "discount_ves", "subtotal_ves", "options", "custom_design_id",
  ],
  custom_designs: [
    "id", "code", "customer_id", "order_id", "name", "description", "reference_urls",
    "sizes", "colors", "quantity", "garment_type", "style_preference", "deadline", "status",
    "quoted_price_ves", "admin_notes", "contact_name", "contact_email", "contact_phone",
    "created_at", "updated_at",
  ],
  reviews: [
    "id", "product_id", "customer_id", "order_id", "author_name", "rating", "title",
    "body", "is_approved", "created_at",
  ],
  activity_log: ["id", "user_id", "user_email", "action", "entity", "entity_id", "summary", "meta", "created_at"],
};

export function assertTable(table: string): asserts table is TableName {
  if (!(table in COLUMNS)) throw new Error(`Tabla desconocida: ${table}`);
}

export function assertColumn(table: TableName, column: string) {
  if (!COLUMNS[table].includes(column)) {
    throw new Error(`Columna desconocida "${column}" en la tabla "${table}"`);
  }
}

/**
 * ¿La tabla tiene esa columna?
 *
 * Lo usan los dos backends al escribir: no todas las tablas llevan
 * `updated_at` (`order_items`, `product_collections`…), y mandarla en un
 * `UPDATE` a una tabla que no la tiene es un error de Postgres.
 */
export function hasColumn(table: TableName, column: string): boolean {
  return COLUMNS[table].includes(column);
}

/**
 * Columnas que forman la clave primaria de cada tabla.
 *
 * Casi todas usan `id`, pero `settings` se busca por `key` y el visor 360° se
 * identifica por su `product_id` (una sola fila por producto). El backend
 * necesita saberlo para `update`, `remove` y el `onConflict` de los upserts.
 */
const PRIMARY_KEYS: Partial<Record<TableName, string[]>> = {
  settings: ["key"],
  product_spin360: ["product_id"],
  product_collections: ["product_id", "collection_id"],
};

export function primaryKey(table: TableName): string[] {
  return PRIMARY_KEYS[table] ?? ["id"];
}

export const TABLE_COLUMNS = COLUMNS;
