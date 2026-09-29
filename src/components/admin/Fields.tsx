/**
 * Primitivas de formulario del panel.
 *
 * Son componentes de servidor sin estado: cada uno escribe un `name` y el
 * valor por defecto que le da la página. Toda la lógica vive en las server
 * actions, que vuelven a validar lo que llegue.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

function Shell({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
        {required && <span className="ml-0.5 text-ink-500">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-xs font-bold text-ember-700">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextField({
  name,
  label,
  value,
  placeholder,
  type = "text",
  hint,
  error,
  required,
  className,
  inputClassName,
  ...rest
}: {
  name: string;
  label: string;
  value?: string | number | null;
  placeholder?: string;
  type?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  [key: string]: unknown;
}) {
  const id = `a-${name}`;
  return (
    <Shell label={label} htmlFor={id} hint={hint} error={error} required={required} className={className}>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={value ?? ""}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={cn("field", inputClassName, error && "border-ember-600 bg-ember-50")}
        {...(rest as object)}
      />
    </Shell>
  );
}

export function TextAreaField({
  name,
  label,
  value,
  placeholder,
  rows = 4,
  hint,
  error,
  className,
  mono,
}: {
  name: string;
  label: string;
  value?: string | null;
  placeholder?: string;
  rows?: number;
  hint?: string;
  error?: string;
  className?: string;
  mono?: boolean;
}) {
  const id = `a-${name}`;
  return (
    <Shell label={label} htmlFor={id} hint={hint} error={error} className={className}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={value ?? ""}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={cn(
          "field resize-y",
          mono && "font-mono text-xs",
          error && "border-ember-600 bg-ember-50",
        )}
      />
    </Shell>
  );
}

export function SelectField<T extends string>({
  name,
  label,
  value,
  options,
  hint,
  error,
  className,
  placeholder,
}: {
  name: string;
  label: string;
  value?: string | null;
  options: { value: T; label: string }[];
  hint?: string;
  error?: string;
  className?: string;
  placeholder?: string;
}) {
  const id = `a-${name}`;
  return (
    <Shell label={label} htmlFor={id} hint={hint} error={error} className={className}>
      <select
        id={id}
        name={name}
        defaultValue={value ?? ""}
        aria-invalid={Boolean(error)}
        className={cn("field", error && "border-ember-600 bg-ember-50")}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}

export function CheckField({
  name,
  label,
  defaultChecked,
  hint,
  className,
  value,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  hint?: string;
  className?: string;
  value?: string;
}) {
  const id = `a-${name}${value ? `-${value}` : ""}`;
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-xl border border-ink-200 p-3 text-sm transition-colors hover:border-ink-300 has-checked:border-ember-600 has-checked:bg-ember-50",
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        name={name}
        value={value ?? "on"}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 shrink-0 accent-[#6b201a]"
      />
      <span>
        <span className="block font-semibold leading-tight">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-ink-500">{hint}</span>}
      </span>
    </label>
  );
}

/** Varios checkboxes con el mismo `name`; el servidor recibe todos los valores. */
export function CheckGroup({
  name,
  legend,
  options,
  defaultValues = [],
  columns = 3,
}: {
  name: string;
  legend: string;
  options: string[];
  defaultValues?: string[];
  columns?: number;
}) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((option) => (
          <label
            key={option}
            className="cursor-pointer rounded-lg border border-ink-200 px-2 py-2 text-center font-mono text-xs transition-colors hover:border-ink-300 has-checked:border-ember-600 has-checked:bg-ember-600 has-checked:text-paper"
          >
            <input
              type="checkbox"
              name={name}
              value={option}
              defaultChecked={defaultValues.includes(option)}
              className="sr-only"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Campo de lista separada por comas. Se usa para tallas, colores sueltos,
 * etiquetas y keywords de SEO: escribir `S, M, L` es más rápido que mover
 * chips sueltos para el 90% de los casos.
 */
export function TagsField({
  name,
  label,
  values = [],
  hint,
  className,
  placeholder,
}: {
  name: string;
  label: string;
  values?: string[];
  hint?: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <TextField
      name={name}
      label={label}
      value={values.join(", ")}
      placeholder={placeholder ?? "uno, dos, tres"}
      hint={hint ?? "Separados por comas."}
      className={className}
      inputClassName="font-mono text-xs"
    />
  );
}

export function Fieldset({
  title,
  description,
  children,
  className,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("card overflow-hidden", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 bg-ink-50/70 px-4 py-2.5">
        <div>
          <h2 className="font-mono text-[0.67rem] font-bold tracking-[0.16em] text-ember-700 uppercase">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-xs text-ink-600">{description}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
