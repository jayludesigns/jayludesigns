import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Cabecera de sección del panel: título, descripción y acciones a la derecha. */
export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-ink-200 pb-4">
      <div className="min-w-0">
        <h1 className="font-display text-3xl leading-none sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-ink-600">{description}</p>
        )}
        {children}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({
  title,
  hint,
  children,
  className,
  footer,
  action,
  id,
}: {
  title?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cn("card overflow-hidden", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 bg-ink-50/70 px-4 py-2.5">
          <div>
            {title && (
              <h2 className="font-mono text-[0.65rem] font-bold tracking-[0.16em] text-ember-700 uppercase">
                {title}
              </h2>
            )}
            {hint && <p className="mt-0.5 text-xs text-ink-600">{hint}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && (
        <div className="border-t border-ink-100 bg-ink-50/50 px-4 py-3">{footer}</div>
      )}
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  href,
  tone = "plain",
}: {
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  tone?: "plain" | "alert" | "good";
}) {
  const body = (
    <>
      <p className="font-mono text-[0.58rem] tracking-[0.16em] text-ink-500 uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-mono text-2xl leading-none font-bold tabular",
          tone === "alert" && "text-ember-600",
          tone === "good" && "text-ink",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs text-ink-500">{sub}</p>}
    </>
  );

  const className = cn(
    "card block p-3.5 transition-all duration-200",
    href && "hover:-translate-y-0.5 hover:border-ember-600 hover:shadow-md",
  );

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function StatGrid({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 | 5 }) {
  const map = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4", 5: "sm:grid-cols-2 lg:grid-cols-5" };
  return <div className={cn("grid gap-3", map[cols])}>{children}</div>;
}

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-ink-300 px-4 py-10 text-center">
      <p className="font-display text-xl">{title}</p>
      {body && <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-600">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

/** Barra de filtros: envuelve un <form method="get"> del servidor. */
export function Filters({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <form
      method="get"
      className={cn(
        "card mb-5 flex flex-wrap items-end gap-2 p-3",
        className,
      )}
    >
      {children}
      <button type="submit" className="btn btn-sm btn-solid">
        Filtrar
      </button>
      <Link href="." className="btn btn-sm">
        Limpiar
      </Link>
    </form>
  );
}

export function FilterInput({
  name,
  label,
  value,
  placeholder,
  type = "text",
  className,
}: {
  name: string;
  label: string;
  value?: string;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="label">
        {label}
      </label>
      <input
        id={`f-${name}`}
        type={type}
        name={name}
        defaultValue={value ?? ""}
        placeholder={placeholder}
        className="field py-1.5 text-sm"
      />
    </div>
  );
}

export function FilterSelect({
  name,
  label,
  value,
  options,
  className,
}: {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="label">
        {label}
      </label>
      <select
        id={`f-${name}`}
        name={name}
        defaultValue={value ?? ""}
        className="field py-1.5 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
