import { cache } from "react";
import { getBackend, newId } from "@/lib/db";
import type {
  CrmActivity,
  Customer,
  CustomerWithStats,
  Lead,
  LeadStatus,
  Order,
  OrderItem,
  OrderWithItems,
  CustomDesign,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Clientes                                                            */
/* ------------------------------------------------------------------ */

export const getCustomers = cache(
  async (filters: { search?: string; tag?: string; limit?: number } = {}): Promise<CustomerWithStats[]> => {
    const backend = getBackend();
    const [customers, orders, designs] = await Promise.all([
      backend.list<Customer>("customers", { order: [{ column: "created_at", asc: false }] }),
      backend.list<Order>("orders"),
      backend.list<CustomDesign>("custom_designs"),
    ]);

    let rows = customers.map<CustomerWithStats>((customer) => {
      const own = orders.filter((o) => o.customer_id === customer.id && o.status !== "cancelled");
      const paid = own.filter((o) => o.payment_status === "paid");
      return {
        ...customer,
        orders_count: own.length,
        total_spent_ves: Math.round(paid.reduce((acc, o) => acc + o.total_ves, 0) * 100) / 100,
        last_order_at: own[0]?.created_at ?? null,
        designs_count: designs.filter((d) => d.customer_id === customer.id).length,
      };
    });

    if (filters.search) {
      const term = filters.search.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.full_name.toLowerCase().includes(term) ||
          (c.email ?? "").toLowerCase().includes(term) ||
          (c.phone ?? "").toLowerCase().includes(term) ||
          (c.document_id ?? "").toLowerCase().includes(term),
      );
    }
    if (filters.tag) rows = rows.filter((c) => c.tags.includes(filters.tag!));

    return rows.sort((a, b) => b.total_spent_ves - a.total_spent_ves);
  },
);

export const getCustomerById = cache(async (id: string) => {
  const backend = getBackend();
  const customer = await backend.one<Customer>("customers", {
    where: [{ column: "id", op: "eq", value: id }],
  });
  if (!customer) return null;
  const [orderRows, items, activities, designs] = await Promise.all([
    backend.list<Order>("orders", {
      where: [{ column: "customer_id", op: "eq", value: id }],
      order: [{ column: "created_at", asc: false }],
    }),
    backend.list<OrderItem>("order_items"),
    backend.list<CrmActivity>("crm_activities", {
      where: [{ column: "customer_id", op: "eq", value: id }],
      order: [{ column: "created_at", asc: false }],
    }),
    backend.list<CustomDesign>("custom_designs", {
      where: [{ column: "customer_id", op: "eq", value: id }],
      order: [{ column: "created_at", asc: false }],
    }),
  ]);
  // Las líneas se traen aquí para no pedirlas una por una en la ficha: así el
  // historial puede decir cuántas unidades tenía cada pedido.
  const orders: OrderWithItems[] = orderRows.map((order) => ({
    ...order,
    items: items.filter((item) => item.order_id === order.id),
  }));
  const paid = orders.filter((o) => o.payment_status === "paid" && o.status !== "cancelled");
  return {
    customer,
    orders,
    activities,
    designs,
    total_spent_ves: Math.round(paid.reduce((acc, o) => acc + o.total_ves, 0) * 100) / 100,
  };
});

export async function saveCustomer(input: Partial<Customer> & { full_name: string }) {
  const backend = getBackend();
  if (input.id) return backend.update<Customer>("customers", input.id, input);
  return backend.insert<Customer>("customers", input as Customer);
}

export async function removeCustomer(id: string) {
  const backend = getBackend();
  await backend.remove("customers", id);
}

/* ------------------------------------------------------------------ */
/* CRM                                                                 */
/* ------------------------------------------------------------------ */

export const getLeads = cache(async (status: LeadStatus | "todos" = "todos"): Promise<Lead[]> => {
  const backend = getBackend();
  return backend.list<Lead>("leads", {
    where: status === "todos" ? undefined : [{ column: "status", op: "eq", value: status }],
    order: [{ column: "created_at", asc: false }],
  });
});

export async function saveLead(input: Partial<Lead> & { name: string }) {
  const backend = getBackend();
  if (input.id) return backend.update<Lead>("leads", input.id, input);
  return backend.insert<Lead>("leads", input as Lead);
}

export async function setLeadStatus(id: string, status: LeadStatus) {
  const backend = getBackend();
  return backend.update<Lead>("leads", id, { status });
}

export const getPendingTasks = cache(async (): Promise<(CrmActivity & { customer_name: string })[]> => {
  const backend = getBackend();
  const [activities, customers] = await Promise.all([
    backend.list<CrmActivity>("crm_activities", {
      where: [{ column: "is_done", op: "eq", value: false }],
      order: [{ column: "due_at", asc: true }],
    }),
    backend.list<Customer>("customers"),
  ]);
  return activities.map((a) => ({
    ...a,
    customer_name: customers.find((c) => c.id === a.customer_id)?.full_name ?? "(sin cliente)",
  }));
});

export const getAllActivities = cache(async (): Promise<(CrmActivity & { customer_name: string })[]> => {
  const backend = getBackend();
  const [activities, customers] = await Promise.all([
    backend.list<CrmActivity>("crm_activities", { order: [{ column: "created_at", asc: false }], limit: 100 }),
    backend.list<Customer>("customers"),
  ]);
  return activities.map((a) => ({
    ...a,
    customer_name: customers.find((c) => c.id === a.customer_id)?.full_name ?? "(sin cliente)",
  }));
});

export async function saveActivity(input: Partial<CrmActivity> & { customer_id: string; kind: CrmActivity["kind"] }) {
  const backend = getBackend();
  if (input.id) return backend.update<CrmActivity>("crm_activities", input.id, input);
  return backend.insert<CrmActivity>("crm_activities", { id: newId(), ...input } as CrmActivity);
}

export async function toggleActivity(id: string, isDone: boolean) {
  const backend = getBackend();
  return backend.update<CrmActivity>("crm_activities", id, { is_done: isDone });
}

/** Resumen para el panel de CRM. */
export const getCrmSummary = cache(async () => {
  const backend = getBackend();
  const [leads, activities, customers] = await Promise.all([
    backend.list<Lead>("leads"),
    backend.list<CrmActivity>("crm_activities"),
    backend.list<Customer>("customers"),
  ]);
  const byStatus = leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.status] = (acc[lead.status] ?? 0) + 1;
    return acc;
  }, {});
  const now = Date.now();
  return {
    leadsNew: byStatus.new ?? 0,
    leadsTotal: leads.length,
    pendingTasks: activities.filter((a) => !a.is_done).length,
    overdueTasks: activities.filter((a) => !a.is_done && a.due_at && new Date(a.due_at).getTime() < now).length,
    customers: customers.length,
    withWhatsapp: customers.filter((c) => c.whatsapp).length,
  };
});
