"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Check, Loader2, Star, Trash2, TriangleAlert, Upload } from "lucide-react";
import { adminIdle, type AdminResult } from "@/components/admin/ActionForm";
import { addImageAction, deleteImageAction, setCoverImageAction } from "@/app/admin/actions";
import { ImageUploadForm } from "@/components/admin/ImageUploadForm";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/types";

/**
 * Galería de imágenes de producto con estado propio en el cliente.
 *
 * Cada operación (subir desde el equipo, pegar URL, hacer portada, quitar)
 * actualiza la lista al instante y confirma en el servidor con la misma
 * server action; además refresca los datos del servidor para que el resto de
 * la página (portadas, listados, tienda) quede consistente.
 */
export function ProductImagesEditor({
  productId,
  initialImages,
  storeHref,
}: {
  productId: string;
  initialImages: ProductImage[];
  /** URL pública de la ficha, para confirmar que los cambios ya se ven. */
  storeHref?: string;
}) {
  const router = useRouter();
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ status: "ok" | "error"; message: string } | null>(null);

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
        // El servidor renumera tras borrar (0..n−1) y, si se quitó la
        // portada, la primera imagen restante pasa a ser la portada nueva.
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

  // Al añadir por URL se invoca la server action directamente y se inserta la
  // fila creada en el estado del cliente, sin esperar al refresh.
  async function handleUrlAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("product_id", productId);
    setNotice(null);
    try {
      const result = await addImageAction(adminIdle, formData);
      if (result.status === "ok" && result.image) {
        setImages((prev) =>
          [...prev, result.image!].sort((a, b) => a.sort_order - b.sort_order),
        );
        form.reset();
        router.refresh();
        setNotice({ status: "ok", message: result.message });
      } else {
        setNotice({ status: "error", message: result.message });
      }
    } catch (error) {
      setNotice({
        status: "error",
        message: error instanceof Error ? error.message : "No se pudo añadir la imagen.",
      });
    }
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
      </div>

      <form
        onSubmit={handleUrlAdd}
        className="mt-4 grid gap-3 border-t border-ink-200 pt-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
      >
        <label className="grid gap-1">
          <span className="label">URL de la imagen</span>
          <input
            name="url"
            required
            placeholder="https://…/camiseta.jpg o /demo/products/…"
            className="field"
          />
        </label>
        <label className="grid gap-1">
          <span className="label">Texto alternativo</span>
          <input name="alt" placeholder="Franela blanca" className="field" />
        </label>
        <select name="kind" defaultValue="gallery" className="field sm:w-32">
          <option value="main">Portada</option>
          <option value="gallery">Galería</option>
        </select>
        <button type="submit" className="btn btn-sm btn-solid">
          <Upload className="size-3.5" />
          Añadir imagen
        </button>
      </form>

      <ImageUploadForm
        productId={productId}
        onUploaded={(image) => {
          setImages((prev) => [...prev, image].sort((a, b) => a.sort_order - b.sort_order));
        }}
      />
    </div>
  );
}