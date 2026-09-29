import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import { ADMIN_HEADER_MIN } from "@/components/admin/AdminUI";
import { getAdminSession } from "@/lib/auth";
import { getSalesAlerts } from "@/lib/data/finance";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel" },
  robots: { index: false, follow: false },
};

/**
 * Carcasa del panel.
 *
 * El proxy ya manda a /admin/login a quien no tenga sesión; esta comprobación
 * es la segunda línea, para que la página no dependa solo de él (por ejemplo,
 * si alguien renderiza estas rutas desde otro contexto).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const alerts = await getSalesAlerts().catch(() => []);

  return (
    <div className="panel-dark flex min-h-dvh flex-col bg-ink-950 lg:flex-row">
      <AdminNav email={session.email} />

      <div className="min-w-0 flex-1">
        {alerts.length > 0 && (
          <div className="border-b border-ember-700 bg-ember-600 text-paper">
            {/* Misma altura que la barra del logotipo de la izquierda: los
                bordes quedan a la misma altura y la cabecera se lee como una
                sola línea. `min-h` porque con dos avisos en una ventana
                angosta los textos se parten en dos renglones. */}
            <div
              className={cn(
                "flex flex-wrap items-center gap-x-5 gap-y-1 px-4 lg:px-6",
                ADMIN_HEADER_MIN,
              )}
            >
              {alerts.map((alert) => (
                <a
                  key={alert.message}
                  href={alert.href}
                  className="font-mono text-[0.67rem] tracking-wider uppercase hover:underline"
                >
                  {alert.tone === "warn" ? "▲" : "•"} {alert.message} →
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
