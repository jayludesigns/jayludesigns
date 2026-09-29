"use client";

import { useActionState } from "react";
import { KeyRound, Loader2, Lock, Mail, TriangleAlert } from "lucide-react";
import { loginAction } from "@/app/admin/actions";

const initial = { error: undefined as string | undefined };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

      <div>
        <label htmlFor="email" className="label">
          Correo
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-40" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            autoFocus
            defaultValue="admin@jaylu.ve"
            className="field pl-9"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="label">
          Contraseña
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 opacity-40" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="field pl-9"
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border-2 border-ember-600 bg-ember-950/70 p-3 text-sm font-bold text-ember-200">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-solid btn-lg w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
        {pending ? "Entrando…" : "Entrar al panel"}
      </button>
    </form>
  );
}
