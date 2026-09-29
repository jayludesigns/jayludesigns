"use client";

import { useRouter } from "next/navigation";
import { useActionState, type ReactNode } from "react";
import { Loader2, TriangleAlert, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/lib/types";

/**
 * Resultado común de todas las server actions del panel.
 *
 * Siempre es un objeto plano: las server actions cruzan la frontera de
 * red hacia el cliente, así que no pueden devolver clases, funciones ni
 * errores arbitrarios.
 */
export interface AdminResult {
  status: "ok" | "error";
  message: string;
  /** Errores por campo, para pintar el formulario. */
  errors?: Record<string, string>;
  /** Si viene, el formulario navega a esta ruta (por ejemplo, tras crear). */
  href?: string;
  /** Fuerza la recarga de los datos del servidor aunque no se navegue. */
  reload?: boolean;
  /** La imagen creada por una acción de imágenes, para mostrarla al instante. */
  image?: ProductImage;
}

export const adminIdle: AdminResult = { status: "ok", message: "" };

/**
 * Formulario del panel ligado a una server action.
 *
 * Concentra lo que se repite en todas las pantallas: estado pendiente,
 * mensaje de éxito o error, errores por campo, navegación posterior y
 * confirmación antes de acciones destructivas.
 */
export function ActionForm({
  action,
  children,
  className,
  confirm,
  submitLabel,
  submitIcon,
  submitClassName,
  resetOnSuccess,
  hiddenFields,
  id,
}: {
  action: (previous: AdminResult, formData: FormData) => Promise<AdminResult>;
  children?: ReactNode;
  className?: string;
  confirm?: string;
  submitLabel?: string;
  submitIcon?: ReactNode;
  submitClassName?: string;
  resetOnSuccess?: boolean;
  hiddenFields?: Record<string, string | number | null | undefined>;
  id?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<AdminResult, FormData>(
    async (previous: AdminResult, formData: FormData) => {
      const result = await action(previous, formData);
      if (result.href) router.push(result.href);
      else if (result.reload !== false) router.refresh();
      return result;
    },
    adminIdle,
  );

  return (
    <form
      id={id}
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) {
          event.preventDefault();
          return;
        }
        if (resetOnSuccess) {
          // El navegador no limpia los campos si el action se despacha desde
          // otro sitio; se hace a mano tras el envío.
          event.currentTarget.addEventListener(
            "reset",
            () => window.setTimeout(() => router.refresh(), 0),
            { once: true },
          );
        }
      }}
    >
      {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value ?? ""} />
      ))}

      {state.message.length > 0 && (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={cn(
            "mb-4 flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold",
            state.status === "error"
              ? "border border-ember-600 bg-ember-50 text-ember-900"
              : "border border-ink-200 bg-ink-50",
          )}
        >
          {state.status === "error" ? (
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-ember-600" />
          ) : (
            <Check className="mt-0.5 size-4 shrink-0 text-ember-600" />
          )}
          {state.message}
        </p>
      )}

      {children}

      {submitLabel && (
        <button
          type="submit"
          disabled={pending}
          className={cn("btn btn-solid", submitClassName ?? "mt-4")}
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : submitIcon}
          {pending ? "Guardando…" : submitLabel}
        </button>
      )}
    </form>
  );
}

/** Botón que dispara un formulario por id, para acciones sueltas en la página. */
export function FormSubmit({
  formId,
  children,
  className,
  confirm,
  title,
}: {
  formId: string;
  children: ReactNode;
  className?: string;
  confirm?: string;
  title?: string;
}) {
  return (
    <button
      type="submit"
      form={formId}
      title={title}
      onClick={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
      className={className ?? "btn btn-sm"}
    >
      {children}
    </button>
  );
}
