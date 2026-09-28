import { cache } from "react";
import { timingSafeEqual } from "node:crypto";
import { getBackend, newId, type Where } from "@/lib/db";
import { signValue } from "@/lib/auth";
import type {
  Customer,
  Order,
  OrderItem,
  OrderStatus,
  OrderWithItems,
  PaymentStatus,
  Product,
  Promotion,
  Variant,
} from "@/lib/types";
import { round2 } from "@/lib/utils";
import { computePrice, resolvePromotion } from "@/lib/data/catalog";
import { vesToEur } from "@/lib/bcv";
import { getStoreSettings } from "@/lib/db";

/* ------------------------------------------------------------------ */
/* Numeración de pedidos                                               */
/* ------------------------------------------------------------------ */

export async function nextOrderNumber(): Promise<string> {
  const backend = getBackend();
  const total = await backend.count("orders");
  const now = new Date();
  const prefix = `JLY-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  for (let attempt = 0; attempt < 12; attempt++) {
    const candidate = `${prefix}-${String(total + 1 + attempt).padStart(4, "0")}`;
    const exists = await backend.one<Order>("orders", {
      where: [{ column: "order_number", op: "eq", value: candidate }],
    });
    if (!exists) return candidate;
  }
  return `${prefix}-${Math.floor(1000 + Math.random() * 8999)}`;
}

export async function nextDesignCode(): Promise<string> {
  const backend = getBackend();
  const total = await backend.count("custom_designs");
  return `JLY-D-${String(total + 1).padStart(3, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Creación de pedidos                                                 */
/* ------------------------------------------------------------------ */

export interface CheckoutLine {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export interface CheckoutInput {
  lines: CheckoutLine[];
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  kind?: Order["kind"];
  paymentMethod: Order["payment_method"];
  couponCode?: string | null;
  shippingAddress: Order["shipping_address"];
  notes?: string | null;
  customerId?: string | null;
  /** Ya descontado: se registra como pagado (uso del panel). */
  markAsPaid?: boolean;
  userId?: string | null;
}

export interface CheckoutResult {
  order: Order;
  warnings: string[];
  /** Firma para el enlace privado de confirmación/rastreo. */
  token: string;
}

/**
 * Crea un pedido calculando todos los importes en el servidor a partir del
 * catálogo: el precio que envía el navegador nunca se usa.
 */
export async function createOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const backend = getBackend();
  const warnings: string[] = [];
  const settings = await getStoreSettings();

  if (input.lines.length === 0) throw new Error("El pedido no tiene productos.");

  const [products, variants, links, promotions] = await Promise.all([
    backend.list<Product>("products"),
    backend.list<Variant>("variants"),
    backend.list<{ product_id: string; collection_id: string }>("product_collections"),
    backend.list<Promotion>("promotions"),
  ]);

  const items: OrderItem[] = [];
  let subtotal = 0;

  for (const line of input.lines) {
    const product = products.find((p) => p.id === line.productId && p.is_active);
    if (!product) {
      warnings.push("Un producto ya no está disponible y se omitió del pedido.");
      continue;
    }
    const variant = line.variantId ? variants.find((v) => v.id === line.variantId) : null;
    const collectionIds = links
      .filter((l) => l.product_id === product.id)
      .map((l) => l.collection_id);
    const promo = resolvePromotion(promotions, product.id, collectionIds);
    const price = computePrice(product, promo, {
      quantity: line.quantity,
      delta: variant?.price_delta_ves ?? 0,
    });

    const available = variant ? Math.max(0, variant.stock - variant.reserved_stock) : null;
    let quantity = line.quantity;
    if (available !== null && quantity > available) {
      warnings.push(
        available === 0
          ? `${product.name} (${variant?.size ?? "—"} / ${variant?.color ?? "—"}) se agotó mientras armabas el pedido.`
          : `Solo quedaban ${available} unidades de ${product.name}; ajustamos la cantidad.`,
      );
      quantity = available;
    }
    if (quantity <= 0) continue;

    const itemSubtotal = round2(price.unit * quantity);
    subtotal += itemSubtotal;

    items.push({
      id: newId(),
      order_id: "",
      product_id: product.id,
      variant_id: variant?.id ?? null,
      name: product.name,
      sku: variant?.sku ?? product.sku,
      variant_label: variant ? `${variant.size ?? "Única"} / ${variant.color ?? "—"}` : "Sin variante",
      unit_price_ves: price.unit,
      quantity,
      discount_ves: round2((price.list - price.unit) * quantity),
      subtotal_ves: itemSubtotal,
      options: null,
      custom_design_id: null,
    });
  }

  if (items.length === 0) throw new Error("No quedó ningún producto disponible en el pedido.");

  // --- Cupón ---
  let discount = 0;
  let appliedCoupon: string | null = null;
  const code = input.couponCode?.trim().toUpperCase();
  if (code) {
    const coupon = await backend.one<{
      id: string; code: string; kind: "percent" | "fixed"; value: number;
      min_subtotal_ves: number; max_uses: number | null; used_count: number;
      starts_at: string | null; ends_at: string | null; is_active: boolean;
    }>("coupons", { where: [{ column: "code", op: "eq", value: code }] });

    const now = Date.now();
    const valid =
      coupon &&
      coupon.is_active &&
      (coupon.starts_at ? new Date(coupon.starts_at).getTime() <= now : true) &&
      (coupon.ends_at ? new Date(coupon.ends_at).getTime() >= now : true) &&
      (coupon.max_uses === null || coupon.used_count < coupon.max_uses) &&
      subtotal >= coupon.min_subtotal_ves;

    if (valid && coupon) {
      appliedCoupon = coupon.code;
      discount =
        coupon.kind === "percent"
          ? round2((subtotal * coupon.value) / 100)
          : Math.min(coupon.value, subtotal);
      discount = round2(discount);
      await backend.update("coupons", coupon.id, { used_count: coupon.used_count + 1 });
    } else {
      warnings.push("El código de descuento no se aplicó: no es válido para este pedido.");
    }
  }

  // --- Envío ---
  const afterDiscount = Math.max(0, subtotal - discount);
  const freeOver = settings.free_shipping_over_ves;
  const shipping =
    freeOver > 0 && afterDiscount >= freeOver
      ? 0
      : settings.shipping_flat_ves;

  const total = round2(afterDiscount + shipping);
  const rate = settings.bcv_rate;

  // --- Cliente: se reutiliza el registro si el correo ya existe ---
  let customerId = input.customerId ?? null;
  if (!customerId && input.customerEmail) {
    const existing = await backend.one<Customer>("customers", {
      where: [{ column: "email", op: "ilike", value: input.customerEmail }],
    });
    if (existing) {
      customerId = existing.id;
      await backend.update("customers", existing.id, {
        full_name: input.customerName,
        phone: input.customerPhone ?? existing.phone,
        updated_at: new Date().toISOString(),
      });
    }
  }
  if (!customerId) {
    customerId = newId();
    await backend.insert<Customer>("customers", {
      id: customerId,
      full_name: input.customerName,
      email: input.customerEmail ?? null,
      phone: input.customerPhone ?? null,
      whatsapp: input.customerPhone ?? null,
      document_id: null,
      city: input.shippingAddress?.city ?? null,
      state: input.shippingAddress?.state ?? null,
      address: input.shippingAddress?.address ?? null,
      tags: [],
      marketing_opt_in: true,
      notes: null,
    });
  }

  const paid = input.markAsPaid ?? false;
  const nowIso = new Date().toISOString();
  const order: Order = {
    id: newId(),
    order_number: await nextOrderNumber(),
    customer_id: customerId,
    customer_name: input.customerName,
    customer_email: input.customerEmail ?? null,
    customer_phone: input.customerPhone ?? null,
    kind: input.kind ?? "product",
    status: paid ? "paid" : "pending_payment",
    payment_method: input.paymentMethod,
    payment_status: paid ? "paid" : "pending",
    payment_ref: null,
    online_payment_id: null,
    items_subtotal_ves: round2(subtotal),
    discount_ves: discount,
    shipping_ves: shipping,
    total_ves: total,
    total_eur: vesToEur(total, rate),
    bcv_rate: rate,
    coupon_code: appliedCoupon,
    shipping_address: input.shippingAddress,
    notes: input.notes ?? null,
    internal_notes: null,
    created_at: nowIso,
    updated_at: nowIso,
    paid_at: paid ? nowIso : null,
    shipped_at: null,
    delivered_at: null,
  };

  const created = await backend.insert<Order>("orders", order);
  await backend.insertMany<OrderItem>(
    "order_items",
    items.map((item) => ({ ...item, order_id: created.id })),
  );

  // --- Descuento de inventario ---
  for (const item of items) {
    if (!item.variant_id) continue;
    const variant = variants.find((v) => v.id === item.variant_id);
    if (!variant) continue;
    const type = paid ? "out" : "reserve";
    const delta = item.quantity * (paid ? -1 : 1);
    await backend.update<Variant>("variants", variant.id, {
      stock: variant.stock + delta,
      reserved_stock: variant.reserved_stock + (paid ? 0 : item.quantity),
    });
    await backend.insert("stock_movements", {
      variant_id: variant.id,
      type,
      quantity: paid ? -item.quantity : item.quantity,
      reason: `Pedido ${created.order_number}`,
      order_id: created.id,
      user_id: input.userId ?? null,
      note: null,
    });
  }

  await backend.insert("activity_log", {
    user_id: input.userId ?? null,
    user_email: null,
    action: "create",
    entity: "order",
    entity_id: created.id,
    summary: `Pedido ${created.order_number} por ${total.toFixed(2)} Bs`,
    meta: { source: input.markAsPaid ? "admin" : "web" },
  });

  return { order: { ...created, order_number: order.order_number }, warnings, token: orderToken(created) };
}

/* ------------------------------------------------------------------ */
/* Enlace privado de un pedido                                        */
/* ------------------------------------------------------------------ */

/**
 * Los números de pedido son correlativos, así que el detalle no se sirve solo
 * con el número: la URL de confirmación incluye además esta firma. Quien tenga
 * el enlace puede ver el pedido; quien solo sepa el número, no.
 */
export function orderToken(order: { id: string; order_number: string }): string {
  return signValue(`${order.id}:${order.order_number}`);
}

export function verifyOrderToken(
  token: string | undefined,
  order: { id: string; order_number: string },
): boolean {
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(orderToken(order));
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ------------------------------------------------------------------ */
/* Consultas                                                           */
/* ------------------------------------------------------------------ */

export interface OrderFilters {
  status?: OrderStatus | "todos";
  paymentStatus?: PaymentStatus | "todos";
  kind?: Order["kind"] | "todos";
  search?: string;
  customerId?: string;
  limit?: number;
  offset?: number;
}

export const getOrders = cache(async (filters: OrderFilters = {}): Promise<OrderWithItems[]> => {
  const backend = getBackend();
  const where: Where[] = [];
  if (filters.status && filters.status !== "todos") where.push({ column: "status", op: "eq", value: filters.status });
  if (filters.paymentStatus && filters.paymentStatus !== "todos")
    where.push({ column: "payment_status", op: "eq", value: filters.paymentStatus });
  if (filters.kind && filters.kind !== "todos") where.push({ column: "kind", op: "eq", value: filters.kind });
  if (filters.customerId) where.push({ column: "customer_id", op: "eq", value: filters.customerId });
  if (filters.search) {
    where.push({ column: "customer_name", op: "ilike", value: filters.search });
  }

  const orders = await backend.list<Order>("orders", {
    where,
    order: [{ column: "created_at", asc: false }],
    limit: filters.limit ?? 200,
    offset: filters.offset,
  });
  if (orders.length === 0) return [];

  const items = await backend.list<OrderItem>("order_items", {
    where: [{ column: "order_id", op: "in", value: orders.map((o) => o.id) }],
  });
  return orders.map((order) => ({
    ...order,
    items: items.filter((i) => i.order_id === order.id),
  }));
});

export const getOrderByNumber = cache(async (number: string) => {
  const backend = getBackend();
  const order = await backend.one<Order>("orders", {
    where: [{ column: "order_number", op: "ilike", value: number }],
  });
  if (!order) return null;
  const items = await backend.list<OrderItem>("order_items", {
    where: [{ column: "order_id", op: "eq", value: order.id }],
  });
  const customer = order.customer_id
    ? await backend.one<Customer>("customers", {
        where: [{ column: "id", op: "eq", value: order.customer_id }],
      })
    : null;
  return { ...order, items, customer } satisfies OrderWithItems;
});

/* ------------------------------------------------------------------ */
/* Actualizaciones desde el panel                                      */
/* ------------------------------------------------------------------ */

const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  draft: ["pending_payment", "cancelled"],
  pending_payment: ["paid", "cancelled"],
  paid: ["in_production", "ready", "cancelled"],
  in_production: ["ready", "cancelled"],
  ready: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: ["pending_payment"],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true;
  return STATUS_FLOW[from].includes(to);
}

export async function updateOrder(
  id: string,
  patch: Partial<Pick<Order, "status" | "payment_status" | "payment_method" | "payment_ref" | "notes" | "internal_notes" | "kind" | "online_payment_id">>,
) {
  const backend = getBackend();
  const current = await backend.one<Order>("orders", { where: [{ column: "id", op: "eq", value: id }] });
  if (!current) throw new Error("Pedido no encontrado");
  if (patch.status && !canTransition(current.status, patch.status)) {
    throw new Error(`No se puede pasar de "${current.status}" a "${patch.status}".`);
  }

  const nowIso = new Date().toISOString();
  const next: Partial<Order> = { ...patch };

  if (patch.status === "paid" && current.payment_status !== "paid") {
    next.payment_status = "paid";
    next.paid_at = nowIso;
  }
  if (patch.status === "shipped") next.shipped_at = nowIso;
  if (patch.status === "delivered") next.delivered_at = nowIso;
  if (patch.payment_status === "paid" && !current.paid_at) next.paid_at = nowIso;

  // Al pasar a pagado, el stock reservado se consume de verdad.
  if ((patch.status === "paid" || patch.payment_status === "paid") && current.payment_status !== "paid") {
    const items = await backend.list<OrderItem>("order_items", {
      where: [{ column: "order_id", op: "eq", value: id }],
    });
    for (const item of items) {
      if (!item.variant_id) continue;
      const variant = await backend.one<Variant>("variants", {
        where: [{ column: "id", op: "eq", value: item.variant_id }],
      });
      if (!variant) continue;
      const reserved = Math.min(variant.reserved_stock, item.quantity);
      await backend.update("variants", variant.id, {
        stock: variant.stock - reserved,
        reserved_stock: variant.reserved_stock - reserved,
      });
      if (reserved > 0) {
        await backend.insert("stock_movements", {
          variant_id: variant.id,
          type: "out",
          quantity: -reserved,
          reason: `Pedido ${current.order_number} (pago confirmado)`,
          order_id: id,
          user_id: null,
          note: null,
        });
      }
    }
  }

  const updated = await backend.update<Order>("orders", id, next);
  await backend.insert("activity_log", {
    user_id: null,
    user_email: null,
    action: "update",
    entity: "order",
    entity_id: id,
    summary: `Pedido ${current.order_number}: ${Object.keys(patch).join(", ")}`,
    meta: { from: current.status, to: updated.status },
  });
  return updated;
}

/** Órdenes de trabajo: pedidos pagados que aún no se entregan. */
export const getOpenOrders = cache(async (): Promise<OrderWithItems[]> => {
  const orders = await getOrders({ status: "todos" });
  return orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
});
