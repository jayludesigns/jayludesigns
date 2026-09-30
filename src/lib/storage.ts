/**
 * Almacenamiento de imágenes, con dos backends y el mismo criterio que la base
 * de datos (`src/lib/db/index.ts`):
 *
 * - Con Supabase configurado → bucket `product-images` de Supabase Storage.
 *   Necesario en producción: Vercel sirve desde un disco de solo lectura, así
 *   que escribir en `public/uploads/` falla con ENOENT.
 * - Sin Supabase → `public/uploads/` en el disco, que es lo que se usa en
 *   desarrollo y para probar el panel sin conexión.
 *
 * El bucket `product-images` es público para *leer* (las fotos del catálogo se
 * ven en la tienda), pero las subidas pasan por este módulo con la clave de
 * servidor, así que nadie más puede escribir en él. No hace falta abrir
 * permisos de escritura al público.
 */

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { isSupabaseConfigured } from "@/lib/db";
import { supabaseService } from "@/lib/db/supabase";

/** Bucket público del catálogo, definido en `supabase/schema.sql`. */
const BUCKET = "product-images";

/** Prefijo local, para reconocer y borrar lo que quedó en el disco. */
const LOCAL_PREFIX = "/uploads/";

/** Marca que delata una URL pública de Supabase Storage. */
const REMOTE_MARK = `/storage/v1/object/public/${BUCKET}/`;

/**
 * Carpeta y nombre dentro del bucket. Se conserva la misma estructura que usaba
 * el disco (`<carpeta>/<archivo>`) para que las filas ya guardadas en
 * `product_images.url` no dejen de tener sentido.
 */
function objectPath(folder: string, ext: string): string {
  return `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

/** URL pública de un objeto del bucket. */
function publicUrl(object: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL.");
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET}/${object}`;
}

/**
 * Guarda la imagen y devuelve la URL con la que registrarla.
 *
 * @param folder  `pendientes`, `colecciones` o el id del producto.
 * @param ext     extensión sin punto (`jpg`, `png`…).
 * @param contentType tipo MIME, para que Supabase lo sirva bien.
 */
export async function storeImage(
  folder: string,
  ext: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const object = objectPath(folder, ext);

  if (isSupabaseConfigured()) {
    const { error } = await supabaseService()
      .storage.from(BUCKET)
      .upload(object, buffer, { contentType, upsert: false });
    if (error) {
      throw new Error(
        `No se pudo subir la imagen a Supabase Storage: ${error.message}. ` +
          `Comprueba que el bucket "${BUCKET}" exista (supabase/schema.sql).`,
      );
    }
    return publicUrl(object);
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, path.basename(object)), buffer);
  return `${LOCAL_PREFIX}${object}`;
}

/**
 * Borra la imagen que apunta a `url`, venga de donde venga.
 *
 * Tolera que el archivo ya no exista: quitar una imagen del producto es una
 * operación de limpieza y no debería fallar por un huérfano.
 */
export async function deleteImage(url: string): Promise<void> {
  if (url.startsWith(LOCAL_PREFIX)) {
    const file = path.join(process.cwd(), "public", url);
    await rm(file, { force: true });
    await rm(path.dirname(file), { force: true, recursive: true }).catch(() => {});
    return;
  }

  const at = url.indexOf(REMOTE_MARK);
  if (at === -1) return; // URL externa (demo, Unsplash…): no es nuestra.

  if (!isSupabaseConfigured()) {
    // La foto está en Supabase pero el backend local está activo: no hay con
    // qué borrarla, y no es motivo para impedir quitar la fila de la imagen.
    console.warn(`[storage] sin Supabase configurado, no se borró ${url}`);
    return;
  }

  const object = url.slice(at + REMOTE_MARK.length).split("?")[0];
  const { error } = await supabaseService().storage.from(BUCKET).remove([object]);
  if (error) console.warn(`[storage] no se pudo borrar ${object}: ${error.message}`);
}
