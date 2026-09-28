"use client";

import { useActionState } from "react";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { submitContact, idleState, type FormState } from "@/lib/actions/store";
import { cn } from "@/lib/utils";

const SUBJECTS = [
  "Cotización de diseño a medida",
  "Pedido de uniformes",
  "Estado de un pedido",
  "Pregunta sobre un producto",
  "Venta mayorista / patrocinio",
  "Otro",
];

export function ContactForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    submitContact,
    idleState,
  );

  if (state.status === "ok") {
    return (
      <div className="border-2 border-ink p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center border-2 border-ink">
          <Check className="size-7" strokeWidth={2.5} />
        </span>
        <h2 className="mt-5 font-display text-3xl">Mensaje recibido</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-600">{state.message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn mt-6"
        >
          Escribir otro mensaje
        </button>
      </div>
    );
  }

  const errorFor = (key: string) => state.fields?.[key];

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="label">
            Nombre
          </label>
          <input
            id="c-name"
            name="name"
            required
            autoComplete="name"
            className={cn("field", errorFor("name") && "border-2 border-ember-600")}
          />
          {errorFor("name") && (
            <p role="alert" className="mt-1 text-xs font-bold">
              {errorFor("name")}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="c-phone" className="label">
            Teléfono o WhatsApp
          </label>
          <input
            id="c-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="field"
            placeholder="0412-1234567"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="c-email" className="label">
            Correo (opcional)
          </label>
          <input
            id="c-email"
            name="email"
            type="email"
            autoComplete="email"
            className="field"
            placeholder="tu@correo.com"
          />
          {errorFor("email") && (
            <p role="alert" className="mt-1 text-xs font-bold">
              {errorFor("email")}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="c-subject" className="label">
          ¿Sobre qué es?
        </label>
        <select id="c-subject" name="source" className="field" defaultValue={SUBJECTS[0]}>
          {SUBJECTS.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="c-message" className="label">
          Mensaje
        </label>
        <textarea
          id="c-message"
          name="message"
          rows={6}
          required
          placeholder="Cuéntanos qué necesitas, para cuándo y cuántos."
          className={cn("field resize-y", errorFor("message") && "border-2 border-ember-600")}
        />
        {errorFor("message") && (
          <p role="alert" className="mt-1 text-xs font-bold">
            {errorFor("message")}
          </p>
        )}
      </div>

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border-2 border-ember-600 bg-ember-50 p-3 text-sm font-bold"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-solid btn-lg w-full sm:w-auto sm:px-10">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enviando…
          </>
        ) : (
          "Enviar mensaje"
        )}
      </button>
    </form>
  );
}
