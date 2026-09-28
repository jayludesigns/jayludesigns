"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Check, Loader2, TriangleAlert, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Subida de imágenes de producto desde el equipo al almacenamiento local.
 *
 * Hace POST multipart a /api/uploads (route handler) porque las server
 * actions de Next no aceptan archivos; al terminar refresca los datos del
 * servidor para que la galería muestre la imagen nueva.
 */
export function ImageUploadForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<
    { status: "ok" | "error"; message: string } | null
  >(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("file") as File | null;
    if (!file || file.size === 0) {
      setFeedback({ status: "error", message: "Elige una imagen de tu equipo." });
      return;
    }
    setPending(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: new FormData(form),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo subir la imagen.");
      }
      form.reset();
      setFileName(null);
      setFeedback({
        status: "ok",
        message: data.message ?? "Imagen subida y guardada.",
      });
      router.refresh();
    } catch (error) {
      setFeedback({
        status: "error",
        message:
          error instanceof Error ? error.message : "No se pudo subir la imagen.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      method="post"
      encType="multipart/form-data"
      onSubmit={onSubmit}
      className="mt-4 grid gap-3 border-t border-ink-200 pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
    >
      <input type="hidden" name="product_id" value={productId} />

      <label className="flex cursor-pointer items-center gap-2 self-center rounded-xl border-2 border-dashed border-ember-300 bg-ember-50 px-4 py-2.5 text-sm font-semibold text-ember-700 transition-colors hover:border-ember-500 hover:bg-ember-100">
        <Upload className="size-4 shrink-0" />
        <span className="truncate">{fileName ?? "Elegir imagen desde tu equipo…"}</span>
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="sr-only"
          required
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? null)}
        />
      </label>

      <select name="kind" defaultValue="gallery" className="field sm:w-32">
        <option value="main">Portada</option>
        <option value="gallery">Galería</option>
        <option value="360">Fotograma 360</option>
      </select>

      <button type="submit" disabled={pending} className="btn btn-sm btn-solid">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {pending ? "Subiendo…" : "Subir imagen"}
      </button>

      {feedback && (
        <p
          role={feedback.status === "error" ? "alert" : "status"}
          className={cn(
            "flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold sm:col-span-full",
            feedback.status === "error"
              ? "border border-ember-600 bg-ember-50 text-ember-900"
              : "border border-ink-200 bg-ink-50",
          )}
        >
          {feedback.status === "error" ? (
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-ember-600" />
          ) : (
            <Check className="mt-0.5 size-4 shrink-0 text-ember-600" />
          )}
          {feedback.message}
        </p>
      )}
    </form>
  );
}