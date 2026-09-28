import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { Card, Empty, FilterInput, FilterSelect, Filters, PageHeader } from "@/components/admin/AdminUI";
import { Pill } from "@/components/admin/Pill";
import { getAllProducts, getCategories, getCollections } from "@/lib/data/catalog";
import { getBackend } from "@/lib/db";
import type { ProductImage, Variant } from "@/lib/types";
import { formatVes } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminProductsPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const one = (key: string) => {
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  };

  const term = one("q").toLowerCase();
  const category = one("categoria");
  const collection = one("coleccion");
  const visibility = one("estado");

  const [all, categories, collections] = await Promise.all([
    getAllProducts(),
    getCategories(false),
    getCollections(true),
  ]);

  const backend = getBackend();
  const [images, variants, links] = await Promise.all([
    backend.list<ProductImage>("product_images"),
    backend.list<Variant>("variants"),
    backend.list<{ product_id: string; collection_id: string }>("product_collections"),
  ]);

  const rows = all
    .filter((product) => {
      if (category && product.category_id !== category) return false;
      if (collection) {
        const belongs = links.some(
          (link) => link.product_id === product.id && link.collection_id === collection,
        );
        if (!belongs) return false;
      }
      if (visibility === "activos" && !product.is_active) return false;
      if (visibility === "ocultos" && product.is_active) return false;
      if (visibility === "destacados" && !product.is_featured) return false;
      if (visibility === "sin_stock") {
        const own = variants.filter((v) => v.product_id === product.id && v.is_active);
        if (own.length > 0 && own.some((v) => v.stock > 0)) return false;
      }
      if (term) {
        const haystack = [
          product.name,
          product.subtitle ?? "",
          product.sku ?? "",
          product.slug,
          ...product.tags,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <>
      <PageHeader
        title="Productos"
        description={`${all.length} en el catálogo · ${all.filter((p) => p.is_active).length} visibles en la tienda`}
        actions={
          <Link href="/admin/productos/nuevo" className="btn btn-sm btn-solid">
            <Plus className="size-3.5" />
            Nuevo producto
          </Link>
        }
      />

      <Filters>
        <FilterInput
          name="q"
          label="Buscar"
          value={one("q")}
          placeholder="nombre, SKU, etiqueta"
          className="min-w-52 flex-1"
        />
        <FilterSelect
          name="categoria"
          label="Categoría"
          value={category}
          className="w-44"
          options={[
            { value: "", label: "Todas" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <FilterSelect
          name="coleccion"
          label="Colección"
          value={collection}
          className="w-44"
          options={[
            { value: "", label: "Todas" },
            ...collections.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <FilterSelect
          name="estado"
          label="Estado"
          value={visibility}
          className="w-40"
          options={[
            { value: "", label: "Todos" },
            { value: "activos", label: "Visibles" },
            { value: "ocultos", label: "Ocultos" },
            { value: "destacados", label: "Destacados" },
            { value: "sin_stock", label: "Sin stock" },
          ]}
        />
      </Filters>

      <Card>
        {rows.length === 0 ? (
          <Empty
            title="Ningún producto coincide"
            body="Prueba a quitar filtros o crea uno nuevo."
            action={
              <Link href="/admin/productos/nuevo" className="btn btn-sm btn-solid">
                <Plus className="size-3.5" />
                Nuevo producto
              </Link>
            }
          />
        ) : (
          <div className="-mx-4 -my-4 overflow-x-auto">
            <table className="table-admin w-full min-w-4xl">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th className="text-right">Precio</th>
                  <th className="text-right">Costo</th>
                  <th className="text-center">Stock</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((product) => {
                  const own = variants.filter((v) => v.product_id === product.id);
                  const units = own
                    .filter((v) => v.is_active)
                    .reduce((acc, v) => acc + v.stock, 0);
                  const reserved = own.reduce((acc, v) => acc + v.reserved_stock, 0);
                  const pics = images.filter((i) => i.product_id === product.id).length;
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              images.find((i) => i.product_id === product.id)?.url ??
                              "/demo/categories/franelas.svg"
                            }
                            alt=""
                            className="size-9 shrink-0 border border-ink-200 object-cover"
                          />
                          <div className="min-w-0">
                            <Link
                              href={`/admin/productos/${product.id}`}
                              className="block truncate font-semibold hover:underline"
                            >
                              {product.name}
                            </Link>
                            <span className="font-mono text-[0.6rem] text-ink-500">
                              {categories.find((c) => c.id === product.category_id)?.name ??
                                "Sin categoría"}
                              {" · "}
                              {pics} {pics === 1 ? "imagen" : "imágenes"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs">{product.sku ?? "—"}</td>
                      <td className="text-right font-mono text-xs font-bold tabular">
                        {formatVes(product.base_price_ves)}
                      </td>
                      <td className="text-right font-mono text-xs text-ink-600 tabular">
                        {product.cost_ves > 0 ? formatVes(product.cost_ves) : "—"}
                      </td>
                      <td className="text-center">
                        <span
                          className={`font-mono text-xs font-bold tabular ${
                            units === 0 ? "underline decoration-2" : ""
                          }`}
                        >
                          {own.length === 0 ? "—" : units}
                        </span>
                        {reserved > 0 && (
                          <span className="block font-mono text-[0.55rem] text-ink-500">
                            +{reserved} res.
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <Pill tone={product.is_active ? "solid" : "muted"}>
                            {product.is_active ? "visible" : "oculto"}
                          </Pill>
                          {product.is_featured && <Pill tone="outline">destacado</Pill>}
                          {product.is_custom_only && <Pill tone="outline">a medida</Pill>}
                        </div>
                      </td>
                      <td className="text-right">
                        <Link
                          href={`/admin/productos/${product.id}`}
                          className="btn btn-sm"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {rows.length > 0 && (
        <p className="mt-3 flex items-center gap-2 text-xs text-ink-500">
          <Search className="size-3" />
          {rows.length} de {all.length} productos.
        </p>
      )}
    </>
  );
}
