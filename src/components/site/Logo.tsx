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
  mono = false,
  priority = false,
}: {
  className?: string;
  /**
   * Fuerza el isotipo a blanco puro, para superficies oscuras.
   *
   * Ojo: el archivo ya pinta el dibujo en blanco (trae un `feColorMatrix`
   * que fuerza los canales a 1), así que un `invert(1)` a secas lo dejaba
   * negro sobre negro. Va con `brightness(0)` delante para no depender de lo
   * que traiga el SVG: se aplana a negro y se invierte a blanco.
   */
  invert?: boolean;
  /** Fuerza el isotipo a negro puro (brightness(0)), para superficies claras. */
  mono?: boolean;
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
          filter: mono ? "brightness(0)" : invert ? "brightness(0) invert(1)" : undefined,
        }}
      />
    </span>
  );
}

const MARK_SIZES = {
  sm: { mark: "h-7", text: "text-lg", gap: "gap-2" },
  md: { mark: "h-9", text: "text-2xl", gap: "gap-2.5" },
  lg: { mark: "h-12", text: "text-4xl", gap: "gap-3" },
} as const;

/**
 * Lockup horizontal: isotipo + nombre en la tipografía de display.
 *
 * El archivo del logo es del cliente y no se toca. El isotipo llega blanco y
 * se aplana a negro con `mono` para las superficies claras; sobre las oscuras
 * (`invert`) se queda en blanco, sin filtro, o forzado con brightness(0) si
 * el archivo cambiara. El "Lu" en burdeos da el acento de marca en fondo
 * claro.
 *
 * Sobre fondo oscuro, "Jay" y "Lu" van los dos en blanco pleno: al 55% de
 * opacidad el "Lu" se leía gris y el nombre no definía junto al isotipo.
 */
export function Wordmark({
  className,
  invert = false,
  mono = false,
  priority = false,
  size = "md",
}: {
  className?: string;
  invert?: boolean;
  /** Lockup completo en negro, para superficies claras. */
  mono?: boolean;
  priority?: boolean;
  size?: keyof typeof MARK_SIZES;
}) {
  const marks = MARK_SIZES[size];

  return (
    <span className={cn("flex items-center", marks.gap, className)}>
      <Logo
        className={cn(marks.mark, "w-auto")}
        invert={invert}
        mono={mono}
        priority={priority}
      />
      <span
        className={cn(
          "font-display leading-none tracking-[0.02em] uppercase",
          marks.text,
          mono || !invert ? "text-ink" : "text-paper",
        )}
      >
        Jay
        <span className={mono ? "text-ink" : invert ? "text-paper" : "text-ember-600"}>
          Lu
        </span>
      </span>
    </span>
  );
}
