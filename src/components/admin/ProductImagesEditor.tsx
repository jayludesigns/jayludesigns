"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Link2,
  Loader2,
  Star,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { adminIdle, type AdminResult } from "@/components/admin/ActionForm";
import { deleteImageAction, setCoverImageAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/types";

/** Imagen subida al almacenamiento que todavía no tiene fila: la crea el
 *  guardado del producto, que es cuando ya existe el id. */
type EnCola = { key: string; url: string; alt: string; kind: "main" | "gallery" };

/**
 * Imágenes del producto, dentro del formulario único.
 *
 * Ninguna operación abre un `<form>` propio (el producto es un solo
 * formulario y los formularios anidados no son HTML válido), así que añadir
 * imágenes desde el equipo o por URL se resuelve con estado: el archivo se
 * sube al almacenamiento al elegirlo y su URL queda en un campo oculto que
 * `saveProductAction` convierte en filas al guardar. Por eso el mismo
 * componente sirve para un producto que aún no tiene id.
 *
 * Sobre las imágenes ya guardadas sí se actúa al momento: hacer portada o
 * quitar una fila no toca los datos del producto, así que no espera al
 * guardado.
 */
export function ProductImagesEditor({
  productId,
  initialImages,
  storeHref,
}: {
  /** Vacío en un producto nuevo: todo lo que se suba queda en cola. */
  productId?: string | null;
  initialImages: ProductImage[];
  storeHref?: string;
}) {
  const router = useRouter();
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [cola, setCola] = useState<EnCola[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [kind, setKind] = useState<"main" | "gallery">(
    initialImages.length === 0 ? "main" : "gallery",
  );
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [notice, setNotice] = useState<{ status: "ok" | "error"; message: string } | null>(
    null,
  );
  const archivoInput = useRef<HTMLInputElement>(null);
  const contador = useRef(0);

  async function runAction(
    action: (previous: AdminResult, formData: FormData) => Promise<AdminResult>,
    formData: FormData,
    onOk: () => void,
  ) {
    setNotice(null);
    try {
      const result = await action(adminIdle, formData);
      if (result.status === "ok") {
        onOk();
        router.refresh();
        setNotice({ status: "ok", message: result.message });
      } else {
        setNotice({ status: "error", message: result.message });
      }
    } catch (error) {
      setNotice({
        status: "error",
        message: error instanceof Error ? error.message : "No se pudo completar la operación.",
      });
    }
  }

  function requestForm(fields: Record<string, string>): FormData {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.set(key, value);
    return form;
  }

  function handleCover(imageId: string) {
    setBusyId(imageId);
    void runAction(
      setCoverImageAction,
      requestForm({ image_id: imageId }),
      () => {
        setImages((prev) => {
          const chosen = prev.find((img) => img.id === imageId);
          if (!chosen) return prev;
          const next: ProductImage[] = [
            ...prev
              .filter((img) => img.id !== imageId)
              .map(
                (img): ProductImage => ({
                  ...img,
                  sort_order: img.sort_order + 1,
                  kind: img.kind === "main" ? "gallery" : img.kind,
                }),
              ),
            { ...chosen, sort_order: 0, kind: "main" } as ProductImage,
          ].sort((a, b) => a.sort_order - b.sort_order);
          return next;
        });
      },
    ).finally(() => setBusyId(null));
  }

  function handleDelete(imageId: string) {
    setBusyId(imageId);
    void runAction(deleteImageAction, requestForm({ image_id: imageId }), () => {
      setImages((prev) => {
        const removed = prev.find((img) => img.id === imageId);
        const rest = prev
          .filter((img) => img.id !== imageId)
          .sort((a, b) => a.sort_order - b.sort_order);
        // El servidor renumera tras borrar (0..n−1) y, si se quitó la portada,
        // la primera imagen restante pasa a ser la portada nueva.
        if (removed?.kind === "main" && rest.length > 0) {
          return rest.map((img, index) => ({
            ...img,
            sort_order: index,
            kind: index === 0 ? "main" : img.kind,
          }));
        }
        return rest.map((img, index) => ({ ...img, sort_order: index }));
      });
    }).finally(() => setBusyId(null));
  }

  async function subirArchivos(files: FileList | null) {
    if (!files || files.length === 0) return;
    setSubiendo(true);
    setNotice(null);
    const nuevas: EnCola[] = [];
    for (const file of Array.from(files)) {
      try {
        const body = new FormData();
        body.set("target", "producto");
        body.set("file", file);
        const response = await fetch("/api/uploads", { method: "POST", body });
        const data = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          url?: string;
          alt?: string;
        };
        if (!response.ok || !data.ok || !data.url) {
          throw new Error(data.error ?? "No se pudo subir la imagen.");
        }
        nuevas.push({
          key: `c${contador.current++}`,
          url: data.url,
          alt: data.alt || file.name,
          kind,
        });
      } catch (error) {
        setNotice({
          status: "error",
          message:
            error instanceof Error ? error.message : "No se pudo subir la imagen.",
        });
      }
    }
    if (nuevas.length > 0) {
      setCola((prev) => [...prev, ...nuevas]);
      setNotice({
        status: "ok",
        message: `${nuevas.length} ${nuevas.length === 1 ? "imagen en cola" : "imágenes en cola"}. Se añaden al producto al guardar.`,
      });
    }
    setSubiendo(false);
    if (archivoInput.current) archivoInput.current.value = "";
  }

  function añadirUrl() {
    const limpia = url.trim();
    if (!limpia) return;
    setCola((prev) => [
      ...prev,
      { key: `c${contador.current++}`, url: limpia, alt: alt.trim(), kind },
    ]);
    setUrl("");
    setAlt("");
    setNotice({
      status: "ok",
      message: "Imagen en cola. Se añade al producto al guardar.",
    });
  }

  return (
    <div>
      {notice && (
        <p
          role={notice.status === "error" ? "alert" : "status"}
          className={cn(
            "mb-4 flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold",
            notice.status === "error"
              ? "border border-ember-600 bg-ember-50 text-ember-900"
              : "border border-ink-200 bg-ink-50",
          )}
        >
          {notice.status === "error" ? (
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-ember-600" />
          ) : (
            <Check className="mt-0.5 size-4 shrink-0 text-ember-600" />
          )}
          <span>
            {notice.message}
            {notice.status === "ok" && storeHref && (
              <Link
                href={storeHref}
                className="ml-1.5 font-bold text-ember-700 underline decoration-ember-300 underline-offset-2"
              >
                Ver en la tienda →
              </Link>
            )}
          </span>
        </p>
      )}

      {/* Lo que lee saveProductAction para crear las filas de las imágenes en
          cola: si no se guardó el producto, este campo no viaja. */}
      <input
        type="hidden"
        name="image_urls"
        value={JSON.stringify(cola.map(({ url: u, alt: a, kind: k }) => ({ url: u, alt: a, kind: k })))}
      />

      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {images.map((image) => (
          <figure key={image.id} className="card overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.alt ?? ""}
              className="aspect-square w-full object-cover"
            />
            <figcaption className="flex items-center gap-1.5 border-t border-ink-200 px-1.5 py-1">
              {image.kind === "main" ? (
                <span
                  title="Portada actual"
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-ember-600 text-paper"
                >
                  <Star className="size-3 fill-current" />
                </span>
              ) : (
                <button
                  type="button"
                  title="Usar como portada"
                  aria-label={`Usar como portada: ${image.alt ?? "imagen"}`}
                  disabled={busyId === image.id}
                  onClick={() => handleCover(image.id)}
                  className="grid size-6 shrink-0 place-items-center rounded-full border border-ink-200 text-ink-400 transition-colors hover:border-ember-600 hover:bg-ember-600 hover:text-paper disabled:opacity-40"
                >
                  <Star className="size-3" />
                </button>
              )}
              <span className="min-w-0 flex-1 truncate font-mono text-[0.57rem] text-ink-500">
                {image.kind} · {image.sort_order}
              </span>
              <button
                type="button"
                title="Quitar imagen"
                aria-label="Quitar imagen"
                disabled={busyId === image.id}
                onClick={() => handleDelete(image.id)}
                className="grid size-6 shrink-0 place-items-center rounded-full border border-ink-200 text-ink-500 transition-colors hover:border-ember-600 hover:bg-ember-600 hover:text-paper disabled:opacity-40"
              >
                {busyId === image.id ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Trash2 className="size-3" />
                )}
              </button>
            </figcaption>
          </figure>
        ))}

        {cola.map((item) => (
          <figure key={item.key} className="card overflow-hidden border-ember-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.alt} className="aspect-square w-full object-cover" />
            <figcaption className="flex items-center gap-1.5 border-t border-ink-200 bg-ember-50 px-1.5 py-1">
              <span
                title="Se añade al guardar"
                className="grid size-6 shrink-0 place-items-center rounded-full bg-ember-600 text-paper"
              >
                <Star className="size-3 fill-current" />
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-[0.57rem] font-bold text-ember-700">
                {item.kind} · sin guardar
              </span>
              <button
                type="button"
                title="Quitar de la cola"
                aria-label="Quitar imagen de la cola"
                onClick={() => setCola((prev) => prev.filter((i) => i.key !== item.key))}
                className="grid size-6 shrink-0 place-items-center rounded-full border border-ink-200 text-ink-500 transition-colors hover:border-ember-600 hover:bg-ember-600 hover:text-paper"
              >
                <X className="size-3" />
              </button>
            </figcaption>
          </figure>
        ))}

        <button
          type="button"
          onClick={() => archivoInput.current?.click()}
          disabled={subiendo}
          className="grid aspect-square place-items-center gap-1 rounded-xl border-2 border-dashed border-ink-300 p-3 text-center text-xs font-semibold text-ink-600 transition-colors hover:border-ember-500 hover:text-ember-700 disabled:opacity-50"
        >
          {subiendo ? (
            <>
              <Loader2 className="size-6 animate-spin" />
              Subiendo…
            </>
          ) : (
            <>
              <Upload className="size-6" />
              Añadir imágenes
            </>
          )}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-ink-200 pt-4">
        <label className="grid min-w-0 flex-1 gap-1 sm:basis-64">
          <span className="label">URL de la imagen</span>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://…/camiseta.jpg o /demo/products/…"
            className="field"
          />
        </label>
        <label className="grid min-w-0 flex-1 gap-1 sm:basis-48">
          <span className="label">Texto alternativo</span>
          <input
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            placeholder="Franela blanca"
            className="field"
          />
        </label>
        <label className="grid gap-1">
          <span className="label">Al añadir</span>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as "main" | "gallery")}
            className="field sm:w-32"
          >
            <option value="gallery">Galería</option>
            <option value="main">Portada</option>
          </select>
        </label>
        <button type="button" onClick={añadirUrl} className="btn btn-sm">
          <Link2 className="size-3.5" />
          Añadir por URL
        </button>

        <input
          ref={archivoInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          className="sr-only"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            void subirArchivos(event.target.files);
          }}
        />
      </div>

      <p className="mt-2 text-xs text-ink-500">
        {productId
          ? "La primera es la portada. Lo que subas aquí se añade al producto al pulsar «Guardar publicación»."
          : "Puedes subir la imagen antes de guardar: el archivo queda en el almacenamiento y entra con el producto en el mismo guardado."}
      </p>
    </div>
  );
}
