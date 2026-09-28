/**
 * Tipos de dominio de JayLu.
 * Reflejan 1:1 el esquema de Supabase (supabase/schema.sql).
 */

export type ID = string;
export type ISODate = string;

/* ------------------------------------------------------------------ */
/* Perfiles y ajustes                                                  */
/* ------------------------------------------------------------------ */

export type Role = "admin" | "staff";

export interface Profile {
  id: ID;
  email: string;
  full_name: string | null;
  role: Role;
  avatar_url: string | null;
  is_active: boolean;
  created_at: ISODate;
  updated_at: ISODate;
}

/* ------------------------------------------------------------------ */
/* Catálogo                                                           */
/* ------------------------------------------------------------------ */

export type CollectionTheme =
  | "anime"
  | "fantasia"
  | "videojuegos"
  | "streetwear"
  | "minimal"
  | "uniformes"
  | "temporada"
  | "colaboracion"
  | "otro";

export const COLLECTION_THEMES: { value: CollectionTheme; label: string }[] = [
  { value: "anime", label: "Anime" },
  { value: "fantasia", label: "Fantasía" },
  { value: "videojuegos", label: "Videojuegos" },
  { value: "streetwear", label: "Streetwear" },
  { value: "minimal", label: "Minimal" },
  { value: "uniformes", label: "Uniformes" },
  { value: "temporada", label: "Temporada" },
  { value: "colaboracion", label: "Colaboración" },
  { value: "otro", label: "Otro" },
];

export type PublishStatus = "draft" | "published" | "archived";

export interface Category {
  id: ID;
  slug: string;
  name: string;
  description: string | null;
  hero_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: ISODate;
}

export interface Collection {
  id: ID;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  theme: CollectionTheme;
  banner_url: string | null;
  status: PublishStatus;
  starts_at: ISODate | null;
  ends_at: ISODate | null;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

/** Colección + conteo de productos y promo activa (calculado en el server). */
export interface CollectionWithStats extends Collection {
  product_count: number;
  active_promotion: ActivePromotion | null;
}

export type ColorOption = { name: string; hex: string };

export interface BulkPriceTier {
  min_qty: number;
  unit_price_ves: number;
}

export interface Product {
  id: ID;
  slug: string;
  sku: string | null;
  name: string;
  subtitle: string | null;
  description: string | null;
  category_id: ID | null;
  base_price_ves: number;
  compare_at_ves: number | null;
  cost_ves: number;
  garment_type: string;
  material: string | null;
  print_technique: string | null;
  fit: string | null;
  care_instructions: string | null;
  sizes: string[];
  colors: ColorOption[];
  is_active: boolean;
  is_featured: boolean;
  /** Si es true no se vende del catálogo: solo bajo pedido a medida. */
  is_custom_only: boolean;
  min_order_qty: number;
  bulk_prices: BulkPriceTier[];
  lead_time_days: number;
  weight_grams: number | null;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface ProductImage {
  id: ID;
  product_id: ID;
  url: string;
  alt: string | null;
  kind: "main" | "gallery" | "360";
  sort_order: number;
}

export interface ProductSpin360 {
  product_id: ID;
  frames: string[];
  frame_count: number;
  poster_url: string | null;
  updated_at: ISODate;
}

/* ------------------------------------------------------------------ */
/* Promociones y cupones                                              */
/* ------------------------------------------------------------------ */

export type PromoKind = "percent" | "fixed";
export type PromoScope = "product" | "collection";

export interface Promotion {
  id: ID;
  name: string;
  scope: PromoScope;
  product_id: ID | null;
  collection_id: ID | null;
  kind: PromoKind;
  value: number;
  starts_at: ISODate | null;
  ends_at: ISODate | null;
  is_active: boolean;
  /** A mayor número, mayor prioridad si se solapan. */
  priority: number;
  created_at: ISODate;
}

export interface Coupon {
  id: ID;
  code: string;
  kind: PromoKind;
  value: number;
  min_subtotal_ves: number;
  max_uses: number | null;
  used_count: number;
  starts_at: ISODate | null;
  ends_at: ISODate | null;
  is_active: boolean;
  description: string | null;
  created_at: ISODate;
}

/* ------------------------------------------------------------------ */
/* Inventario: producto terminado y materia prima                     */
/* ------------------------------------------------------------------ */

export interface Variant {
  id: ID;
  product_id: ID;
  sku: string | null;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  stock: number;
  reserved_stock: number;
  min_stock: number;
  cost_ves: number;
  price_delta_ves: number;
  is_active: boolean;
  barcode: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export type StockMovementType = "in" | "out" | "reserve" | "release" | "adjust";

export interface StockMovement {
  id: ID;
  variant_id: ID;
  type: StockMovementType;
  quantity: number;
  reason: string | null;
  order_id: ID | null;
  user_id: ID | null;
  note: string | null;
  created_at: ISODate;
}

export const MATERIAL_CATEGORIES = [
  "tela",
  "tinta",
  "vinilo",
  "hilo",
  "papel",
  "empaque",
  "maquina",
  "consumible",
  "otro",
] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  tela: "Telas",
  tinta: "Tintas",
  vinilo: "Vinilos y transfers",
  hilo: "Hilos y costuras",
  papel: "Papeles y cartulina",
  empaque: "Empaque",
  maquina: "Maquinaria",
  consumible: "Consumibles",
  otro: "Otros",
};

export const MATERIAL_UNITS = [
  "unidad",
  "metro",
  "kg",
  "litro",
  "rollo",
  "paquete",
  "caja",
  "par",
] as const;
export type MaterialUnit = (typeof MATERIAL_UNITS)[number];

export interface RawMaterial {
  id: ID;
  sku: string | null;
  name: string;
  description: string | null;
  category: MaterialCategory;
  unit: MaterialUnit;
  stock: number;
  min_stock: number;
  cost_ves: number;
  supplier: string | null;
  location: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export type MaterialMovementType = "in" | "out" | "adjust" | "waste";

export interface MaterialMovement {
  id: ID;
  material_id: ID;
  type: MaterialMovementType;
  quantity: number;
  reason: string | null;
  order_id: ID | null;
  user_id: ID | null;
  note: string | null;
  created_at: ISODate;
}

/* ------------------------------------------------------------------ */
/* Clientes y CRM                                                     */
/* ------------------------------------------------------------------ */

export interface Customer {
  id: ID;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  document_id: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  tags: string[];
  marketing_opt_in: boolean;
  notes: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

export interface CustomerWithStats extends Customer {
  orders_count: number;
  total_spent_ves: number;
  last_order_at: ISODate | null;
  designs_count: number;
}

export type CrmActivityKind = "note" | "call" | "meeting" | "task" | "whatsapp";

export const CRM_KIND_LABELS: Record<CrmActivityKind, string> = {
  note: "Nota",
  call: "Llamada",
  meeting: "Cita",
  task: "Tarea",
  whatsapp: "WhatsApp",
};

export interface CrmActivity {
  id: ID;
  customer_id: ID;
  user_id: ID | null;
  kind: CrmActivityKind;
  title: string | null;
  body: string | null;
  due_at: ISODate | null;
  is_done: boolean;
  created_at: ISODate;
}

export type LeadStatus = "new" | "contacted" | "quoted" | "won" | "lost";

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  quoted: "Cotizado",
  won: "Ganado",
  lost: "Perdido",
};

export interface Lead {
  id: ID;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string | null;
  status: LeadStatus;
  notes: string | null;
  created_at: ISODate;
}

/* ------------------------------------------------------------------ */
/* Pedidos                                                            */
/* ------------------------------------------------------------------ */

export type OrderKind = "product" | "custom" | "wholesale";
export type OrderStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "in_production"
  | "ready"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";
export type PaymentMethod =
  | "pago_movil"
  | "zelle"
  | "transferencia"
  | "binance"
  | "efectivo"
  | "tarjeta"
  | "otro";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Borrador",
  pending_payment: "Pendiente de pago",
  paid: "Pagado",
  in_production: "En producción",
  ready: "Listo para entregar",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  refunded: "Reembolsado",
  failed: "Fallido",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pago_movil: "Pago móvil",
  zelle: "Zelle",
  transferencia: "Transferencia",
  binance: "Binance Pay",
  efectivo: "Efectivo",
  tarjeta: "Tarjeta (online)",
  otro: "Otro",
};

/**
 * Técnicas de estampado que el taller ofrece hoy.
 *
 * Solo sublimación y DTF textil. Serigrafía y bordado no entran en la lista
 * hasta que se empiece a ofrecer el servicio. Una sola fuente de verdad para
 * que el formulario del panel, el formulario de diseño y los textos no se
 * contradigan entre sí.
 */
export const PRINT_TECHNIQUES = [
  {
    value: "sublimacion",
    label: "Sublimación",
    detail:
      "La tinta entra en la fibra: no se agrieta, no se cuartea y no se nota al tacto. Es la opción para diseño a todo color, fotos y degradados.",
  },
  {
    value: "dtf-textil",
    label: "DTF textil",
    detail:
      "Transferencia en frío con film flexible: sirve para cualquier prenda y cualquier color, y admite volúmenes pequeños sin montar pantallas.",
  },
] as const;

export type PrintTechnique = (typeof PRINT_TECHNIQUES)[number]["value"];

/** Etiquetas que se muestran en la ficha pública del producto. */
export const PRINT_TECHNIQUE_LABELS: Record<string, string> = Object.fromEntries(
  PRINT_TECHNIQUES.map((technique) => [technique.value, technique.label]),
);

/**
 * Traduce el valor guardado a la etiqueta que ve el cliente.
 *
 * La columna es texto libre en la base, así que puede haber filas viejas con
 * algo escrito a mano ("DTF textil", "Sublimación"). Esos valores se devuelven
 * tal cual en vez de desaparecer de la ficha.
 */
export function techniqueLabel(value: string): string {
  return PRINT_TECHNIQUE_LABELS[value] ?? value;
}

export interface Order {
  id: ID;
  order_number: string;
  customer_id: ID | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  kind: OrderKind;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  payment_ref: string | null;
  online_payment_id: string | null;
  items_subtotal_ves: number;
  discount_ves: number;
  shipping_ves: number;
  total_ves: number;
  /** Snapshot de la equivalencia al momento de crear el pedido. */
  total_eur: number;
  bcv_rate: number;
  coupon_code: string | null;
  shipping_address: ShippingAddress | null;
  notes: string | null;
  internal_notes: string | null;
  created_at: ISODate;
  updated_at: ISODate;
  paid_at: ISODate | null;
  shipped_at: ISODate | null;
  delivered_at: ISODate | null;
}

export interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  zip?: string;
  notes?: string;
}

export interface OrderItem {
  id: ID;
  order_id: ID;
  product_id: ID | null;
  variant_id: ID | null;
  name: string;
  sku: string | null;
  variant_label: string | null;
  unit_price_ves: number;
  quantity: number;
  discount_ves: number;
  subtotal_ves: number;
  options: Record<string, unknown> | null;
  custom_design_id: ID | null;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  customer?: Customer | null;
}

/* ------------------------------------------------------------------ */
/* Diseños a medida                                                   */
/* ------------------------------------------------------------------ */

export type DesignStatus =
  | "new"
  | "quoting"
  | "approved"
  | "in_design"
  | "production"
  | "ready"
  | "delivered"
  | "rejected";

export const DESIGN_STATUS_LABELS: Record<DesignStatus, string> = {
  new: "Nueva solicitud",
  quoting: "En cotización",
  approved: "Aprobada",
  in_design: "En diseño",
  production: "En producción",
  ready: "Lista",
  delivered: "Entregada",
  rejected: "Rechazada",
};

export interface CustomDesign {
  id: ID;
  code: string;
  customer_id: ID | null;
  order_id: ID | null;
  name: string | null;
  description: string | null;
  /** Fotos de referencia subidas por el cliente (bucket privado). */
  reference_urls: string[];
  sizes: string[];
  colors: string[];
  quantity: number;
  garment_type: string | null;
  style_preference: string | null;
  deadline: ISODate | null;
  status: DesignStatus;
  quoted_price_ves: number | null;
  admin_notes: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: ISODate;
  updated_at: ISODate;
}

/* ------------------------------------------------------------------ */
/* Reseñas y auditoría                                                */
/* ------------------------------------------------------------------ */

export interface Review {
  id: ID;
  product_id: ID;
  customer_id: ID | null;
  order_id: ID | null;
  author_name: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_approved: boolean;
  created_at: ISODate;
}

export interface ActivityLog {
  id: ID;
  user_id: ID | null;
  user_email: string | null;
  action: string;
  entity: string | null;
  entity_id: ID | null;
  summary: string | null;
  meta: Record<string, unknown> | null;
  created_at: ISODate;
}

/* ------------------------------------------------------------------ */
/* Ajustes de la tienda                                               */
/* ------------------------------------------------------------------ */

export interface StoreSettings {
  store_name: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  tiktok: string;
  address: string;
  /** Ej.: "Bs.S" */
  currency_symbol: string;
  /** Precio base de envío en VES. */
  shipping_flat_ves: number;
  /** Envío gratis a partir de este monto (0 = desactivado). */
  free_shipping_over_ves: number;
  /** Tasa BCV manual; 0 = usar la automática. */
  bcv_eur_manual_rate: number;
  bcv_rate: number;
  bcv_updated_at: ISODate | null;
  bcv_source: string | null;
  bcv_stale: boolean;
  online_payments_enabled: boolean;
  stripe_price_id_mode: "ves" | "usd";
  /* Datos de cobro que el checkout muestra al cliente tras confirmar el pedido. */
  bank_name: string;
  bank_account_type: string;
  bank_account_number: string;
  bank_account_name: string;
  pago_movil_phone: string;
  zelle_name: string;
  zelle_phone: string;
  binance_email: string;
  binance_pay_id: string;
  order_notes_template: string;
}

/* ------------------------------------------------------------------ */
/* Cálculo de precios                                                 */
/* ------------------------------------------------------------------ */

export interface ActivePromotion {
  id: ID;
  name: string;
  scope: PromoScope;
  kind: PromoKind;
  value: number;
  starts_at: ISODate | null;
  ends_at: ISODate | null;
  priority: number;
}

export interface PricedProduct extends Product {
  images: ProductImage[];
  collections: Pick<Collection, "id" | "slug" | "name" | "theme">[];
  category: Pick<Category, "id" | "slug" | "name"> | null;
  variants: Variant[];
  spin: ProductSpin360 | null;
  promotion: ActivePromotion | null;
  /** Precio final por unidad en VES (ya con promo). */
  price_ves: number;
  /** Precio original para tachar. */
  list_price_ves: number;
  discount_percent: number;
  stock_total: number;
  in_stock: boolean;
  category_name: string | null;
  /** Promedio de valoraciones aprobadas (null si aún no hay reseñas). */
  review_avg: number | null;
  /** Cantidad de reseñas aprobadas. */
  review_count: number;
}

/** Promoción vigente de mayor jerarquía para la caja de la cabecera. */
export interface HeaderPromo {
  id: ID;
  name: string;
  scope: PromoScope;
  kind: PromoKind;
  value: number;
}
