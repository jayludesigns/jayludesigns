import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAdminSession } from "@/lib/auth";
import { addProductImage } from "@/lib/data/admin-catalog";

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

/**
 * Sube una imagen desde el panel al almacenamiento local
 * (`public/uploads/<producto>/`) y la registra como imagen del producto.
 *
 * Es un route handler (no una server action) porque Next no serializa
 * archivos a través de server actions: con multipart y `request.formData()`
 * el File llega intacto. Requiere sesión de administrador.
 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return json({ error: "Sesión no válida. Vuelve a iniciar sesión." }, 401);
  }

  try {
    const form = await request.formData();

    // Portada de colección: la imagen se guarda en el almacenamiento y la URL
    // la conserva el formulario que la está editando, así que aquí no hay
    // fila que crear. Va a una carpeta propia porque, al crear la colección,
    // su id todavía no existe.
    if (String(form.get("target") ?? "") === "coleccion") {
      const banner = form.get("file");
      if (!(banner instanceof File) || banner.size === 0) {
        return json({ error: "Elige una imagen de tu equipo." }, 400);
      }
      const bannerExt = IMAGE_MIME[banner.type];
      if (!bannerExt) {
        return json({ error: "Formato no permitido: usa JPG, PNG, WebP, GIF o AVIF." }, 400);
      }
      if (banner.size > MAX_IMAGE_BYTES) {
        return json({ error: "La imagen supera el máximo de 6 MB." }, 400);
      }
      const dir = path.join(process.cwd(), "public", "uploads", "colecciones");
      await mkdir(dir, { recursive: true });
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${bannerExt}`;
      await writeFile(path.join(dir, name), Buffer.from(await banner.arrayBuffer()));
      revalidatePath("/admin/colecciones");
      return json({
        ok: true,
        url: `/uploads/colecciones/${name}`,
        message: "Imagen subida al almacenamiento. Guarda la colección para aplicarla.",
      });
    }

    const productId = String(form.get("product_id") ?? "").trim();
    if (!productId) return json({ error: "Falta el producto." }, 400);

    const raw = form.get("file");
    if (!(raw instanceof File) || raw.size === 0) {
      return json({ error: "Elige una imagen de tu equipo." }, 400);
    }
    const ext = IMAGE_MIME[raw.type];
    if (!ext) {
      return json({ error: "Formato no permitido: usa JPG, PNG, WebP, GIF o AVIF." }, 400);
    }
    if (raw.size > MAX_IMAGE_BYTES) {
      return json({ error: "La imagen supera el máximo de 6 MB." }, 400);
    }

    const dir = path.join(process.cwd(), "public", "uploads", productId);
    await mkdir(dir, { recursive: true });
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await writeFile(path.join(dir, name), Buffer.from(await raw.arrayBuffer()));

    const url = `/uploads/${productId}/${name}`;
    const image = await addProductImage({
      product_id: productId,
      url,
      alt: String(form.get("alt") ?? "") || raw.name,
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
      image,
      message: "Imagen subida y guardada en el almacenamiento.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo subir la imagen.";
    return json({ error: message }, 500);
  }
}