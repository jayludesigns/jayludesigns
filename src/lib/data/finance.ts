import { cache } from "react";
import { getBackend } from "@/lib/db";
import type { Order, OrderItem, Product, Variant } from "@/lib/types";

const DAY = 86_400_000;

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export interface SalesPoint {
  date: string;
  label: string;
  orders: number;
  revenue_ves: number;
  revenue_eur: number;
}

export interface FinanceSummary {
  today: { orders: number; revenue_ves: number; revenue_eur: number };
  month: { orders: number; revenue_ves: number; revenue_eur: number };
  pending: { count: number; amount_ves: number };
  averageTicket: { ves: number; eur: number };
  costOfGoods: number;
  grossMargin: number;
  marginPercent: number;
  series: SalesPoint[];
  topProducts: { name: string; units: number; revenue_ves: number }[];
  byCollection: { name: string; units: number; revenue_ves: number }[];
  byStatus: { status: string; count: number; amount_ves: number }[];
  byPaymentMethod: { method: string; count: number; amount_ves: number }[];
}

const LOCALE_SHORT = new Intl.DateTimeFormat("es-VE", { day: "2-digit", month: "short" });

export const getFinanceSummary = cache(async (days = 30): Promise<FinanceSummary> => {
  const backend = getBackend();
  const [orders, items, products, variants, links, collections] = await Promise.all([
    backend.list<Order>("orders"),
    backend.list<OrderItem>("order_items"),
    backend.list<Product>("products"),
    backend.list<Variant>("variants"),
    backend.list<{ product_id: string; collection_id: string }>("product_collections"),
    backend.list<{ id: string; name: string }>("collections"),
  ]);

  const valid = orders.filter((o) => o.status !== "cancelled");
  const paid = valid.filter((o) => o.payment_status === "paid");
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const from = todayStart.getTime() - (days - 1) * DAY;

  const inRange = valid.filter((o) => new Date(o.created_at).getTime() >= from);
  const paidInRange = inRange.filter((o) => o.payment_status === "paid");

  // Serie diaria con días sin venta rellenados.
  const buckets = new Map<string, SalesPoint>();
  for (let i = 0; i < days; i++) {
    const date = new Date(todayStart.getTime() - i * DAY);
    const key = dayKey(date.toISOString());
    buckets.set(key, {
      date: key,
      label: LOCALE_SHORT.format(date),
      orders: 0,
      revenue_ves: 0,
      revenue_eur: 0,
    });
  }
  for (const order of paidInRange) {
    const key = dayKey(order.created_at);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.orders += 1;
    bucket.revenue_ves = Math.round((bucket.revenue_ves + order.total_ves) * 100) / 100;
    bucket.revenue_eur = Math.round((bucket.revenue_eur + order.total_eur) * 100) / 100;
  }

  const todayPaid = paid.filter((o) => new Date(o.created_at).getTime() >= todayStart.getTime());
  const monthPaid = paid.filter((o) => new Date(o.created_at).getTime() >= monthStart.getTime());
  const pending = valid.filter((o) => o.payment_status === "pending");
  const sum = (list: Order[]) => Math.round(list.reduce((acc, o) => acc + o.total_ves, 0) * 100) / 100;
  const sumEur = (list: Order[]) => Math.round(list.reduce((acc, o) => acc + o.total_eur, 0) * 100) / 100;

  // Costo de mercadería vendida: costo de variante o 60% del precio como respaldo.
  const productMap = new Map(products.map((p) => [p.id, p]));
  const variantMap = new Map(variants.map((v) => [v.id, v]));
  const paidIds = new Set(paid.map((o) => o.id));
  let costOfGoods = 0;
  const topProducts = new Map<string, { units: number; revenue_ves: number }>();
  const byCollection = new Map<string, { units: number; revenue_ves: number }>();

  for (const item of items) {
    if (!item.order_id || !paidIds.has(item.order_id)) continue;
    const product = item.product_id ? productMap.get(item.product_id) : null;
    const variant = item.variant_id ? variantMap.get(item.variant_id) : null;
    const unitCost = variant?.cost_ves || product?.cost_ves || item.unit_price_ves * 0.6;
    costOfGoods += unitCost * item.quantity;

    const name = product?.name ?? item.name;
    const entry = topProducts.get(name) ?? { units: 0, revenue_ves: 0 };
    entry.units += item.quantity;
    entry.revenue_ves = Math.round((entry.revenue_ves + item.subtotal_ves) * 100) / 100;
    topProducts.set(name, entry);

    if (product) {
      for (const link of links.filter((l) => l.product_id === product.id)) {
        const collection = collections.find((c) => c.id === link.collection_id);
        if (!collection) continue;
        const cEntry = byCollection.get(collection.name) ?? { units: 0, revenue_ves: 0 };
        cEntry.units += item.quantity;
        cEntry.revenue_ves = Math.round((cEntry.revenue_ves + item.subtotal_ves) * 100) / 100;
        byCollection.set(collection.name, cEntry);
      }
    }
  }

  const monthRevenue = sum(monthPaid);
  const byStatusMap = new Map<string, { count: number; amount_ves: number }>();
  for (const order of valid) {
    const entry = byStatusMap.get(order.status) ?? { count: 0, amount_ves: 0 };
    entry.count += 1;
    entry.amount_ves = Math.round((entry.amount_ves + order.total_ves) * 100) / 100;
    byStatusMap.set(order.status, entry);
  }
  const byMethodMap = new Map<string, { count: number; amount_ves: number }>();
  for (const order of paid) {
    const key = order.payment_method ?? "otro";
    const entry = byMethodMap.get(key) ?? { count: 0, amount_ves: 0 };
    entry.count += 1;
    entry.amount_ves = Math.round((entry.amount_ves + order.total_ves) * 100) / 100;
    byMethodMap.set(key, entry);
  }

  const grossMargin = Math.round((monthRevenue - costOfGoods) * 100) / 100;

  return {
    today: { orders: todayPaid.length, revenue_ves: sum(todayPaid), revenue_eur: sumEur(todayPaid) },
    month: { orders: monthPaid.length, revenue_ves: monthRevenue, revenue_eur: sumEur(monthPaid) },
    pending: { count: pending.length, amount_ves: sum(pending) },
    averageTicket: {
      ves: paid.length ? Math.round((sum(paid) / paid.length) * 100) / 100 : 0,
      eur: paid.length ? Math.round((sumEur(paid) / paid.length) * 100) / 100 : 0,
    },
    costOfGoods: Math.round(costOfGoods * 100) / 100,
    grossMargin,
    marginPercent: monthRevenue > 0 ? Math.round((grossMargin / monthRevenue) * 100) : 0,
    series: [...buckets.values()].reverse(),
    topProducts: [...topProducts.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue_ves - a.revenue_ves)
      .slice(0, 8),
    byCollection: [...byCollection.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue_ves - a.revenue_ves),
    byStatus: [...byStatusMap.entries()].map(([status, v]) => ({ status, ...v })),
    byPaymentMethod: [...byMethodMap.entries()].map(([method, v]) => ({ method, ...v })),
  };
});

/** Detecta ventas anómalas para la bandeja de alertas. */
export const getSalesAlerts = cache(async () => {
  const backend = getBackend();
  const orders = await backend.list<Order>("orders", {
    order: [{ column: "created_at", asc: false }],
    limit: 200,
  });
  const now = Date.now();
  const alerts: { tone: "warn" | "info"; message: string; href: string }[] = [];

  const pending = orders.filter((o) => o.payment_status === "pending" && o.status !== "cancelled");
  if (pending.length) {
    alerts.push({
      tone: "warn",
      message: `${pending.length} ${pending.length === 1 ? "pedido espera" : "pedidos esperan"} el pago`,
      href: "/admin/pedidos?pago=pending",
    });
  }
  const stuck = orders.filter(
    (o) => o.status === "paid" && now - new Date(o.updated_at).getTime() > 7 * DAY,
  );
  if (stuck.length) {
    alerts.push({
      tone: "warn",
      message: `${stuck.length} ${stuck.length === 1 ? "pedido pagado sin" : "pedidos pagados sin"} avance en 7 días`,
      href: "/admin/pedidos?estado=paid",
    });
  }
  return alerts;
});
