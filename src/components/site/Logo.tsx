import { cn } from "@/lib/utils";

/**
 * El SVG original trae bastante aire arriba y abajo. Estos valores son la
 * fracción de la caja que realmente ocupa el dibujo (medido sobre los píxeles
 * con alfa > 12), y sirven para recortar el relleno transparente sin tocar el
 * archivo original.
 */
const INK = { x: 0.0111, y: 0.16495, w: 0.97911, h: 0.7085 };

export function Logo({
  className,
  invert = false,
  priority = false,
}: {
  className?: string;
  invert?: boolean;
  priority?: boolean;
}) {
  const scaleY = 1 / INK.h;
  const scaleX = 1 / INK.w;
  return (
    <span
      className={cn("relative block overflow-hidden", className)}
      style={{ aspectRatio: `${INK.w} / ${INK.h}` }}
    >
      {/* `next/image` no sirve aquí: el logo se recorta con un desplazamiento
          y una escala en CSS, y `next/image` controla el tamaño desde su API en
          lugar de dejar que lo controle el contenedor. Con él habría que
          meter la transparencia en el archivo o recortar los bordes a mano. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-jaylu.svg"
        alt="JayLu"
        width={810}
        height={717}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="absolute max-w-none"
        style={{
          width: `${scaleX * 100}%`,
          height: `${scaleY * 100}%`,
          left: `${-INK.x * scaleX * 100}%`,
          top: `${-INK.y * scaleY * 100}%`,
          filter: invert ? "invert(1)" : undefined,
        }}
      />
    </span>
  );
}

const MARK_SIZES = {
  sm: { mark: "h-7", text: "text-lg", gap: "gap-2", pad: "p-1" },
  md: { mark: "h-9", text: "text-2xl", gap: "gap-2.5", pad: "p-1.5" },
  lg: { mark: "h-12", text: "text-4xl", gap: "gap-3", pad: "p-2" },
} as const;

/**
 * Lockup horizontal: isotipo + nombre en la tipografía de display.
 *
 * El archivo del logo es del cliente y no se toca, así que el peso visual se
 * consigue con lo que lo rodea: una pastilla del acento detrás del isotipo y
 * el "Lu" en burdeos en vez de apagado. El isotipo es un SVG sin color
 * declarado, o sea que se rellena en negro por defecto; al ponerlo sobre la
 * pastilla hay que invertirlo para que se vea.
 */
export function Wordmark({
  className,
  invert = false,
  priority = false,
  size = "md",
}: {
  className?: string;
  invert?: boolean;
  priority?: boolean;
  size?: keyof typeof MARK_SIZES;
}) {
  const marks = MARK_SIZES[size];

  return (
    <span className={cn("flex items-center", marks.gap, className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full",
          marks.pad,
          // Fondo oscuro: pastilla blanca con el isotipo en negro.
          // Fondo claro: pastilla de acento con el isotipo invertido.
          invert ? "bg-paper" : "bg-ember-600",
        )}
      >
        <Logo className={cn(marks.mark, "w-auto")} invert={!invert} priority={priority} />
      </span>
      <span
        className={cn(
          "font-display leading-none tracking-[0.02em] uppercase",
          marks.text,
          invert ? "text-paper" : "text-ink",
        )}
      >
        Jay
        <span className={invert ? "text-paper/55" : "text-ember-600"}>Lu</span>
      </span>
    </span>
  );
}
