import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Fila de 5 estrellas de valoración. Componente puro: sirve igual en el
 * servidor (tarjetas del catálogo) y en el cliente (ficha del producto).
 */
export function Stars({
  rating,
  className,
  size = "size-3.5",
}: {
  rating: number;
  className?: string;
  size?: string;
}) {
  const filled = Math.round(rating);
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-ember-600", className)}
      role="img"
      aria-label={`${rating.toLocaleString("es-VE")} de 5 estrellas`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={cn(size, index < filled ? "fill-current" : "text-ink-200 fill-transparent")}
          aria-hidden
        />
      ))}
    </span>
  );
}