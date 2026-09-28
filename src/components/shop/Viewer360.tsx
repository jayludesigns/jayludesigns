"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MoveHorizontal, Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/** Botón de la barra de control del visor. */
const CONTROL =
  "grid size-8 shrink-0 place-items-center rounded-full border border-ink-200 text-ink-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-ember-600 hover:bg-ember-600 hover:text-paper";

/**
 * Visor 360° por arrastre.
 *
 * Los fotogramas se precargan como `Image` para que el arrastre sea fluido sin
 * depender de la red. Funciona con ratón, dedo y teclado, y con datos guardados
 * por el administrador: si el producto no tiene fotogramas, el componente
 * devuelve null y quien lo usa muestra la foto estática.
 */
export function Viewer360({
  frames,
  poster,
  alt,
  className,
  autoSpin = false,
}: {
  frames: string[];
  poster?: string | null;
  alt: string;
  className?: string;
  autoSpin?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [spinning, setSpinning] = useState(autoSpin);
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);
  const preloaded = useRef<Set<number>>(new Set());
  const dragOrigin = useRef<{ x: number; start: number } | null>(null);

  const count = frames.length;

  useEffect(() => {
    if (count === 0) return;
    let cancelled = false;
    let loaded = 0;
    const images = frames.map((src, i) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = image.onerror = () => {
        loaded += 1;
        preloaded.current.add(i);
        if (!cancelled && loaded >= count) setReady(true);
      };
      image.src = src;
      return image;
    });
    return () => {
      cancelled = true;
      images.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [frames, count]);

  useEffect(() => {
    if (!spinning || dragging || count === 0) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), 110);
    return () => window.clearInterval(id);
  }, [spinning, dragging, count]);

  const step = useCallback(
    (delta: number) => setIndex((i) => (i + delta + count) % count),
    [count],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragOrigin.current = { x: event.clientX, start: index };
    setDragging(true);
    setSpinning(false);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const origin = dragOrigin.current;
    if (!origin || count === 0) return;
    // ~4 px por fotograma: rápido sin sentirse nervioso.
    const framesMoved = Math.round((event.clientX - origin.x) / 4);
    setIndex(((origin.start + framesMoved) % count + count) % count);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragOrigin.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setSpinning(false);
      step(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSpinning(false);
      step(-1);
    }
  };

  const progress = useMemo(() => (count > 1 ? (index / (count - 1)) * 100 : 100), [index, count]);

  if (count < 2) return null;

  return (
    <div className={cn("select-none", className)}>
      <div
        role="slider"
        tabIndex={0}
        aria-label={`Gira la prenda de ${alt} para ver los 360 grados`}
        aria-valuemin={1}
        aria-valuemax={count}
        aria-valuenow={index + 1}
        aria-valuetext={`Fotograma ${index + 1} de ${count}`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          "glow-ember-soft relative w-full cursor-grab touch-none overflow-hidden rounded-2xl border border-ink-200 bg-paper active:cursor-grabbing",
          dragging && "cursor-grabbing",
        )}
      >
        {frames.map((src, i) =>
          i === index ? (
            // Solo se monta el fotograma visible: así el navegador no tiene que
            // pintar 36 imágenes a la vez.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={i === 0 ? alt : ""}
              draggable={false}
              className="pointer-events-none block aspect-square w-full animate-fade-in object-contain"
            />
          ) : null,
        )}

        {!ready && (
          <span className="pointer-events-none absolute inset-0 grid place-items-center">
            <Loader2 className="size-6 animate-spin text-ember-600" />
          </span>
        )}

        {/* Pista de arrastre */}
        <span
          className={cn(
            "pointer-events-none absolute inset-x-3 bottom-3 mx-auto flex w-fit items-center justify-center gap-2 rounded-full bg-ink/80 py-2 pr-4 pl-3.5 font-mono text-[0.58rem] tracking-[0.18em] text-paper uppercase backdrop-blur-sm transition-opacity duration-200",
            dragging ? "opacity-0" : "opacity-100",
          )}
        >
          <MoveHorizontal className="size-3.5" />
          Arrastra para girar
        </span>

        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-ink-950/80 px-2.5 py-1 font-mono text-[0.58rem] font-bold tracking-[0.14em] text-paper uppercase backdrop-blur-sm">
          360°
        </span>
      </div>

      <div className="flex items-center gap-3 rounded-b-2xl border border-ink-200 px-3 py-2">
        <button
          type="button"
          onClick={() => setSpinning((v) => !v)}
          aria-label={spinning ? "Pausar giro automático" : "Girar automáticamente"}
          className={CONTROL}
        >
          {spinning ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => {
            setIndex(0);
            setSpinning(false);
          }}
          aria-label="Volver al frente"
          className={CONTROL}
        >
          <RotateCcw className="size-3.5" />
        </button>

        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100" aria-hidden>
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-ember-600 transition-[width] duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-mono text-[0.6rem] text-ink-500 tabular">
          {String(index + 1).padStart(2, "0")}/{count}
        </span>
      </div>

      {poster && index !== 0 && (
        <span className="sr-only">Fotograma de referencia: {poster}</span>
      )}
    </div>
  );
}
