"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
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
}: {
  facets: Facets;
  categories: { slug: string; name: string }[];
  collections: { slug: string; name: string }[];
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

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

  const filterBody = (
    <div className="space-y-6">
      {/* Búsqueda */}
      <div>
        <label htmlFor="q" className="label">
          Buscar
        </label>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get("q")?.toString() ?? "";
            apply((next) => (value ? next.set("q", value) : next.delete("q")));
          }}
          className="flex items-center gap-2"
        >
          <input
            id="q"
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
      </div>

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
                      "flex w-full items-center justify-between border-b border-ink-100 py-1.5 text-left text-sm transition-colors",
                      active && "font-bold text-ember-600",
                    )}
                  >
                    <span className={cn(active && "underline decoration-2 underline-offset-4")}>
                      {category.name}
                    </span>
                    {active && <span className="size-1.5 rounded-full bg-ember-600" aria-hidden />}
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
                  className={cn("tag", active && "bg-ember-600 text-paper shadow-ember")}
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
                    "min-w-9 rounded-full border border-ink-200 px-2 py-1 font-mono text-[0.65rem] font-bold transition-colors",
                    active
                      ? "border-ember-600 bg-ember-600 text-paper shadow-ember"
                      : "hover:border-ember-300 hover:bg-ember-50 hover:text-ember-700",
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
                      "grid size-5 shrink-0 place-items-center rounded-full border border-ink-200 transition-all",
                      active && "border-ember-600 ring-2 ring-ember-600/30 ring-offset-1",
                    )}
                    style={{ backgroundColor: color.hex }}
                    aria-hidden
                  />
                  <span className={cn(active && "font-bold")}>{color.name}</span>
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
            <span className="text-ink-500">—</span>
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
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
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
          className="btn w-full"
        >
          <X className="size-3.5" />
          Limpiar ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <div>
      {/* Orden + móvil */}
      <div className="mb-4 flex items-center justify-between gap-3 border-y border-ink-200 py-2.5">
        <p className="font-mono text-[0.62rem] tracking-[0.14em] uppercase">
          {pending ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="size-3 animate-spin" /> filtrando
            </span>
          ) : (
            `${total} ${total === 1 ? "prenda" : "prendas"}`
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="btn btn-sm lg:hidden"
          >
            <SlidersHorizontal className="size-3" />
            Filtros{activeCount ? ` (${activeCount})` : ""}
          </button>
          <label className="flex items-center gap-2">
            <span className="font-mono text-[0.6rem] tracking-wider uppercase text-ink-500">
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

      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-32 max-h-[calc(100dvh-9rem)] overflow-y-auto pr-2">
            {filterBody}
          </div>
        </aside>

        {open && (
          <div className="animate-fade-in fixed inset-0 z-90 overflow-y-auto bg-paper lg:hidden">
            <div className="flex items-center justify-between rounded-t-xl border-b border-ink-200 bg-paper px-4 py-3">
              <span className="font-display text-2xl">Filtros</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar filtros"
                className="grid size-9 place-items-center rounded-full border border-ink-200 text-ink transition-colors hover:border-ember-600 hover:text-ember-600"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="px-4 py-5">
              {filterBody}
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

        <div className="min-w-0">
          <CatalogResults total={total} />
        </div>
      </div>
    </div>
  );
}

/** Marcador para el grid: el servidor ya renderizó los productos debajo. */
function CatalogResults({ total }: { total: number }) {
  return (
    <p className="sr-only" role="status">
      {total} resultados
    </p>
  );
}
