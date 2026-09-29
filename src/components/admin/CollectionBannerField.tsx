"use client";

import { useId, useState, type ChangeEvent } from "react";
import { Check, Loader2, TriangleAlert, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Campo de imagen de portada de una colección.
 *
 * Igual que en productos, el archivo se sube al almacenamiento local
 * (POST multipart a /api/uploads con target=coleccion) y la URL que devuelve
 * queda escrita en el input `banner_url`, que es el campo que lee
 * saveCollectionAction. Al no haber id todavía, sirve tal cual para crear la
 * colección y para editarla: la imagen vive en public/uploads/colecciones/ y
 * se aplica al guardar.
 */
export function CollectionBannerField({
  defaultValue,
  label = "Imagen de portada",
  hint,
  className,
}: {
  defaultValue?: string | null;
  label?: string;
  hint?: string;
  className?: string;
}) {
  const id = useId();
  const [value, setValue] = useState(defaultValue ?? "");
  const [pending, setPending] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<
    { status: "ok" | "error"; message: string } | null
  >(null);

  async function upload(file: File) {
    setPending(true);
    setFeedback(null);
    try {
      const body = new FormData();
      body.set("target", "coleccion");
      body.set("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        message?: string;
        url?: string;
      };
      if (!response.ok || !data.ok || !data.url) {
        throw new Error(data.error ?? "No se pudo subir la imagen.");
      }
      setValue(data.url);
      setFileName(null);
      setFeedback({
        status: "ok",
        message: data.message ?? "Imagen subida al almacenamiento.",
      });
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
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <input
          id={id}
          name="banner_url"
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="/uploads/colecciones/…"
          aria-invalid={feedback?.status === "error"}
          className={cn("field min-w-0 flex-1", feedback?.status === "error" && "border-ember-600 bg-ember-50")}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setFeedback(null);
            }}
            className="btn btn-sm"
          >
            <X className="size-3.5" />
            Quitar
          </button>
        )}
      </div>

      {value && (
        <div className="mt-2 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-16 w-24 shrink-0 rounded-lg border border-ink-200 object-cover"
          />
          <p className="text-xs text-ink-500">Así se verá la portada de la colección.</p>
        </div>
      )}

      <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-ember-300 bg-ember-50 px-4 py-2.5 text-sm font-semibold text-ember-700 transition-colors hover:border-ember-500 hover:bg-ember-100">
        {pending ? (
          <Loader2 className="size-4 shrink-0 animate-spin" />
        ) : (
          <Upload className="size-4 shrink-0" />
        )}
        <span className="truncate">
          {pending ? "Subiendo…" : (fileName ?? "Subir imagen desde tu equipo…")}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="sr-only"
          disabled={pending}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;
            setFileName(file.name);
            void upload(file);
          }}
        />
      </label>

      {feedback ? (
        <p
          role={feedback.status === "error" ? "alert" : "status"}
          className={cn(
            "mt-2 flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold",
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
      ) : (
        <p className="mt-1 text-xs text-ink-500">
          {hint ??
            "Súbela al almacenamiento desde tu equipo o pega una ruta. Se aplica al guardar la colección."}
        </p>
      )}
    </div>
  );
}
