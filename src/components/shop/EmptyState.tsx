import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Acciones que se pintan debajo (btn btn-solid, btn, etc.). */
  actions?: ReactNode;
}

/** Estado vacío de la tienda: tarjeta centrada con el icono en acento,
    título de marca, copia breve y acciones. El mismo rostro en el carrito,
    los favoritos, el checkout y el catálogo sin resultados. */
export function EmptyState({ icon: Icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="card p-10 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-ember-50 text-ember-600">
        <Icon className="size-6" strokeWidth={1.5} />
      </span>
      <h2 className="mt-4 font-display text-3xl">{title}</h2>
      {description ? (
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-600">{description}</p>
      ) : null}
      {actions ? <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </div>
  );
}