"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Facets {
  sizes: string[];
  colors: { name: string; hex: string }[];
  minPrice: number;
  maxPrice: number;
}

const SORTS = [
  { value: "destacados", label: "Destacados" },
  { value: "nuevos", label: "Novedades" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
  { value: "nombre", label: "Nombre A-Z" },
];

export function CatalogFilters({
  facets,
  categories,
  collections,
  total,
  children,
}: {
  facets: Facets;
  categories: { slug: string; name: string }[];
  collections: { slug: string; name: string }[];
  total: number;
  /** Productos filtrados: el grid (o el estado vacío) se pinta a la derecha
   *  del sidebar, dentro de la misma columna que la búsqueda desplegable. */
  children: ReactNode;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  // Búsqueda desplegable del catálogo (escritorio): entra de izquierda a
  // derecha al pulsar «Buscar» y el grid se comprime hacia la derecha para no
  // dejar espacio muerto. Si ya hay una consulta activa (q) arranca abierta
  // para poder refinarla. En móvil la búsqueda vive en el drawer de filtros.
  const [searchOpen, setSearchOpen] = useState(false);
  // Solo se autoabre al llegar con una consulta activa; si el usuario lo
  // cierra no vuelve a abrirse en cada navegación de filtros.
  const autoOpened = useRef(false);

  useEffect(() => {
    if (!autoOpened.current && params.get("q")) {
      autoOpened.current = true;
      setSearchOpen(true);
    }
  }, [params]);

  useEffect(() => {
    if (!searchOpen) return;
    // En escritorio el campo vive en el cajón lateral; en móvil/tablet en el
    // cajón que cae desde la barra superior. Enfocamos el que corresponda.
    const fieldId = window.matchMedia("(min-width: 1024px)").matches ? "q-desk" : "q-movil";
    (document.getElementById(fieldId) as HTMLInputElement | null)?.focus();
  }, [searchOpen]);

  const current = useMemo(
    () => ({
      q: params.get("q") ?? "",
      categoria: params.get("categoria") ?? "",
      coleccion: params.get("coleccion") ?? "",
      talla: params.getAll("talla"),
      color: params.getAll("color"),
      orden: params.get("orden") ?? "destacados",
      stock: params.get("stock") === "1",
      min: params.get("min") ?? "",
      max: params.get("max") ?? "",
    }),
    [params],
  );

  const apply = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      next.delete("pagina");
      const query = next.toString();
      startTransition(() => {
        router.replace(query ? `/catalogo?${query}` : "/catalogo", { scroll: false });
      });
    },
    [params, router],
  );

  const toggle = (key: "talla" | "color", value: string) => {
    apply((next) => {
      const values = next.getAll(key);
      next.delete(key);
      const updated = values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value];
      for (const v of updated) next.append(key, v);
    });
  };

  const activeCount =
    (current.q ? 1 : 0) +
    (current.categoria ? 1 : 0) +
    (current.coleccion ? 1 : 0) +
    current.talla.length +
    current.color.length +
    (current.stock ? 1 : 0) +
    (current.min || current.max ? 1 : 0);

  // Formulario de búsqueda reutilizado: dentro del cajón desplegable del
  // catálogo (escritorio) y al inicio del drawer de filtros (móvil). Recibe el
  // id del input para que ambos campos convivan sin colisionar.
  const searchForm = (fieldId: string) => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("q")?.toString() ?? "";
        apply((next) => (value ? next.set("q", value) : next.delete("q")));
      }}
      className="flex items-center gap-2"
    >
      <input
        id={fieldId}
        name="q"
        type="search"
        defaultValue={current.q}
        placeholder="Jujutsu, dragón, uniforme…"
        className="field min-w-0 flex-1 text-sm"
      />
      <button
        type="submit"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-ember-600 text-paper shadow-ember transition-all duration-200 hover:-translate-y-0.5 hover:bg-ember-700"
        aria-label="Buscar"
      >
        <Search className="size-4" />
      </button>
    </form>
  );

  const filterBody = (
    <div className="space-y-6">
      {/* Categoría */}
      {categories.length > 0 && (
        <div>
          <p className="label">Prenda</p>
          <ul className="space-y-1">
            {[{ slug: "", name: "Todas" }, ...categories].map((category) => {
              const active = current.categoria === category.slug;
              return (
                <li key={category.slug || "todas"}>
                  <button
                    type="button"
                    onClick={() =>
                      apply((next) =>
                        category.slug
                          ? next.set("categoria", category.slug)
                          : next.delete("categoria"),
                      )
                    }
                    className={cn(
                      "flex w-full items-center justify-between border-b border-ink-800 py-1.5 text-left text-sm text-ink-300 transition-colors",
                      active && "font-bold text-ember-400",
                    )}
                  >
                    <span className={cn(active && "underline decoration-2 underline-offset-4")}>
                      {category.name}
                    </span>
                    {active && <span className="size-1.5 rounded-full bg-ember-400" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Colección */}
      {collections.length > 0 && (
        <div>
          <p className="label">Colección</p>
          <div className="flex flex-wrap gap-1.5">
            {collections.map((collection) => {
              const active = current.coleccion === collection.slug;
              return (
                <button
                  key={collection.slug}
                  type="button"
                  onClick={() =>
                    apply((next) =>
                      active
                        ? next.delete("coleccion")
                        : next.set("coleccion", collection.slug),
                    )
                  }
                  className={cn("tag text-ink-300", active && "bg-ember-600 text-paper shadow-ember")}
                >
                  {collection.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Talla */}
      {facets.sizes.length > 0 && (
        <div>
          <p className="label">Talla</p>
          <div className="flex flex-wrap gap-1.5">
            {facets.sizes.map((size) => {
              const active = current.talla.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggle("talla", size)}
                  className={cn(
                    "min-w-9 rounded-full border border-ink-700 px-2 py-1 font-mono text-[0.65rem] font-bold transition-colors",
                    active
                      ? "border-ember-600 bg-ember-600 text-paper shadow-ember"
                      : "text-ink-300 hover:border-ember-400 hover:bg-ember-600/20 hover:text-ember-300",
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color */}
      {facets.colors.length > 0 && (
        <div>
          <p className="label">Color</p>
          <div className="space-y-1.5">
            {facets.colors.map((color) => {
              const active = current.color.includes(color.name);
              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => toggle("color", color.name)}
                  className="flex w-full items-center gap-2.5 text-left text-sm"
                >
                  <span
                    className={cn(
                      "grid size-5 shrink-0 place-items-center rounded-full border border-ink-700 transition-all",
                      active && "border-ember-600 ring-2 ring-ember-600/30 ring-offset-1 ring-offset-ink-950",
                    )}
                    style={{ backgroundColor: color.hex }}
                    aria-hidden
                  />
                  <span className={cn("text-ink-300", active && "font-bold")}>{color.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Precio */}
      {facets.maxPrice > facets.minPrice && (
        <div>
          <p className="label">Precio (Bs)</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={facets.minPrice}
              max={facets.maxPrice}
              defaultValue={current.min}
              placeholder={String(facets.minPrice)}
              onBlur={(event) =>
                apply((next) => {
                  const value = event.target.value;
                  if (value) next.set("min", value);
                  else next.delete("min");
                })
              }
              className="field text-sm"
              aria-label="Precio mínimo"
            />
            <span className="text-ink-400">—</span>
            <input
              type="number"
              inputMode="numeric"
              min={facets.minPrice}
              max={facets.maxPrice}
              defaultValue={current.max}
              placeholder={String(facets.maxPrice)}
              onBlur={(event) =>
                apply((next) => {
                  const value = event.target.value;
                  if (value) next.set("max", value);
                  else next.delete("max");
                })
              }
              className="field text-sm"
              aria-label="Precio máximo"
            />
          </div>
        </div>
      )}

      {/* Disponibilidad */}
      <div>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-300">
          <input
            type="checkbox"
            checked={current.stock}
            onChange={(event) =>
              apply((next) =>
                event.target.checked ? next.set("stock", "1") : next.delete("stock"),
              )
            }
            className="size-4 accent-[#6b201a]"
          />
          Solo con stock
        </label>
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => startTransition(() => router.replace("/catalogo"))}
          className="btn btn-ghost-light w-full"
        >
          <X className="size-3.5" />
          Limpiar ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* Orden + móvil + búsqueda desplegable */}
      <div className="mb-4 flex items-center justify-between gap-3 border-y border-ink-800 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-expanded={searchOpen}
            aria-controls="cajon-busqueda"
            className={cn(
              "btn btn-sm shrink-0",
              searchOpen ? "btn-solid" : "btn-ghost-light",
            )}
          >
            {searchOpen ? <X className="size-3" /> : <Search className="size-3" />}
            <span className="hidden sm:inline">Buscar</span>
          </button>
          <p className="font-mono text-[0.62rem] tracking-[0.14em] text-ink-300 uppercase">
            {pending ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin" /> filtrando
              </span>
            ) : (
              `${total} ${total === 1 ? "prenda" : "prendas"}`
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="btn btn-sm btn-ghost-light lg:hidden"
          >
            <SlidersHorizontal className="size-3" />
            Filtros{activeCount ? ` (${activeCount})` : ""}
          </button>
          <label className="flex items-center gap-2">
            <span className="font-mono text-[0.6rem] tracking-wider text-ink-400 uppercase">
              Orden
            </span>
            <select
              value={current.orden}
              onChange={(event) =>
                apply((next) => {
                  if (event.target.value === "destacados") next.delete("orden");
                  else next.set("orden", event.target.value);
                })
              }
              className="field w-auto py-1.5 text-xs"
            >
              {SORTS.map((sort) => (
                <option key={sort.value} value={sort.value}>
                  {sort.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Cajón de búsqueda móvil/tablet: cae desde la barra superior hacia
          abajo y empuja el contenido (grid) que le sigue, sin tocar la
          posición de las prendas. En escritorio se usa el cajón lateral. */}
      {searchOpen && (
        <div
          className="mb-4 animate-slide-in-down rounded-2xl border border-ink-800 bg-ink-900/60 p-4 lg:hidden"
          id="cajon-busqueda-movil"
        >
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="q-movil" className="label mb-0">
              Buscar en el catálogo
            </label>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Cerrar búsqueda"
              className="grid size-8 place-items-center rounded-full border border-ink-700 text-ink-200 transition-colors hover:border-ember-400 hover:text-ember-400"
            >
              <X className="size-3.5" />
            </button>
          </div>
          {searchForm("q-movil")}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-32 max-h-[calc(100dvh-9rem)] overflow-y-auto pr-2">
            {filterBody}
          </div>
        </aside>

        {open && (
          <div className="animate-fade-in fixed inset-0 z-90 overflow-y-auto bg-ink-950 lg:hidden">
            <div className="flex items-center justify-between rounded-t-xl border-b border-ink-800 bg-ink-950 px-4 py-3">
              <span className="font-display text-2xl text-paper">Filtros</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar filtros"
                className="grid size-9 place-items-center rounded-full border border-ink-700 text-ink-200 transition-colors hover:border-ember-400 hover:text-ember-400"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="px-4 py-5">
              <div className="space-y-3">
                <label htmlFor="q-drawer" className="label">
                  Buscar
                </label>
                {searchForm("q-drawer")}
              </div>
              <div className="mt-6">{filterBody}</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn btn-solid btn-lg mt-6 w-full"
              >
                Ver {total} resultados
              </button>
            </div>
          </div>
        )}

        {/* Columna de productos: en escritorio la búsqueda entra de izquierda a
            derecha y el grid se comprime a la derecha para no dejar espacio
            muerto. En móvil/tablet el cajón cae desde la barra superior
            (arriba) y la búsqueda vive también en el drawer de filtros. */}
        <div className="min-w-0">
          <CatalogResults total={total} />
          <div className="flex items-start gap-6">
            {searchOpen && (
              <div
                id="cajon-busqueda"
                className="hidden w-full max-w-72 shrink-0 animate-slide-in-left rounded-2xl border border-ink-800 bg-ink-900/60 p-4 lg:block"
              >
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="q-desk" className="label mb-0">
                    Buscar en el catálogo
                  </label>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    aria-label="Cerrar búsqueda"
                    className="grid size-8 place-items-center rounded-full border border-ink-700 text-ink-200 transition-colors hover:border-ember-400 hover:text-ember-400"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                {searchForm("q-desk")}
              </div>
            )}
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Marcador accesible de resultados (sr-only) dentro de la columna. */
function CatalogResults({ total }: { total: number }) {
  return (
    <p className="sr-only" role="status">
      {total} resultados
    </p>
  );
}
