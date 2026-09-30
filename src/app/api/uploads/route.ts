import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth";
import { addProductImage } from "@/lib/data/admin-catalog";
import { storeImage } from "@/lib/storage";

export const runtime = "nodejs";

const IMAGE_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** Saca el archivo del multipart y lo valida (tipo y tamaño). */
async function readImage(form: FormData) {
  const raw = form.get("file");
  if (!(raw instanceof File) || raw.size === 0) {
    return { ok: false as const, error: "Elige una imagen de tu equipo." };
  }
  const ext = IMAGE_MIME[raw.type];
  if (!ext) {
    return { ok: false as const, error: "Formato no permitido: usa JPG, PNG, WebP, GIF o AVIF." };
  }
  if (raw.size > MAX_IMAGE_BYTES) {
    return { ok: false as const, error: "La imagen supera el máximo de 6 MB." };
  }
  return {
    ok: true as const,
    ext,
    mime: raw.type,
    buffer: Buffer.from(await raw.arrayBuffer()),
    name: raw.name,
  };
}

/**
 * Sube una imagen desde el panel y la registra como imagen del producto.
 *
 * Va al bucket `product-images` de Supabase Storage cuando está configurado, y
 * a `public/uploads/<carpeta>/` en local (ver `src/lib/storage.ts`).
 *
 * Es un route handler (no una server action) porque Next no serializa
 * archivos a través de server actions: con multipart y `request.formData()`
 * el File llega intacto. Requiere sesión de administrador.
 *
 * Hay dos modos sin producto: `target=coleccion` (portada de colección) y
 * `target=producto` (imagen de un producto que aún no existe). En los dos el
 * archivo se guarda y se devuelve solo la URL, sin fila: la crea el guardado
 * del producto o de la colección cuando ya existe.
 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return json({ error: "Sesión no válida. Vuelve a iniciar sesión." }, 401);
  }

  try {
    const form = await request.formData();
    const target = String(form.get("target") ?? "");

    if (target === "coleccion" || target === "producto") {
      const image = await readImage(form);
      if (!image.ok) return json({ error: image.error }, 400);
      const folder = target === "coleccion" ? "colecciones" : "pendientes";
      const url = await storeImage(folder, image.ext, image.buffer, image.mime);

      if (target === "coleccion") {
        revalidatePath("/admin/colecciones");
        return json({
          ok: true,
          url,
          alt: String(form.get("alt") ?? "") || image.name,
          message: "Imagen subida al almacenamiento. Guarda la colección para aplicarla.",
        });
      }

      // En cola: la URL viaja en el formulario y saveProductAction le crea la
      // fila al guardar, que es cuando el producto ya tiene id.
      return json({
        ok: true,
        url,
        alt: String(form.get("alt") ?? "") || image.name,
        message: "Imagen en cola. Se añade al producto al guardar.",
      });
    }

    const productId = String(form.get("product_id") ?? "").trim();
    if (!productId) return json({ error: "Falta el producto." }, 400);

    const image = await readImage(form);
    if (!image.ok) return json({ error: image.error }, 400);

    const url = await storeImage(productId, image.ext, image.buffer, image.mime);
    const saved = await addProductImage({
      product_id: productId,
      url,
      alt: String(form.get("alt") ?? "") || image.name,
      kind: String(form.get("kind") || "gallery") as "main" | "gallery" | "360",
    });

    revalidatePath("/admin/productos");
    revalidatePath(`/admin/productos/${productId}`);
    revalidatePath("/");
    revalidatePath("/catalogo");
    revalidatePath("/producto");
    return json({
      ok: true,
      url,
      image: saved,
      message: "Imagen subida y guardada en el almacenamiento.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo subir la imagen.";
    return json({ error: message }, 500);
  }
}
