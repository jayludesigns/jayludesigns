import Link from "next/link";
import { ImageOff, Plus } from "lucide-react";

import { ActionForm } from "@/components/admin/ActionForm";
import {
  Card,
  Empty,
  FilterInput,
  FilterSelect,
  Filters,
  PageHeader,
  Stat,
  StatGrid,
} from "@/components/admin/AdminUI";
import { StatePill } from "@/components/admin/Pill";
import { SelectField, TextField } from "@/components/admin/Fields";
import { deleteDesignAction, updateDesignAction } from "@/app/admin/actions";
import { getDesigns, getDesignSummary } from "@/lib/data/designs";
import { DESIGN_STATUS_LABELS, type DesignStatus } from "@/lib/types";
import { formatDate, formatVes, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Search = Promise<Record<string, string | string[] | undefined>>;

const STATUSES: DesignStatus[] = [
  "new",
  "quoting",
  "approved",
  "in_design",
  "production",
  "ready",
  "delivered",
  "rejected",
];

export default async function AdminDesignsPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const one = (key: string) => {
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  };

  const status = (one("estado") || "todos") as DesignStatus | "todos";
  const [designs, summary] = await Promise.all([
    getDesigns({ status, search: one("q") || undefined }),
    getDesignSummary(),
  ]);

  return (
    <>
      <PageHeader
        title="Diseños a medida"
        description="Solicitudes de prendas a cotizar. El cliente puede subir una foto de referencia, describir lo que quiere, o las dos cosas: basta con una de las dos para que la solicitud sea válida."
      />

      <StatGrid cols={5}>
        <Stat label="Total" value={summary.total} />
        <Stat
          label="Nuevas"
          value={summary.new}
          tone={summary.new > 0 ? "alert" : "plain"}
        />
        <Stat label="Cotizando" value={summary.quoting} />
        <Stat
          label="En producción"
          value={summary.inProduction}
        />
        <Stat label="Valor del pipeline" value={formatVes(summary.pipelineValue)} />
      </StatGrid>

      <div className="mt-6">
        <Filters>
          <FilterInput
            name="q"
            label="Buscar"
            value={one("q")}
            placeholder="código, nombre o contacto"
            className="min-w-52 flex-1"
          />
          <FilterSelect
            name="estado"
            label="Estado"
            value={one("estado")}
            className="w-52"
            options={[
              { value: "", label: "Todos" },
              ...STATUSES.map((item) => ({
                value: item,
                label: DESIGN_STATUS_LABELS[item],
              })),
            ]}
          />
        </Filters>
      </div>

      {designs.length === 0 ? (
        <Empty
          title="No hay solicitudes con esos filtros"
          body="Las peticiones de /diseno-a-medida y las de uniformes de grupos o colegios caen aquí."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {designs.map((design) => (
            <Card
              key={design.id}
              className="scroll-mt-20"
              title={design.name ?? "Sin título"}
              hint={`${design.code} · ${relativeTime(design.created_at)}`}
              action={
                <StatePill state={design.status} label={DESIGN_STATUS_LABELS[design.status]} />
              }
            >
              <div className="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)]">
                {/* Referencia */}
                <div>
                  {design.reference_urls.length > 0 ? (
                    <Link
                      href={`/admin/disenos/${design.id}`}
                      className="block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={design.reference_urls[0]}
                        alt="Referencia del cliente"
                        className="aspect-square w-full rounded-xl border border-ink-200 object-cover"
                      />
                      {design.reference_urls.length > 1 && (
                        <p className="mt-1 text-center font-mono text-[0.6rem] text-ink-500">
                          +{design.reference_urls.length - 1} fotos
                        </p>
                      )}
                    </Link>
                  ) : (
                    <div className="grid aspect-square w-full place-items-center border border-dashed border-ink-300 text-ink-400">
                      <ImageOff className="size-5" />
                    </div>
                  )}
                </div>

                {/* Datos */}
                <div className="min-w-0 space-y-2 text-sm">
                  <p className="text-xs leading-relaxed text-ink-700">
                    {design.description ?? (
                      <span className="italic text-ink-500">
                        Sin descripción: el cliente mandó solo la foto.
                      </span>
                    )}
                  </p>

                  <ul className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.62rem] text-ink-600">
                    {design.quantity > 0 && <li>{design.quantity} u</li>}
                    {design.garment_type && <li>{design.garment_type}</li>}
                    {design.sizes.length > 0 && <li>{design.sizes.join(" ")}</li>}
                    {design.deadline && <li>para el {formatDate(design.deadline)}</li>}
                  </ul>

                  <p className="truncate text-xs text-ink-600">
                    {design.contact_name ?? "Sin nombre"}
                    {design.contact_phone && ` · ${design.contact_phone}`}
                  </p>

                  {design.quoted_price_ves !== null && (
                    <p className="font-mono text-sm font-bold">
                      Cotizado: {formatVes(design.quoted_price_ves)}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-ink-200 pt-3">
                <ActionForm
                  action={updateDesignAction}
                  hiddenFields={{ id: design.id }}
                  className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_auto] sm:items-end"
                >
                  <SelectField
                    name="status"
                    label="Estado"
                    value={design.status}
                    options={STATUSES.map((item) => ({
                      value: item,
                      label: DESIGN_STATUS_LABELS[item],
                    }))}
                  />
                  <TextField
                    name="quoted_price_ves"
                    label="Cotización (Bs)"
                    type="number"
                    value={design.quoted_price_ves ?? ""}
                  />
                  <button type="submit" className="btn btn-sm btn-solid">
                    Guardar
                  </button>
                </ActionForm>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Link href={`/admin/disenos/${design.id}`} className="btn btn-sm">
                    Abrir ficha
                  </Link>
                  <ActionForm
                    action={deleteDesignAction}
                    hiddenFields={{ id: design.id }}
                    confirm={`Se elimina la solicitud ${design.code}.`}
                  >
                    <button type="submit" className="font-mono text-[0.6rem] text-ink-500 uppercase hover:text-ink hover:underline">
                      Eliminar
                    </button>
                  </ActionForm>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-ink-500">
        <Plus className="mr-1 inline size-3" />
        Una solicitud con foto y sin texto sigue siendo válida, y al revés: lo
        único que no se acepta es enviarla vacía.
      </p>
    </>
  );
}
