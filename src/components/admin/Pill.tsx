import { cn } from "@/lib/utils";

/**
 * Etiqueta de estado. Los tonos que marcan algo importante usan el acento:
 * lo que hay que mirar se ve de un vistazo, sin tener que leer la palabra.
 */
export function Pill({
  children,
  tone = "plain",
  className,
}: {
  children: React.ReactNode;
  tone?: "plain" | "solid" | "outline" | "muted";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[0.62rem] font-bold tracking-wider uppercase whitespace-nowrap",
        tone === "solid" && "bg-ember-600 text-paper",
        tone === "outline" && "border border-ink-200 text-ink-700",
        tone === "plain" && "bg-ink-50 text-ink-700",
        tone === "muted" && "text-ink-500",
        className,
      )}
    >
      {children}
    </span>
  );
}

const TONE_BY_STATE: Record<string, "solid" | "outline" | "muted" | "plain"> = {
  paid: "solid",
  delivered: "solid",
  ready: "outline",
  shipped: "outline",
  in_production: "outline",
  pending_payment: "plain",
  draft: "muted",
  cancelled: "muted",
  active: "solid",
  inactive: "muted",
  published: "solid",
  scheduled: "outline",
  archived: "muted",
  low: "outline",
  out: "solid",
  ok: "solid",
  new: "solid",
  won: "solid",
  lost: "muted",
};

/** Elige el tono a partir del estado, sin tener que decidirlo en cada página. */
export function StatePill({ state, label }: { state: string; label: string }) {
  return <Pill tone={TONE_BY_STATE[state] ?? "plain"}>{label}</Pill>;
}

/** Barra horizontal de proporción, para Occupation breakdowns etc. */
export function Bar({
  value,
  max,
  label,
  className,
}: {
  value: number;
  max: number;
  label?: string;
  className?: string;
}) {
  const percent = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className={className}>
      {label && <p className="mb-1 font-mono text-[0.62rem] text-ink-500">{label}</p>}
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
        <div className="h-full rounded-full bg-ember-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
