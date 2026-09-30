"use client";

import { useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LightboxImage {
  id: string;
  url: string;
  alt?: string | null;
}

/**
 * Visor de imágenes: la foto sale flotando sobre la página, centrada y a
 * pantalla completa, sin nada de alrededor. Se cierra con Escape, con el
 * fondo o con la X, y se recorre con las flechas del teclado o los botones
 * laterales. Mientras está abierto la página deja de desplazarse.
 */
export function ImageLightbox({
  images,
  index,
  onIndexChange,
  onClose,
  label,
}: {
  images: LightboxImage[];
  index: number;
  onIndexChange: (next: number) => void;
  onClose: () => void;
  label?: string;
}) {
  const total = images.length;
  const image = images[index];

  const mover = useCallback(
    (delta: number) => {
      if (total < 2) return;
      onIndexChange((index + delta + total) % total);
    },
    [index, onIndexChange, total],
  );

  useEffect(() => {
    const alPulsar = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") mover(1);
      else if (event.key === "ArrowLeft") mover(-1);
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [mover, onClose]);

  useEffect(() => {
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, []);

  if (!image) return null;

  const boton = cn(
    "grid place-items-center rounded-full border border-ink-700 text-paper transition-colors",
    "hover:border-paper hover:bg-paper hover:text-ember-600",
    "focus-visible:border-paper focus-visible:bg-paper focus-visible:text-ember-600",
  );

  return (
    <div
      className="animate-fade-in fixed inset-0 z-100 flex flex-col bg-ink-950/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={label ?? "Imagen ampliada"}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="font-mono text-[0.62rem] tracking-[0.16em] text-ink-300 uppercase tabular">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar la imagen"
          className={`${boton} size-10`}
        >
          <X className="size-5" />
        </button>
      </div>

      {/* El fondo cierra; la foto y los botones frenan la propagación. */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-2">
        <div
          className="flex size-full items-center justify-center"
          onClick={onClose}
          role="presentation"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.alt ?? ""}
            onClick={(event) => event.stopPropagation()}
            className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>
      </div>

      {total > 1 && (
        <div className="flex items-center justify-center gap-3 pb-5">
          <button
            type="button"
            onClick={() => mover(-1)}
            aria-label="Foto anterior"
            className={`${boton} size-11`}
          >
            <ChevronLeft className="size-5" />
          </button>
          <span className="font-mono text-[0.62rem] tracking-[0.16em] text-ink-300 uppercase tabular">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => mover(1)}
            aria-label="Foto siguiente"
            className={`${boton} size-11`}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
