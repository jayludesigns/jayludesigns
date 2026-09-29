"use server";

/**
 * Server actions del panel de administración.
 *
 * Reglas que se respetan en todas:
 *  · la primera línea útil es `requireAdmin()`: el proxy protege la navegación,
 *    pero las server actions llegan por POST a la ruta donde se declararon y
 *    pueden saltarse el proxy;
 *  · nada de lo que llega del formulario se usa tal cual: se revalida con zod y
 *    se dejan de lado los campos que no se hayan declarado;
 *  · se revisa lo que se toca en la tienda, porque el catálogo público depende
 *    de los mismos datos.
 */

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { rm } from "node:fs/promises";
import path from "node:path";

import { ADMIN_COOKIE, checkCredentials, requireAdmin, sessionCookieOptions } from "@/lib/auth";
import { saveStoreSettings, getBackend } from "@/lib/db";
import { refreshBcvRate } from "@/lib/bcv";
import type { ProductImage, RawMaterial } from "@/lib/types";
import type { AdminResult } from "@/components/admin/ActionForm";

import {
  addProductImage,
  removeCollection,
  removeCoupon,
  removeProduct,
  removeProductImage,
  removePromotion,
  removeVariant,
  saveCategory,
  saveCollection,
  saveCoupon,
  saveProduct,
  savePromotion,
  saveSpin360,
  saveVariant,
  setCoverImage,
  syncProductVariants,
  toggleCoupon,
  toggleProductActive,
  togglePromotion,
} from "@/lib/data/admin-catalog";
import { createOrder, updateOrder } from "@/lib/data/orders";
import { removeDesign, updateDesign } from "@/lib/data/designs";
import {
  adjustMaterialStock,
  adjustVariantStock,
  removeRawMaterial,
  saveRawMaterial,
} from "@/lib/data/inventory";
import {
  removeCustomer,
  saveActivity,
  saveCustomer,
  saveLead,
  setLeadStatus,
  toggleActivity,
} from "@/lib/data/customers";

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const ok = (message: string, extra: Partial<AdminResult> = {}): AdminResult => ({
  status: "ok",
  message,
  ...extra,
});

const fail = (message: string, errors?: Record<string, string>): AdminResult => ({
  status: "error",
  message,
  errors,
});

/** Envuelve el cuerpo de cada action: sesión + errores inesperados. */
async function guard(
  paths: string[],
  body: (formData: FormData) => Promise<AdminResult>,
  formData: FormData,
): Promise<AdminResult> {
  try {
    await requireAdmin();
    const result = await body(formData);
    for (const path of paths) revalidatePath(path);
    return result;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo completar la operación.";
    return fail(message);
  }
}

const text = (form: FormData, key: string): string => (form.get(key) ?? "").toString().trim();

const textOrNull = (form: FormData, key: string): string | null => text(form, key) || null;

const numberOr = (form: FormData, key: string, fallback = 0): number => {
  const raw = text(form, key).replace(/\./g, "").replace(",", ".");
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

const nullableNumber = (form: FormData, key: string): number | null => {
  const raw = text(form, key);
  if (!raw) return null;
  const value = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
};

const bool = (form: FormData, key: string): boolean => form.get(key) !== null;

const list = (form: FormData, key: string): string[] =>
  form
    .getAll(key)
    .map((value) => value.toString().trim())
    .filter(Boolean);

/**
 * Imágenes que el formulario subió antes de que el producto existiera.
 *
 * Viajan como una lista JSON en un solo campo: el archivo ya está en
 * `public/uploads/pendientes/` y lo que le falta es la fila, que se crea
 * aquí, cuando el producto ya tiene id.
 */
function parseQueuedImages(
  raw: string,
): { url: string; alt: string | null; kind: ProductImage["kind"] }[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const { url, alt, kind } = item as Record<string, unknown>;
    if (typeof url !== "string" || !url.trim()) return [];
    return [
      {
        url: url.trim(),
        alt: typeof alt === "string" && alt.trim() ? alt.trim() : null,
        kind: kind === "main" || kind === "360" ? kind : "gallery",
      },
    ];
  });
}

/** "Blanco #FFFFFF, Negro #000000" → [{ name, hex }] */
function parseColors(raw: string): { name: string; hex: string }[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [name, hex] = part.split("#").map((value) => value.trim());
      return {
        name: name || "Color",
        hex: hex ? `#${hex.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).padEnd(6, "0")}` : "#000000",
      };
    });
}

/** "10:120, 25:110" → [{ min_qty, unit_price_ves }] */
function parseBulk(raw: string): { min_qty: number; unit_price_ves: number }[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [qty, price] = part.split(":").map((value) => value.trim());
      return {
        min_qty: Number(qty) || 0,
        unit_price_ves: Number(price) || 0,
      };
    })
    .filter((row) => row.min_qty > 0 && row.unit_price_ves > 0)
    .sort((a, b) => a.min_qty - b.min_qty);
}

/** Filas del editor de imágenes 360 (una URL por línea). */
function parseFrames(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Sesión                                                              */
/* ------------------------------------------------------------------ */

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

const loginSchema = z.object({
  email: z.email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe la contraseña."),
});

export async function loginAction(
  _previous: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = loginSchema.safeParse({
    email: text(formData, "email"),
    password: text(formData, "password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }

  const result = checkCredentials(parsed.data.email, parsed.data.password);
  if (!result.ok || !result.token) {
    return { error: result.error ?? "No pudimos iniciar sesión." };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, result.token, sessionCookieOptions);

  const next = text(formData, "next");
  redirect(
    next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin",
  );
}

/* ------------------------------------------------------------------ */
/* Catálogo: productos                                                 */
/* ------------------------------------------------------------------ */

const productSchema = z.object({
  name: z.string().min(2, "El nombre necesita al menos 2 caracteres."),
  base_price_ves: z.number().positive("El precio debe ser mayor que cero."),
});

export async function saveProductAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(
    ["/admin/productos", "/catalogo", "/", "/colecciones"],
    async (form) => {
      const rawName = text(form, "name");
      const price = numberOr(form, "base_price_ves", 0);
      const parsed = productSchema.safeParse({ name: rawName, base_price_ves: price });
      if (!parsed.success) {
        const first = parsed.error.issues[0];
        return fail(first.message, { [first.path[0] ?? "name"]: first.message });
      }

      const id = textOrNull(form, "id");
      const queuedImages = parseQueuedImages(text(form, "image_urls"));
      const product = await saveProduct({
        id: id ?? undefined,
        name: rawName,
        slug: text(form, "slug") || undefined,
        sku: textOrNull(form, "sku"),
        subtitle: textOrNull(form, "subtitle"),
        description: textOrNull(form, "description"),
        category_id: textOrNull(form, "category_id"),
        base_price_ves: price,
        compare_at_ves: nullableNumber(form, "compare_at_ves"),
        cost_ves: numberOr(form, "cost_ves", 0),
        garment_type: textOrNull(form, "garment_type") ?? "franela",
        material: textOrNull(form, "material"),
        print_technique: textOrNull(form, "print_technique"),
        fit: textOrNull(form, "fit"),
        care_instructions: textOrNull(form, "care_instructions"),
        sizes: list(form, "sizes"),
        colors: parseColors(text(form, "colors")),
        is_active: bool(form, "is_active"),
        is_featured: bool(form, "is_featured"),
        is_custom_only: bool(form, "is_custom_only"),
        min_order_qty: Math.max(1, numberOr(form, "min_order_qty", 1)),
        bulk_prices: parseBulk(text(form, "bulk_prices")),
        lead_time_days: numberOr(form, "lead_time_days", 4),
        weight_grams: nullableNumber(form, "weight_grams"),
        tags: list(form, "tags"),
        seo_title: textOrNull(form, "seo_title"),
        seo_description: textOrNull(form, "seo_description"),
        collectionIds: list(form, "collectionIds"),
      });

      // Las imágenes que se subieron en cola solo esperaban a tener dueño: con
      // el producto ya guardado, cada una recibe su fila y su orden.
      for (const image of queuedImages) {
        await addProductImage({ product_id: product.id, ...image });
      }

      const conImagenes =
        queuedImages.length > 0
          ? ` con ${queuedImages.length} ${queuedImages.length === 1 ? "imagen nueva" : "imágenes nuevas"}`
          : "";
      return ok(`${id ? "Producto actualizado" : "Producto creado"}${conImagenes}.`, {
        href: id ? undefined : `/admin/productos/${product.id}`,
      });
    },
    formData,
  );
}

export async function toggleProductAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/productos", "/catalogo", "/"], async (form) => {
    const product = await toggleProductActive(text(form, "id"));
    return ok(product.is_active ? "Producto visible en la tienda." : "Producto oculto.");
  }, formData);
}

export async function deleteProductAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/productos", "/catalogo", "/"], async (form) => {
    await removeProduct(text(form, "id"));
    return ok("Producto eliminado.", { href: "/admin/productos" });
  }, formData);
}

export async function addImageAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/productos", "/catalogo", "/producto"], async (form) => {
    const url = text(form, "url");
    if (!url) return fail("Escribe la URL de la imagen.");
    const saved = await addProductImage({
      product_id: text(form, "product_id"),
      url,
      alt: textOrNull(form, "alt"),
      kind: (text(form, "kind") || "gallery") as "main" | "gallery" | "360",
    });
    return ok("Imagen añadida.", {
      href: `/admin/productos/${saved.product_id}`,
      image: saved,
    });
  }, formData);
}

export async function deleteImageAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/productos", "/", "/producto"], async (form) => {
    const imageId = text(form, "image_id");
    // Si la imagen vive en nuestro almacenamiento local (/uploads), el
    // archivo en disco se borra junto con la fila para no dejar huérfanos.
    try {
      const backend = getBackend();
      const [image] = await backend.list<ProductImage>("product_images", {
        where: [{ column: "id", op: "eq", value: imageId }],
      });
      await removeProductImage(imageId);
      if (image?.url?.startsWith("/uploads/")) {
        const filePath = path.join(process.cwd(), "public", image.url);
        await rm(filePath, { force: true });
        await rm(path.dirname(filePath), { force: true, recursive: true }).catch(() => {});
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo quitar la imagen.";
      return fail(message);
    }
    return ok("Imagen quitada.");
  }, formData);
}

/** Define una imagen como portada: pasa a ser la primera (orden 0). */
export async function setCoverImageAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/productos", "/", "/catalogo", "/producto"], async (form) => {
    try {
      await setCoverImage(text(form, "image_id"));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cambiar la portada.";
      return fail(message);
    }
    return ok("Portada actualizada: esta imagen es la que se muestra.", {
      reload: true,
    });
  }, formData);
}

export async function saveSpinAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/productos", "/producto"], async (form) => {
    const productId = text(form, "product_id");
    const frames = parseFrames(text(form, "frames"));
    if (frames.length < 2) {
      return fail("Hacen falta al menos 2 fotogramas: una URL por línea.");
    }
    await saveSpin360({
      product_id: productId,
      frames,
      poster_url: textOrNull(form, "poster_url"),
    });
    return ok(`Visor 360 guardado con ${frames.length} fotogramas.`, {
      href: `/admin/productos/${productId}`,
    });
  }, formData);
}

export async function clearSpinAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/productos", "/producto"], async (form) => {
    await getBackend().remove("product_spin360", text(form, "product_id"));
    return ok("Visor 360 desactivado.");
  }, formData);
}

/* ------------------------------------------------------------------ */
/* Catálogo: variantes                                                 */
/* ------------------------------------------------------------------ */

export async function saveVariantAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/productos", "/admin/inventario", "/catalogo"], async (form) => {
    const productId = text(form, "product_id");
    const variant = await saveVariant({
      id: textOrNull(form, "id") ?? undefined,
      product_id: productId,
      size: textOrNull(form, "size"),
      color: textOrNull(form, "color"),
      color_hex: textOrNull(form, "color_hex"),
      stock: numberOr(form, "stock", 0),
      min_stock: numberOr(form, "min_stock", 0),
      cost_ves: numberOr(form, "cost_ves", 0),
      price_delta_ves: numberOr(form, "price_delta_ves", 0),
      sku: textOrNull(form, "sku"),
      is_active: bool(form, "is_active"),
    });
    return ok("Variante guardada.", {
      href: `/admin/productos/${productId}#variante-${variant.id}`,
    });
  }, formData);
}

export async function deleteVariantAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/productos", "/admin/inventario", "/catalogo"], async (form) => {
    await removeVariant(text(form, "id"));
    return ok("Variante eliminada.");
  }, formData);
}

export async function syncVariantsAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/productos", "/catalogo"], async (form) => {
    const productId = text(form, "product_id");
    const { created } = await syncProductVariants(productId);
    return ok(
      created > 0
        ? `Se crearon ${created} variantes a partir de tallas y colores.`
        : "No había combinaciones nuevas que crear.",
      { href: `/admin/productos/${productId}` },
    );
  }, formData);
}

/* ------------------------------------------------------------------ */
/* Catálogo: colecciones, categorías, promociones, cupones            */
/* ------------------------------------------------------------------ */

export async function saveCollectionAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/colecciones", "/colecciones"], async (form) => {
    const name = text(form, "name");
    if (name.length < 2) return fail("La colección necesita un nombre.");
    const collection = await saveCollection({
      id: textOrNull(form, "id") ?? undefined,
      name,
      slug: text(form, "slug") || undefined,
      tagline: textOrNull(form, "tagline"),
      description: textOrNull(form, "description"),
      theme: (textOrNull(form, "theme") ?? "mono") as never,
      banner_url: textOrNull(form, "banner_url"),
      status: (textOrNull(form, "status") ?? "draft") as never,
      starts_at: textOrNull(form, "starts_at"),
      ends_at: textOrNull(form, "ends_at"),
      sort_order: numberOr(form, "sort_order", 0),
      seo_title: textOrNull(form, "seo_title"),
      seo_description: textOrNull(form, "seo_description"),
    });
    return ok("Colección guardada.", { href: `/admin/colecciones#${collection.id}` });
  }, formData);
}

export async function deleteCollectionAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/colecciones", "/colecciones"], async (form) => {
    await removeCollection(text(form, "id"));
    return ok("Colección eliminada.");
  }, formData);
}

export async function saveCategoryAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/colecciones", "/catalogo", "/"], async (form) => {
    const name = text(form, "name");
    if (name.length < 2) return fail("La categoría necesita un nombre.");
    await saveCategory({
      id: textOrNull(form, "id") ?? undefined,
      name,
      slug: text(form, "slug") || undefined,
      description: textOrNull(form, "description"),
      hero_url: textOrNull(form, "hero_url"),
      sort_order: numberOr(form, "sort_order", 0),
      is_active: bool(form, "is_active"),
    });
    return ok("Categoría guardada.");
  }, formData);
}

const promotionSchema = z.object({
  name: z.string().min(2, "Ponle un nombre a la promoción."),
  value: z.number().positive("El descuento debe ser mayor que cero."),
});

export async function savePromotionAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/promociones", "/catalogo", "/colecciones", "/producto"], async (form) => {
    const parsed = promotionSchema.safeParse({
      name: text(form, "name"),
      value: numberOr(form, "value", 0),
    });
    if (!parsed.success) {
      return fail(parsed.error.issues[0].message);
    }
    const id = textOrNull(form, "id");
    await savePromotion({
      id: id ?? undefined,
      name: parsed.data.name,
      scope: (textOrNull(form, "scope") ?? "product") as never,
      product_id: textOrNull(form, "product_id"),
      collection_id: textOrNull(form, "collection_id"),
      kind: (textOrNull(form, "kind") ?? "percent") as never,
      value: parsed.data.value,
      starts_at: textOrNull(form, "starts_at"),
      ends_at: textOrNull(form, "ends_at"),
      is_active: bool(form, "is_active"),
      priority: numberOr(form, "priority", 0),
    });
    return ok(id ? "Promoción actualizada." : "Promoción creada.");
  }, formData);
}

export async function togglePromotionAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/promociones", "/catalogo"], async (form) => {
    const promotion = await togglePromotion(text(form, "id"));
    return ok(promotion.is_active ? "Promoción activada." : "Promoción pausada.");
  }, formData);
}

export async function deletePromotionAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/promociones", "/catalogo"], async (form) => {
    await removePromotion(text(form, "id"));
    return ok("Promoción eliminada.");
  }, formData);
}

const couponSchema = z.object({
  code: z
    .string()
    .min(3, "El código necesita al menos 3 caracteres.")
    .transform((value) => value.toUpperCase()),
  value: z.number().positive("El descuento debe ser mayor que cero."),
});

export async function saveCouponAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/promociones", "/checkout"], async (form) => {
    const parsed = couponSchema.safeParse({
      code: text(form, "code"),
      value: numberOr(form, "value", 0),
    });
    if (!parsed.success) return fail(parsed.error.issues[0].message);
    const id = textOrNull(form, "id");
    await saveCoupon({
      id: id ?? undefined,
      code: parsed.data.code,
      kind: (textOrNull(form, "kind") ?? "percent") as never,
      value: parsed.data.value,
      min_subtotal_ves: nullableNumber(form, "min_subtotal_ves") ?? 0,
      max_uses: nullableNumber(form, "max_uses"),
      starts_at: textOrNull(form, "starts_at"),
      ends_at: textOrNull(form, "ends_at"),
      is_active: bool(form, "is_active"),
      description: textOrNull(form, "description"),
    });
    return ok(id ? "Cupón actualizado." : "Cupón creado.");
  }, formData);
}

export async function toggleCouponAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/promociones"], async (form) => {
    const coupon = await toggleCoupon(text(form, "id"));
    return ok(coupon.is_active ? "Cupón activo." : "Cupón desactivado.");
  }, formData);
}

export async function deleteCouponAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/promociones"], async (form) => {
    await removeCoupon(text(form, "id"));
    return ok("Cupón eliminado.");
  }, formData);
}

/* ------------------------------------------------------------------ */
/* Pedidos                                                             */
/* ------------------------------------------------------------------ */

const ORDER_STATUSES = [
  "draft",
  "pending_payment",
  "paid",
  "in_production",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export async function updateOrderAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/pedidos"], async (form) => {
    const id = text(form, "id");
    const status = text(form, "status") as (typeof ORDER_STATUSES)[number];
    const patch: Parameters<typeof updateOrder>[1] = {};

    if (ORDER_STATUSES.includes(status) && status) patch.status = status;

    const paymentStatus = text(form, "payment_status");
    if (["pending", "paid", "refunded", "failed"].includes(paymentStatus)) {
      patch.payment_status = paymentStatus as "pending" | "paid" | "refunded" | "failed";
    }

    const paymentMethod = text(form, "payment_method");
    if (paymentMethod) {
      patch.payment_method = paymentMethod as Parameters<typeof updateOrder>[1]["payment_method"];
    }

    if (form.has("payment_ref")) patch.payment_ref = textOrNull(form, "payment_ref");
    if (form.has("internal_notes")) patch.internal_notes = textOrNull(form, "internal_notes");

    if (Object.keys(patch).length === 0) return fail("No cambiaste nada.");

    await updateOrder(id, patch);
    return ok("Pedido actualizado.");
  }, formData);
}

const manualOrderSchema = z.object({
  customerName: z.string().min(2, "Escribe el nombre de quien recibe."),
  customerPhone: z.string().min(7, "Falta el teléfono de contacto."),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().nullable(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1, "Agrega al menos un producto."),
});

/**
 * Pedido tomado por teléfono o en el taller (uniformes, grupos, eventos).
 *
 * El cliente final no está delante de un navegador: el precio se recalcula
 * igual en el servidor, con las mismas promociones que en la tienda.
 */
export async function createManualOrderAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/pedidos", "/catalogo", "/"], async (form) => {
    let lines: unknown;
    try {
      lines = JSON.parse(text(form, "lines") || "[]");
    } catch {
      return fail("No pudimos leer la lista de productos.");
    }

    const parsed = manualOrderSchema.safeParse({
      customerName: text(form, "customerName"),
      customerPhone: text(form, "customerPhone"),
      lines,
    });
    if (!parsed.success) {
      return fail(parsed.error.issues[0].message);
    }

    const { order, warnings } = await createOrder({
      lines: parsed.data.lines,
      customerName: parsed.data.customerName,
      customerPhone: textOrNull(form, "customerPhone"),
      customerEmail: textOrNull(form, "customerEmail"),
      paymentMethod: (textOrNull(form, "paymentMethod") ?? "efectivo") as never,
      couponCode: textOrNull(form, "couponCode"),
      shippingAddress: {
        address: text(form, "address") || "Recogida en JayLu",
        city: text(form, "city") || "Maracay",
        state: text(form, "state") || "Distrito Capital",
        ...(text(form, "zip") ? { zip: text(form, "zip") } : {}),
        ...(text(form, "notes") ? { notes: text(form, "notes") } : {}),
      },
      notes: textOrNull(form, "notes"),
      markAsPaid: bool(form, "markAsPaid"),
    });

    if (warnings.length > 0) {
      return fail(`Pedido ${order.order_number} creado, con avisos: ${warnings.join(" ")}`);
    }

    return ok(`Pedido ${order.order_number} creado.`, {
      href: `/admin/pedidos/${order.id}`,
    });
  }, formData);
}

/* ------------------------------------------------------------------ */
/* Diseños a medida                                                    */
/* ------------------------------------------------------------------ */

export async function updateDesignAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/disenos"], async (form) => {
    const id = text(form, "id");
    const quoted = nullableNumber(form, "quoted_price_ves");

    await updateDesign(id, {
      status: (textOrNull(form, "status") ?? "new") as never,
      quoted_price_ves: quoted,
      admin_notes: textOrNull(form, "admin_notes"),
      name: textOrNull(form, "name"),
      deadline: textOrNull(form, "deadline"),
      quantity: numberOr(form, "quantity", 1),
    });

    return ok("Solicitud actualizada.", { href: `/admin/disenos/${id}` });
  }, formData);
}

export async function deleteDesignAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/disenos"], async (form) => {
    await removeDesign(text(form, "id"));
    return ok("Solicitud eliminada.", { href: "/admin/disenos" });
  }, formData);
}

/* ------------------------------------------------------------------ */
/* Inventario                                                          */
/* ------------------------------------------------------------------ */

export async function adjustStockAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/inventario", "/admin/productos", "/producto"], async (form) => {
    const delta = numberOr(form, "delta", 0);
    if (delta === 0) return fail("Escribe cuántas unidades entran o salen.");
    const reason = text(form, "reason") || "Ajuste manual";
    const { stock } = await adjustVariantStock({
      variantId: text(form, "variant_id"),
      delta,
      reason,
      note: textOrNull(form, "note"),
    });
    return ok(`Stock actualizado: ${stock} unidades.`);
  }, formData);
}

export async function saveMaterialAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/inventario/materia-prima"], async (form) => {
    const id = textOrNull(form, "id");
    // Al editar se puede mandar solo lo que cambia: si el nombre viene vacío
    // se conserva el que ya estaba, igual con el resto de campos en blanco.
    const current = id
      ? await getBackend().one<RawMaterial>("raw_materials", {
          where: [{ column: "id", op: "eq", value: id }],
        })
      : null;

    const name = text(form, "name") || current?.name || "";
    if (name.length < 2) return fail("El material necesita un nombre.");

    await saveRawMaterial({
      ...(id && current ? { id } : {}),
      name,
      sku: textOrNull(form, "sku"),
      description: textOrNull(form, "description"),
      category:
        (textOrNull(form, "category") ?? current?.category ?? "otro") as never,
      unit: (textOrNull(form, "unit") ?? current?.unit ?? "unidad") as never,
      stock: form.has("stock") ? numberOr(form, "stock", current?.stock ?? 0) : (current?.stock ?? 0),
      min_stock: form.has("min_stock")
        ? numberOr(form, "min_stock", current?.min_stock ?? 0)
        : (current?.min_stock ?? 0),
      cost_ves: form.has("cost_ves")
        ? numberOr(form, "cost_ves", current?.cost_ves ?? 0)
        : (current?.cost_ves ?? 0),
      supplier: form.has("supplier") ? textOrNull(form, "supplier") : (current?.supplier ?? null),
      location: form.has("location") ? textOrNull(form, "location") : (current?.location ?? null),
      notes: form.has("notes") ? textOrNull(form, "notes") : (current?.notes ?? null),
      is_active: form.has("is_active") ? true : (current?.is_active ?? true),
    });
    return ok("Material guardado.");
  }, formData);
}

export async function deleteMaterialAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/inventario/materia-prima"], async (form) => {
    await removeRawMaterial(text(form, "id"));
    return ok("Material eliminado.");
  }, formData);
}

export async function adjustMaterialAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/inventario/materia-prima"], async (form) => {
    const delta = numberOr(form, "delta", 0);
    if (delta === 0) return fail("Escribe cuánto entra o sale.");
    const { stock } = await adjustMaterialStock({
      materialId: text(form, "material_id"),
      delta,
      reason: text(form, "reason") || "Ajuste manual",
      note: textOrNull(form, "note"),
    });
    return ok(`Existencia actualizada: ${stock}.`);
  }, formData);
}

/* ------------------------------------------------------------------ */
/* Clientes y CRM                                                      */
/* ------------------------------------------------------------------ */

export async function saveCustomerAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/clientes"], async (form) => {
    const fullName = text(form, "full_name");
    if (fullName.length < 2) return fail("El cliente necesita un nombre.");
    const id = textOrNull(form, "id");
    await saveCustomer({
      id: id ?? undefined,
      full_name: fullName,
      email: textOrNull(form, "email"),
      phone: textOrNull(form, "phone"),
      whatsapp: textOrNull(form, "whatsapp"),
      document_id: textOrNull(form, "document_id"),
      city: textOrNull(form, "city"),
      state: textOrNull(form, "state"),
      address: textOrNull(form, "address"),
      notes: textOrNull(form, "notes"),
      tags: list(form, "tags"),
      marketing_opt_in: bool(form, "marketing_opt_in"),
    });
    return ok(id ? "Cliente actualizado." : "Cliente creado.", {
      href: id ? undefined : "/admin/clientes",
    });
  }, formData);
}

export async function deleteCustomerAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/clientes"], async (form) => {
    await removeCustomer(text(form, "id"));
    return ok("Cliente eliminado.");
  }, formData);
}

export async function saveLeadAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/crm"], async (form) => {
    const name = text(form, "name");
    if (name.length < 2) return fail("El contacto necesita un nombre.");
    await saveLead({
      id: textOrNull(form, "id") ?? undefined,
      name,
      source: textOrNull(form, "source") ?? "web",
      phone: textOrNull(form, "phone"),
      email: textOrNull(form, "email"),
      message: textOrNull(form, "message"),
      notes: textOrNull(form, "notes"),
      status: (textOrNull(form, "status") ?? "new") as never,
    });
    return ok("Contacto guardado.");
  }, formData);
}

export async function setLeadStatusAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/crm"], async (form) => {
    const lead = await setLeadStatus(
      text(form, "id"),
      text(form, "status") as "new" | "contacted" | "quoted" | "won" | "lost",
    );
    return ok(`Contacto en estado: ${lead.status}.`);
  }, formData);
}

export async function saveActivityAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/crm", "/admin/clientes"], async (form) => {
    const customerId = textOrNull(form, "customer_id");
    if (!customerId) return fail("Elige a qué cliente pertenece la nota.");
    await saveActivity({
      id: textOrNull(form, "id") ?? undefined,
      customer_id: customerId,
      kind: (textOrNull(form, "kind") ?? "note") as never,
      title: textOrNull(form, "title"),
      body: textOrNull(form, "body"),
      due_at: textOrNull(form, "due_at"),
    });
    return ok("Actividad guardada.");
  }, formData);
}

export async function toggleActivityAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/crm", "/admin/clientes"], async (form) => {
    // `is_done` llega como "1" o no llega: sirve igual para marcar como hecha
    // que para reabrir, sin depender del estado que tenía antes.
    const activity = await toggleActivity(text(form, "id"), text(form, "is_done") === "1");
    return ok(activity.is_done ? "Tarea completada." : "Tarea reabierta.");
  }, formData);
}

/* ------------------------------------------------------------------ */
/* Ajustes                                                             */
/* ------------------------------------------------------------------ */

export async function saveSettingsAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/ajustes", "/", "/contacto", "/checkout"], async (form) => {
    await saveStoreSettings({
      store_name: text(form, "store_name") || "JayLu",
      tagline: textOrNull(form, "tagline"),
      description: textOrNull(form, "description"),
      email: textOrNull(form, "email"),
      phone: textOrNull(form, "phone"),
      whatsapp: textOrNull(form, "whatsapp"),
      instagram: textOrNull(form, "instagram"),
      tiktok: textOrNull(form, "tiktok"),
      address: textOrNull(form, "address"),
      currency_symbol: text(form, "currency_symbol") || "Bs.",
      shipping_flat_ves: numberOr(form, "shipping_flat_ves", 0),
      free_shipping_over_ves: numberOr(form, "free_shipping_over_ves", 0),
      online_payments_enabled: bool(form, "online_payments_enabled"),
      bcv_eur_manual_rate: numberOr(form, "bcv_eur_manual_rate", 0),
      bank_name: textOrNull(form, "bank_name"),
      bank_account_type: textOrNull(form, "bank_account_type"),
      bank_account_number: textOrNull(form, "bank_account_number"),
      bank_account_name: textOrNull(form, "bank_account_name"),
      pago_movil_phone: textOrNull(form, "pago_movil_phone"),
      zelle_name: textOrNull(form, "zelle_name"),
      zelle_phone: textOrNull(form, "zelle_phone"),
      binance_email: textOrNull(form, "binance_email"),
      binance_pay_id: textOrNull(form, "binance_pay_id"),
    });
    return ok("Ajustes guardados.");
  }, formData);
}

export async function refreshRateAction(
  _previous: AdminResult,
  formData: FormData,
): Promise<AdminResult> {
  return guard(["/admin/ajustes", "/", "/catalogo"], async () => {
    const state = await refreshBcvRate();
    if (state.rate <= 0) {
      return fail(
        state.lastError
          ? `No se pudo consultar el BCV: ${state.lastError}`
          : "El BCV no devolvió una tasa válida.",
      );
    }
    return ok(`Tasa actualizada: 1 € = ${state.rate} Bs.`);
  }, formData);
}

/** Nota: los archivos "use server" solo pueden exportar funciones async. */
export type { AdminResult };
