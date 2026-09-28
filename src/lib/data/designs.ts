import { cache } from "react";
import { getBackend, newId } from "@/lib/db";
import type { CustomDesign, DesignStatus, Lead } from "@/lib/types";
import { nextDesignCode } from "@/lib/data/orders";

/* ------------------------------------------------------------------ */
/* Solicitudes de diseño a medida                                      */
/* ------------------------------------------------------------------ */

export interface DesignRequest {
  /** Nombre de la prenda o del proyecto. */
  name?: string | null;
  /** Descripción del diseño: opcional si se sube foto. */
  description?: string | null;
  /** Referencias subidas por el cliente (data URL o URL ya almacenada). */
  referenceImages?: string[];
  sizes?: string[];
  colors?: string[];
  quantity?: number;
  garmentType?: string | null;
  stylePreference?: string | null;
  deadline?: string | null;
  contactName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

/**
 * Registra una solicitud de diseño a medida.
 *
 * Se exige al menos una foto de referencia **o** una descripción: con los dos
 * opcionales, el formulario sigue siendo válido si el cliente envía cualquiera
 * de los dos, pero no si envía la solicitud vacía.
 */
export async function createDesignRequest(input: DesignRequest) {
  const backend = getBackend();
  const references = (input.referenceImages ?? []).filter(Boolean).slice(0, 6);
  const description = input.description?.trim() || null;

  if (references.length === 0 && !description) {
    throw new Error("Sube al menos una foto de referencia o escribe qué quieres estampar.");
  }

  const nowIso = new Date().toISOString();
  const design: CustomDesign = {
    id: newId(),
    code: await nextDesignCode(),
    customer_id: null,
    order_id: null,
    name: input.name?.trim() || (description ? description.slice(0, 60) : "Diseño sin título"),
    description,
    reference_urls: references,
    sizes: input.sizes ?? [],
    colors: input.colors ?? [],
    quantity: Math.max(1, input.quantity ?? 1),
    garment_type: input.garmentType ?? null,
    style_preference: input.stylePreference ?? null,
    deadline: input.deadline ?? null,
    status: "new",
    quoted_price_ves: null,
    admin_notes: null,
    contact_name: input.contactName.trim(),
    contact_email: input.contactEmail?.trim() || null,
    contact_phone: input.contactPhone?.trim() || null,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const created = await backend.insert<CustomDesign>("custom_designs", design);
  await backend.insert("activity_log", {
    user_id: null,
    user_email: input.contactEmail ?? null,
    action: "create",
    entity: "custom_design",
    entity_id: created.id,
    summary: `Solicitud ${created.code} · ${created.quantity} unidad(es) · ${created.name}`,
    meta: { references: references.length },
  });
  return created;
}

export const getDesigns = cache(
  async (filters: { status?: DesignStatus | "todos"; search?: string } = {}): Promise<CustomDesign[]> => {
    const backend = getBackend();
    const where =
      filters.status && filters.status !== "todos"
        ? [{ column: "status" as const, op: "eq" as const, value: filters.status }]
        : undefined;
    let rows = await backend.list<CustomDesign>("custom_designs", {
      where,
      order: [{ column: "created_at", asc: false }],
    });
    if (filters.search) {
      const term = filters.search.toLowerCase();
      rows = rows.filter(
        (d) =>
          (d.name ?? "").toLowerCase().includes(term) ||
          (d.code ?? "").toLowerCase().includes(term) ||
          (d.contact_name ?? "").toLowerCase().includes(term) ||
          (d.contact_email ?? "").toLowerCase().includes(term),
      );
    }
    return rows;
  },
);

export const getDesignById = cache(async (id: string) => {
  const backend = getBackend();
  return backend.one<CustomDesign>("custom_designs", {
    where: [{ column: "id", op: "eq", value: id }],
  });
});

export async function updateDesign(
  id: string,
  patch: Partial<
    Pick<
      CustomDesign,
      | "name"
      | "description"
      | "status"
      | "quoted_price_ves"
      | "admin_notes"
      | "quantity"
      | "deadline"
      | "garment_type"
      | "style_preference"
    >
  >,
) {
  const backend = getBackend();
  const updated = await backend.update<CustomDesign>("custom_designs", id, {
    ...patch,
    updated_at: new Date().toISOString(),
  });
  await backend.insert("activity_log", {
    user_id: null,
    user_email: null,
    action: "update",
    entity: "custom_design",
    entity_id: id,
    summary: `Solicitud ${updated.code}: ${patch.status ? `estado → ${patch.status}` : Object.keys(patch).join(", ")}`,
    meta: null,
  });
  return updated;
}

export async function removeDesign(id: string) {
  const backend = getBackend();
  await backend.remove("custom_designs", id);
}

export interface DesignSummary {
  total: number;
  new: number;
  quoting: number;
  inProduction: number;
  pipelineValue: number;
}

export const getDesignSummary = cache(async (): Promise<DesignSummary> => {
  const backend = getBackend();
  const rows = await backend.list<CustomDesign>("custom_designs");
  return {
    total: rows.length,
    new: rows.filter((d) => d.status === "new").length,
    quoting: rows.filter((d) => d.status === "quoting").length,
    inProduction: rows.filter((d) => ["in_design", "production"].includes(d.status)).length,
    pipelineValue: Math.round(rows.reduce((acc, d) => acc + (d.quoted_price_ves ?? 0), 0) * 100) / 100,
  };
});

/* ------------------------------------------------------------------ */
/* Leads del formulario de contacto                                     */
/* ------------------------------------------------------------------ */

export async function createLead(input: {
  name: string;
  email?: string | null;
  phone?: string | null;
  message: string;
  source?: string | null;
}) {
  const backend = getBackend();
  const lead: Lead = {
    id: newId(),
    name: input.name.trim(),
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    message: input.message.trim(),
    source: input.source ?? "formulario web",
    status: "new",
    notes: null,
    created_at: new Date().toISOString(),
  };
  return backend.insert<Lead>("leads", lead);
}
