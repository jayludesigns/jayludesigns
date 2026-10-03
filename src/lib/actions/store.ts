"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createOrder, type CheckoutLine } from "@/lib/data/orders";
import { createDesignRequest, createLead } from "@/lib/data/designs";
import { getStoreSettings } from "@/lib/db";
import { LIMITES, clientKey, consumirIntento, errorAlCliente, type Limite } from "@/lib/security";
import { isValidEmail, normalizePhone } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Estado que devuelven los formularios                                */
/* ------------------------------------------------------------------ */

export interface FormState {
  status: "idle" | "ok" | "error";
  message: string;
  /** Campos con error, para repintarlos en el formulario. */
  fields?: Record<string, string>;
  orderNumber?: string;
  token?: string;
  designCode?: string;
  warnings?: string[];
}

export const idleState: FormState = { status: "idle", message: "" };

/* ------------------------------------------------------------------ */
/* Pedidos                                                              */
/* ------------------------------------------------------------------ */

const linesSchema = z
  .array(
    z.object({
      productId: z.string().min(1),
      variantId: z.string().min(1).nullable(),
      quantity: z.number().int().min(1).max(500),
    }),
  )
  .min(1, "El carrito está vacío.");

const orderSchema = z.object({
  lines: linesSchema,
  customerName: z.string().trim().min(3, "Escribe tu nombre completo.").max(120),
  customerEmail: z
    .string()
    .trim()
    .transform((v) => v || "")
    .refine((v) => !v || isValidEmail(v), "Ese correo no parece válido."),
  customerPhone: z
    .string()
    .trim()
    .transform((v) => v || "")
    .refine((v) => v.replace(/\D/g, "").length >= 7, "Escribe un teléfono válido."),
  address: z.string().trim().min(6, "Escribe la dirección de entrega.").max(240),
  city: z.string().trim().min(2, "Escribe la ciudad.").max(80),
  state: z.string().trim().min(2, "Escribe el estado.").max(80),
  zip: z.string().trim().max(12).optional(),
  notes: z.string().trim().max(600).optional(),
  paymentMethod: z.enum([
    "pago_movil",
    "zelle",
    "transferencia",
    "binance",
    "efectivo",
    "otro",
  ]),
  paymentRef: z.string().trim().max(80).optional(),
  couponCode: z.string().trim().max(40).optional(),
});

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * Frena el envío automatizado. Devuelve el estado ya listo para devolver si la
 * ventana está cerrada, o null si se puede seguir.
 */
async function sinCupo(cubo: string, limite: Limite): Promise<FormState | null> {
  const clave = await clientKey();
  const restantes = await consumirIntento(`${cubo}:${clave}`, limite);
  if (restantes === 0) return null;
  const minutos = Math.max(1, Math.ceil(restantes / 60));
  return {
    status: "error",
    message: `Has enviado demasiados formularios. Vuelve a intentarlo en ${minutos} ${minutos === 1 ? "minuto" : "minutos"}.`,
  };
}

export async function submitOrder(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sinCupoPedido = await sinCupo("pedido", LIMITES.pedido);
  if (sinCupoPedido) return sinCupoPedido;

  let lines: CheckoutLine[] = [];
  try {
    const raw = formData.get("lines");
    lines = typeof raw === "string" ? (JSON.parse(raw) as CheckoutLine[]) : [];
  } catch {
    return { status: "error", message: "No pudimos leer tu carrito. Recarga la página." };
  }

  const parsed = orderSchema.safeParse({
    lines,
    customerName: formData.get("customerName") ?? "",
    customerEmail: formData.get("customerEmail") ?? "",
    customerPhone: formData.get("customerPhone") ?? "",
    address: formData.get("address") ?? "",
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
    zip: formData.get("zip") ?? "",
    notes: formData.get("notes") ?? "",
    paymentMethod: formData.get("paymentMethod") ?? "pago_movil",
    paymentRef: formData.get("paymentRef") ?? "",
    couponCode: formData.get("couponCode") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fields: fieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  try {
    const { order, warnings, token } = await createOrder({
      lines: data.lines,
      customerName: data.customerName,
      customerEmail: data.customerEmail || null,
      customerPhone: data.customerPhone ? normalizePhone(data.customerPhone) : null,
      paymentMethod: data.paymentMethod,
      couponCode: data.couponCode || null,
      shippingAddress: {
        address: data.address,
        city: data.city,
        state: data.state,
        ...(data.zip ? { zip: data.zip } : {}),
        ...(data.notes ? { notes: data.notes } : {}),
      },
      notes: data.notes || null,
    });

    if (data.paymentRef) {
      // La referencia la anota el propio cliente para adelantar la conciliación.
      const { getBackend } = await import("@/lib/db");
      await getBackend().update("orders", order.id, { payment_ref: data.paymentRef });
    }

    revalidatePath("/admin/pedidos");
    return {
      status: "ok",
      message: "Pedido registrado.",
      orderNumber: order.order_number,
      token,
      warnings,
    };
  } catch (error) {
    return {
      status: "error",
      message: errorAlCliente(
        error,
        "pedido",
        "No pudimos registrar tu pedido. Escríbenos por WhatsApp y lo hacemos al momento.",
      ),
    };
  }
}

/* ------------------------------------------------------------------ */
/* Diseño a medida                                                      */
/* ------------------------------------------------------------------ */

const designSchema = z.object({
  contactName: z.string().trim().min(3, "Dinos cómo te llamas.").max(120),
  contactEmail: z
    .string()
    .trim()
    .transform((v) => v || "")
    .refine((v) => !v || isValidEmail(v), "Ese correo no parece válido."),
  contactPhone: z.string().trim().max(40).optional(),
  name: z.string().trim().max(120).optional(),
  description: z.string().trim().max(4000).optional(),
  quantity: z.coerce.number().int().min(1).max(10000).default(1),
  garmentType: z.string().trim().max(60).optional(),
  stylePreference: z.string().trim().max(120).optional(),
  deadline: z.string().trim().max(40).optional(),
  sizes: z.array(z.string()).max(30).default([]),
  colors: z.array(z.string()).max(30).default([]),
});

/** Límite del archivo incrustado en la base local. */
const MAX_IMAGE_BYTES = 2_500_000;

export async function submitDesignRequest(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sinCupoDiseno = await sinCupo("diseno", LIMITES.diseno);
  if (sinCupoDiseno) return sinCupoDiseno;

  const referenceImages: string[] = [];
  const rawRefs = formData.get("referenceImages");
  if (typeof rawRefs === "string" && rawRefs.trim()) {
    try {
      const parsedRefs = JSON.parse(rawRefs) as string[];
      for (const dataUrl of parsedRefs) {
        if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) continue;
        if (dataUrl.length > MAX_IMAGE_BYTES) {
          return {
            status: "error",
            message: "Alguna foto pesa demasiado. Súbela menor a 2,5 MB.",
          };
        }
        referenceImages.push(dataUrl);
      }
    } catch {
      return { status: "error", message: "No pudimos procesar las fotos. Intenta de nuevo." };
    }
  }

  const parsed = designSchema.safeParse({
    contactName: formData.get("contactName") ?? "",
    contactEmail: formData.get("contactEmail") ?? "",
    contactPhone: formData.get("contactPhone") ?? "",
    name: formData.get("name") ?? "",
    description: formData.get("description") ?? "",
    quantity: formData.get("quantity") ?? 1,
    garmentType: formData.get("garmentType") ?? "",
    stylePreference: formData.get("stylePreference") ?? "",
    deadline: formData.get("deadline") ?? "",
    sizes: readList(formData, "sizes"),
    colors: readList(formData, "colors"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fields: fieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  if (referenceImages.length === 0 && !data.description?.trim()) {
    return {
      status: "error",
      message: "Sube al menos una foto de referencia o escribe qué quieres estampar.",
      fields: { description: "Sube una foto o describe tu idea." },
    };
  }

  try {
    const design = await createDesignRequest({
      contactName: data.contactName,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      name: data.name,
      description: data.description,
      referenceImages,
      sizes: data.sizes,
      colors: data.colors,
      quantity: data.quantity,
      garmentType: data.garmentType,
      stylePreference: data.stylePreference,
      deadline: data.deadline || null,
    });
    revalidatePath("/admin/disenos");
    return {
      status: "ok",
      message: "Recibimos tu idea.",
      designCode: design.code,
    };
  } catch (error) {
    return {
      status: "error",
      message: errorAlCliente(
        error,
        "diseno",
        "No pudimos registrar tu idea. Intenta otra vez en un momento.",
      ),
    };
  }
}

function readList(formData: FormData, key: string): string[] {
  const value = formData.getAll(key).map(String).filter(Boolean);
  if (value.length) return value;
  const single = formData.get(key);
  if (typeof single !== "string" || !single.trim()) return [];
  return single
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Contacto                                                             */
/* ------------------------------------------------------------------ */

const contactSchema = z.object({
  name: z.string().trim().min(3, "Dinos tu nombre.").max(120),
  email: z
    .string()
    .trim()
    .transform((v) => v || "")
    .refine((v) => !v || isValidEmail(v), "Ese correo no parece válido."),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(10, "Cuéntanos un poco más.").max(3000),
  source: z.string().trim().max(80).optional(),
});

export async function submitContact(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const sinCupoContacto = await sinCupo("contacto", LIMITES.contacto);
  if (sinCupoContacto) return sinCupoContacto;

  const parsed = contactSchema.safeParse({
    name: formData.get("name") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    message: formData.get("message") ?? "",
    source: formData.get("source") ?? "formulario web",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fields: fieldErrors(parsed.error),
    };
  }

  try {
    await createLead(parsed.data);
    revalidatePath("/admin/crm");
    return {
      status: "ok",
      message: "Mensaje recibido. Te respondemos por WhatsApp o correo en menos de 24 h.",
    };
  } catch (error) {
    return {
      status: "error",
      message: errorAlCliente(
        error,
        "contacto",
        "No pudimos enviar tu mensaje. Intenta otra vez en un momento.",
      ),
    };
  }
}

/* ------------------------------------------------------------------ */
/* Utilidades de página                                                 */
/* ------------------------------------------------------------------ */

/** Datos de la tienda para el resumen del checkout. */
export async function checkoutSummary() {
  const settings = await getStoreSettings();
  return {
    shippingFlat: settings.shipping_flat_ves,
    freeOver: settings.free_shipping_over_ves,
    rate: settings.bcv_rate,
    whatsapp: settings.whatsapp,
    storeName: settings.store_name,
  };
}

export async function goTo(path: string): Promise<never> {
  redirect(path);
}
