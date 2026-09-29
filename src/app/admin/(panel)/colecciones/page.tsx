import Link from "next/link";
import { Eye, Trash2 } from "lucide-react";

import { ActionForm, FormSubmit } from "@/components/admin/ActionForm";
import { Card, PageHeader } from "@/components/admin/AdminUI";
import { Pill } from "@/components/admin/Pill";
import { SelectField, TextAreaField, TextField } from "@/components/admin/Fields";
import {
  deleteCollectionAction,
  saveCategoryAction,
  saveCollectionAction,
} from "@/app/admin/actions";
import { getCategories, getCollections } from "@/lib/data/catalog";
import type { Collection, CollectionTheme } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const THEMES: { value: CollectionTheme; label: string }[] = [
  { value: "anime", label: "Anime" },
  { value: "fantasia", label: "Fantasía" },
  { value: "videojuegos", label: "Videojuegos" },
  { value: "streetwear", label: "Streetwear" },
  { value: "minimal", label: "Minimal" },
  { value: "uniformes", label: "Uniformes" },
  { value: "temporada", label: "Temporada" },
  { value: "colaboracion", label: "Colaboración" },
  { value: "otro", label: "Otro" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Borrador" },
  { value: "published", label: "Publicada" },
  { value: "archived", label: "Archivada" },
];

const STATUS_PILL: Record<string, "solid" | "outline" | "muted"> = {
  published: "solid",
  draft: "outline",
  archived: "muted",
};

export default async function AdminCollectionsPage() {
  const [collections, categories] = await Promise.all([
    getCollections(true),
    getCategories(false),
  ]);

  return (
    <>
      <PageHeader
        title="Colecciones"
        description="Las colecciones agrupan productos y son donde se aplican las promociones por catálogo. El orden de aquí es el de la portada."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="space-y-4">
          {collections.length === 0 && (
            <Card title="Sin colecciones">
              <p className="text-sm text-ink-600">
                Crea la primera con el formulario de la derecha.
              </p>
            </Card>
          )}

          {collections.map((collection) => (
            <CollectionEditor key={collection.id} collection={collection} />
          ))}
        </div>

        <aside className="space-y-4">
          <Card title="Nueva colección">
            <ActionForm action={saveCollectionAction} submitLabel="Crear colección" submitClassName="btn btn-sm btn-solid w-full">
              <div className="space-y-3">
                <TextField name="name" label="Nombre" required placeholder="Drop de invierno 2026" />
                <TextField
                  name="tagline"
                  label="Bajada"
                  placeholder="Una línea que enganche"
                />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField name="status" label="Estado" value="draft" options={STATUS_OPTIONS} />
                  <SelectField name="theme" label="Tema" value="otro" options={THEMES} />
                </div>
                <TextAreaField
                  name="description"
                  label="Descripción"
                  rows={3}
                  placeholder="De qué va la colección."
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextField name="starts_at" label="Empieza" type="date" />
                  <TextField name="ends_at" label="Termina" type="date" />
                </div>
                <TextField
                  name="banner_url"
                  label="Imagen de portada"
                  placeholder="/demo/collections/…"
                />
                <TextField
                  name="sort_order"
                  label="Orden"
                  type="number"
                  value={0}
                  hint="Menor número, más arriba."
                />
              </div>
            </ActionForm>
          </Card>

          <Card title={`Categorías (${categories.length})`} hint="Las que organizan el catálogo.">
            <ul className="mb-4 space-y-2">
              {categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">{category.name}</span>
                  <Pill tone={category.is_active ? "solid" : "muted"}>
                    {category.is_active ? "activa" : "oculta"}
                  </Pill>
                </li>
              ))}
            </ul>

            <ActionForm action={saveCategoryAction} submitLabel="Añadir categoría" submitClassName="btn btn-sm w-full">
              <div className="space-y-2">
                <TextField name="name" label="Nombre" required placeholder="Hoodies" />
                <TextField name="hero_url" label="Imagen" placeholder="/demo/categories/…" />
                <TextField name="sort_order" label="Orden" type="number" value={0} />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked
                    className="size-4 accent-[#6b201a]"
                  />
                  Activa
                </label>
              </div>
            </ActionForm>
          </Card>
        </aside>
      </div>
    </>
  );
}

function CollectionEditor({ collection }: { collection: Collection }) {
  return (
    <Card
      className="scroll-mt-20"
      title={collection.name}
      hint={`/colecciones/${collection.slug}`}
      action={
        <div className="flex items-center gap-2">
          <Pill tone={STATUS_PILL[collection.status] ?? "plain"}>{collection.status}</Pill>
          <Link
            href={`/colecciones/${collection.slug}`}
            target="_blank"
            className="btn btn-sm"
          >
            <Eye className="size-3.5" />
            Ver
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <ActionForm action={saveCollectionAction} hiddenFields={{ id: collection.id }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField name="name" label="Nombre" value={collection.name} required />
            <TextField name="tagline" label="Bajada" value={collection.tagline} />
            <TextField
              name="slug"
              label="Slug"
              value={collection.slug}
              inputClassName="font-mono text-xs"
            />
            <SelectField
              name="status"
              label="Estado"
              value={collection.status}
              options={STATUS_OPTIONS}
            />
            <SelectField
              name="theme"
              label="Tema"
              value={collection.theme}
              options={THEMES}
            />
            <TextField
              name="sort_order"
              label="Orden"
              type="number"
              value={collection.sort_order}
            />
            <TextField
              name="starts_at"
              label="Empieza"
              type="date"
              value={collection.starts_at?.slice(0, 10)}
            />
            <TextField
              name="ends_at"
              label="Termina"
              type="date"
              value={collection.ends_at?.slice(0, 10)}
            />
            <TextField
              name="banner_url"
              label="Imagen"
              value={collection.banner_url}
              className="sm:col-span-2"
            />
            <TextAreaField
              name="description"
              label="Descripción"
              value={collection.description}
              rows={3}
              className="sm:col-span-2"
            />
            <TextField
              name="seo_title"
              label="Título SEO"
              value={collection.seo_title}
              className="sm:col-span-2"
            />
            <TextAreaField
              name="seo_description"
              label="Descripción SEO"
              value={collection.seo_description}
              rows={2}
              className="sm:col-span-2"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="submit" className="btn btn-sm btn-solid">
              Guardar
            </button>
            <Link href={`/admin/promociones?coleccion=${collection.id}`} className="btn btn-sm">
              Promocionar
            </Link>
            <span className="ml-auto">
              <FormSubmit
                formId={`delete-col-${collection.id}`}
                confirm={`Se elimina la colección "${collection.name}". Los productos quedan sin colección.`}
              >
                <Trash2 className="size-3.5" />
                Eliminar
              </FormSubmit>
            </span>
          </div>
        </ActionForm>

        <div className="space-y-2 text-sm">
          {collection.banner_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={collection.banner_url}
              alt=""
              className="aspect-[3/2] w-full rounded-xl border border-ink-200 object-cover"
            />
          )}
          <dl className="space-y-1.5">
            <div className="flex justify-between gap-2">
              <dt className="text-ink-600">Vigencia</dt>
              <dd className="font-mono text-[0.65rem]">
                {collection.starts_at ? formatDate(collection.starts_at) : "siempre"} →{" "}
                {collection.ends_at ? formatDate(collection.ends_at) : "sin fin"}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-ink-500">
            Los productos se asignan a la colección desde la ficha de cada uno.
          </p>
        </div>
      </div>

      {/* El botón "Eliminar" de arriba dispara este form por id. Vive fuera del
          form de guardar: un <form> no puede anidarse dentro de otro <form>. */}
      <ActionForm
        id={`delete-col-${collection.id}`}
        action={deleteCollectionAction}
        hiddenFields={{ id: collection.id }}
      />
    </Card>
  );
}
