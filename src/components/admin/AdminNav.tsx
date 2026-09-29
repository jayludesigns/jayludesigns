"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Boxes,
  Brush,
  LayoutDashboard,
  Menu,
  Package,
  Percent,
  Settings,
  ShoppingCart,
  Shirt,
  Truck,
  Users,
  X,
} from "lucide-react";
import { logout } from "@/app/admin/actions";
import { ADMIN_HEADER } from "@/components/admin/AdminUI";
import { Wordmark } from "@/components/site/Logo";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Se marca activo también en sus subpáginas. */
  match?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    title: "Tienda",
    items: [
      { href: "/admin", label: "Resumen", icon: LayoutDashboard },
      { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
      { href: "/admin/disenos", label: "Diseños a medida", icon: Brush },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/admin/productos", label: "Productos", icon: Shirt },
      { href: "/admin/colecciones", label: "Colecciones", icon: Package },
      { href: "/admin/promociones", label: "Promociones", icon: Percent },
    ],
  },
  {
    title: "Taller",
    items: [
      { href: "/admin/inventario", label: "Inventario", icon: Boxes },
      {
        href: "/admin/inventario/materia-prima",
        label: "Materia prima",
        icon: Boxes,
        match: "/admin/inventario/materia-prima",
      },
    ],
  },
  {
    title: "Relación",
    items: [
      { href: "/admin/clientes", label: "Clientes", icon: Users },
      { href: "/admin/crm", label: "CRM y seguimiento", icon: Truck },
    ],
  },
  {
    title: "Negocio",
    items: [
      { href: "/admin/finanzas", label: "Finanzas", icon: BarChart3 },
      { href: "/admin/ajustes", label: "Ajustes", icon: Settings },
    ],
  },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.match) return pathname.startsWith(item.match);
  if (item.href === "/admin") return pathname === "/admin";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const contents = (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Halo de acento en la cabecera del panel: mismo recurso que el pie de
          la tienda, para que las dos mitades compartan lenguaje visual. */}
      <div className="glow-ember pointer-events-none absolute inset-x-0 top-0 h-56 opacity-70" aria-hidden />

      {/* La altura la comparte con la barra de alertas de la derecha: las dos
          cabeceras tienen que medir lo mismo para leerse como una sola. */}
      <div
        className={cn(
          "relative flex items-center border-b border-paper/10 px-4",
          ADMIN_HEADER,
        )}
      >
        <Link
          href="/admin"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5"
        >
          <Wordmark size="sm" invert />
          <span className="rounded-full bg-ember-600 px-2 py-0.5 font-mono text-[0.57rem] tracking-[0.18em] text-paper uppercase">
            Panel
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {GROUPS.map((group) => (
          <div key={group.title} className="mb-4 last:mb-0">
            <p className="px-2 pb-1.5 font-mono text-[0.57rem] tracking-[0.22em] text-ember-400/80 uppercase">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-ember-600 font-bold text-paper shadow-ember"
                          : "text-paper/70 hover:bg-paper/10 hover:text-paper",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" strokeWidth={active ? 2.2 : 1.7} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="relative border-t border-paper/10 px-4 py-3">
        <p className="truncate font-mono text-[0.62rem] text-paper/60">{email}</p>
        <form action={logout} className="mt-1.5">
          <button
            type="submit"
            className="font-mono text-[0.62rem] tracking-wider text-paper/80 uppercase hover:text-ember-300 hover:underline"
          >
            Cerrar sesión
          </button>
        </form>
        <Link
          href="/"
          target="_blank"
          className="mt-1.5 block font-mono text-[0.62rem] tracking-wider text-paper/60 uppercase hover:text-ember-300 hover:underline"
        >
          Ver la tienda ↗
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Barra en móvil */}
      <div
        className={cn(
          "sticky top-0 z-40 flex items-center justify-between border-b border-ink-800 bg-ink-950/90 px-4 backdrop-blur-md lg:hidden",
          ADMIN_HEADER,
        )}
      >
        <Link href="/admin" className="flex items-center gap-2">
          <Wordmark size="sm" invert />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          className="grid size-9 place-items-center rounded-full border border-ink-800 text-paper transition-colors hover:border-ember-600 hover:bg-ember-600 hover:text-paper"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 top-15 z-40 bg-ink-950 lg:hidden">{contents}</div>
      )}

      <aside className="sticky top-0 hidden h-dvh shrink-0 bg-ink-950 lg:block lg:w-60">
        {contents}
      </aside>
    </>
  );
}
