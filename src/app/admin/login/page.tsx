import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Acceso al panel",
  robots: { index: false, follow: false },
};

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminLoginPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const raw = params.next;
  const next = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Lado de marca */}
      <div className="relative hidden overflow-hidden bg-ink text-paper lg:block">
        <div className="speed-lines-light absolute inset-0 opacity-30" aria-hidden />
        <div className="halftone-lg-light absolute inset-0 opacity-40" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-jaylu.svg"
            alt="JayLu"
            className="h-10 w-auto invert"
          />
          <div>
            <p className="font-display text-6xl leading-[0.85]">
              Todo el
              <br />
              negocio
              <br />
              <span className="opacity-40">en un</span> sitio
            </p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed opacity-70">
              Catálogo, promociones, pedidos, inventario, clientes y finanzas.
              La misma paleta, las mismas reglas.
            </p>
          </div>
          <p className="font-mono text-[0.6rem] tracking-[0.2em] text-paper/40 uppercase">
            JayLu · administración
          </p>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-jaylu.svg"
            alt="JayLu"
            className="mb-8 h-9 w-auto lg:hidden"
          />
          <h1 className="font-display text-4xl">Panel</h1>
          <p className="mt-2 text-sm text-ink-600">
            Acceso restringido al equipo de JayLu.
          </p>

          <div className="mt-7">
            <LoginForm next={next} />
          </div>

          <p className="mt-6 border border-ink-200 p-3 text-xs leading-relaxed text-ink-600">
            Las credenciales vienen de las variables de entorno{" "}
            <code className="font-mono">ADMIN_EMAIL</code> y{" "}
            <code className="font-mono">ADMIN_PASSWORD</code>. Sin ellas se usan
            los valores de desarrollo, y la cookie de sesión se firma con{" "}
            <code className="font-mono">ADMIN_SESSION_SECRET</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
