"use client";

import { useActionState, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Paperclip, Trash2, TriangleAlert } from "lucide-react";
import { submitDesignRequest, idleState, type FormState } from "@/lib/actions/store";
import { PRINT_TECHNIQUES } from "@/lib/types";
import { cn } from "@/lib/utils";

const SIZES = ["2", "4", "6", "8", "10", "12", "14", "16", "S", "M", "L", "XL", "XXL"];
const COLORS = ["Blanco", "Negro", "Gris", "Azul", "Rojo", "Verde", "Beige", "Rosa"];
const GARMENTS = ["Franela", "Hoodie", "Polo", "Camisa", "Sudadera", "Taza", "Bolso", "Otro"];
const MAX_IMAGES = 4;
const MAX_BYTES = 2_500_000;

/** Aviso para cuando pidan bordado o serigrafía, que aún no ofrecemos. */
const PRODUCT_GARMENTS_NOTE =
  " Bordado y serigrafía entran más adelante; si los necesitas, cuéntanos y te avisamos cuando abramos esa fecha.";

interface Preview {
  name: string;
  url: string;
  bytes: number;
}

/**
 * Solicitud de diseño a medida.
 *
 * Foto de referencia y descripción son las dos opcionales por separado, pero
 * hace falta al menos una de las dos: sin una, no hay nada que cotizar. La
 * validación vive en la server action, no solo aquí, porque el formulario
 * puede enviarse sin JavaScript.
 */
export function CustomDesignForm({ model }: { model?: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    submitDesignRequest,
    idleState,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [tooBig, setTooBig] = useState<string | null>(null);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    setTooBig(null);
    const next: Preview[] = [];
    for (const file of Array.from(list)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_BYTES) {
        setTooBig(`${file.name} pesa ${(file.size / 1_000_000).toFixed(1)} MB. El límite es 2,5 MB por foto.`);
        continue;
      }
      if (previews.length + next.length >= MAX_IMAGES) break;
      next.push({
        name: file.name,
        bytes: file.size,
        url: URL.createObjectURL(file),
      });
    }
    if (next.length) setPreviews((current) => [...current, ...next].slice(0, MAX_IMAGES));
    if (fileInput.current) fileInput.current.value = "";
  };

  const remove = (index: number) => {
    setPreviews((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((_, i) => i !== index);
    });
  };

  if (state.status === "ok") {
    return (
      <div className="card-dark p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-ember-500/15 text-ember-400">
          <Check className="size-7" strokeWidth={2.5} />
        </span>
        <h2 className="mt-5 font-display text-3xl">Recibimos tu idea</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-300">{state.message}</p>
        <p className="mt-5 inline-block rounded-full bg-ember-600 px-5 py-2 font-mono text-xl text-paper">
          {state.designCode}
        </p>
        <p className="mx-auto mt-5 max-w-md text-sm text-ink-300">
          Guarda ese código. Lo revisamos y te escribimos por WhatsApp o correo
          con la cotización y una muestra digital, normalmente en menos de 48
          horas.
        </p>
        <button
          type="button"
          onClick={() => {
            setPreviews([]);
            window.location.reload();
          }}
          className="btn btn-ghost-light mt-6"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  const errorFor = (key: string) => state.fields?.[key];

  return (
    <form action={formAction}>
      {/* Se mandan como data URL en un campo oculto: con el backend local no
          hay almacenamiento de archivos, y así funciona en los dos modos. */}
      <input
        type="hidden"
        name="referenceImages"
        value={JSON.stringify(previews.map((p) => p.url))}
      />
      {model && <input type="hidden" name="name" value={`Personalizado sobre ${model}`} />}

      {/* "Cómo funciona" salió a su propia sección, así que el formulario
          usa todo el ancho: los cuatro bloques van en dos columnas. */}
      <div className="grid items-start gap-8 lg:grid-cols-2">
        {/* ---------- Referencias ---------- */}
        <section>
          <h2 className="mb-2 flex items-center gap-2.5 border-b border-ink-800 pb-3 font-display text-2xl">
            <span className="grid size-8 place-items-center rounded-full bg-ember-500/15 text-ember-400">
              <ImagePlus className="size-4" strokeWidth={2} />
            </span>
            1. Sube tu referencia
            <span className="ml-auto rounded-full bg-ink-800 px-2.5 py-1 font-mono text-[0.62rem] font-normal tracking-wider text-ink-300 uppercase">
              opcional
            </span>
          </h2>
          <p className="mb-4 text-sm text-ink-300">
            Una foto, un dibujo, un logo o una captura de pantalla. Mientras más
            clara, más se parece lo que imprimimos. Hasta {MAX_IMAGES} fotos de
            2,5 MB.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {previews.map((preview, index) => (
              <div key={preview.url} className="card-dark relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.url}
                  alt={`Referencia ${index + 1}: ${preview.name}`}
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Quitar ${preview.name}`}
                  className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-paper/90 text-ink shadow-sm transition-colors hover:bg-ember-600 hover:text-paper"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}

            {previews.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-ink-700 text-ink-300 transition-colors hover:border-ember-400 hover:bg-ember-600/10"
              >
                <span className="flex flex-col items-center gap-1.5 text-ink-400">
                  <Paperclip className="size-5" />
                  <span className="font-mono text-[0.6rem] tracking-wider uppercase">
                    Añadir foto
                  </span>
                </span>
              </button>
            )}
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => onFiles(event.target.files)}
            className="sr-only"
            aria-label="Seleccionar fotos de referencia"
          />

          {tooBig && (
            <p role="alert" className="mt-3 flex items-start gap-2 text-xs font-bold text-ember-400">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              {tooBig}
            </p>
          )}

          {errorFor("description") && (
            <p role="alert" className="mt-3 text-xs font-bold text-ember-400">
              {errorFor("description")}
            </p>
          )}
        </section>

        {/* ---------- Descripción ---------- */}
        <section>
          <h2 className="mb-2 flex items-center gap-2.5 border-b border-ink-800 pb-3 font-display text-2xl">
            <span className="grid size-8 place-items-center rounded-full bg-ember-500/15 text-ember-400">
              <Paperclip className="size-4" strokeWidth={2} />
            </span>
            2. Cuéntanos la idea
            <span className="ml-auto rounded-full bg-ink-800 px-2.5 py-1 font-mono text-[0.62rem] font-normal tracking-wider text-ink-300 uppercase">
              opcional
            </span>
          </h2>
          <p className="mb-4 text-sm text-ink-300">
            Texto, colores, frases, nombres, estilo. Si ya subiste una foto esto
            es para aclarar detalles.
          </p>
          <textarea
            name="description"
            rows={7}
            defaultValue={model ? `Quiero el modelo ${model} pero con mi propio diseño. ` : undefined}
            placeholder="Ejemplo: franela negra, logo de mi equipo de fútbol en el pecho, 3 colores, nombre del grupo debajo."
            className={cn("field resize-y", errorFor("description") && "border-ember-600 bg-ember-50")}
          />
          <p className="mt-2 text-xs text-ink-400">
            Con la foto o con este texto basta para arrancar. Con los dos, mejor.
          </p>
        </section>

        {/* ---------- Detalles ---------- */}
        <section>
          <h2 className="mb-4 border-b border-ink-800 pb-3 font-display text-2xl">
            3. Detalles de la prenda
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="d-name" className="label">
                Nombre del proyecto (opcional)
              </label>
              <input
                id="d-name"
                name="name"
                defaultValue={model ? `Personalizado sobre ${model}` : ""}
                placeholder="Camiseta del equipo, uniforme 5to A…"
                className="field"
              />
            </div>
            <div>
              <label htmlFor="d-quantity" className="label">
                ¿Cuántas necesitas?
              </label>
              <input
                id="d-quantity"
                name="quantity"
                type="number"
                min={1}
                max={10000}
                defaultValue={1}
                className="field font-mono"
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="label">Prenda</p>
            <div className="flex flex-wrap gap-1.5">
              {GARMENTS.map((garment) => (
                <label
                  key={garment}
                  className="cursor-pointer rounded-lg border border-ink-700 px-2.5 py-1.5 font-mono text-[0.67rem] text-ink-200 transition-colors hover:border-ink-400 has-checked:border-ember-600 has-checked:bg-ember-600 has-checked:text-paper"
                >
                  <input
                    type="radio"
                    name="garmentType"
                    value={garment}
                    className="sr-only"
                    defaultChecked={garment === "Franela"}
                  />
                  {garment}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className="label">Tallas que necesitas</legend>
              <div className="flex flex-wrap gap-1.5">
                {SIZES.map((size) => (
                  <label
                    key={size}
                    className="cursor-pointer rounded-lg border border-ink-700 px-2 py-1.5 font-mono text-[0.67rem] text-ink-200 transition-colors hover:border-ink-400 has-checked:border-ember-600 has-checked:bg-ember-600 has-checked:text-paper"
                  >
                    <input type="checkbox" name="sizes" value={size} className="sr-only" />
                    {size}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="label">Colores de la prenda</legend>
              <div className="flex flex-wrap gap-1.5">
                {COLORS.map((color) => (
                  <label
                    key={color}
                    className="cursor-pointer rounded-lg border border-ink-700 px-2 py-1.5 font-mono text-[0.67rem] text-ink-200 transition-colors hover:border-ink-400 has-checked:border-ember-600 has-checked:bg-ember-600 has-checked:text-paper"
                  >
                    <input type="checkbox" name="colors" value={color} className="sr-only" />
                    {color}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="d-style" className="label">
                Estilo del estampado (opcional)
              </label>
              <select id="d-style" name="stylePreference" className="field" defaultValue="">
                <option value="">Sin preferencia</option>
                {PRINT_TECHNIQUES.map((technique) => (
                  <option key={technique.value} value={technique.label}>
                    {technique.label}
                  </option>
                ))}
                <option>No sé, recomiéndame</option>
              </select>
              <p className="mt-1.5 text-xs text-ink-400">
                Hoy trabajamos {PRINT_TECHNIQUES.map((t) => t.label.toLowerCase()).join(" y ")}.
                {PRODUCT_GARMENTS_NOTE}
              </p>
            </div>
            <div>
              <label htmlFor="d-deadline" className="label">
                ¿Para cuándo la necesitas? (opcional)
              </label>
              <input
                id="d-deadline"
                name="deadline"
                type="date"
                className="field"
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
          </div>
        </section>

        {/* ---------- Contacto ---------- */}
        <section>
          <h2 className="mb-4 border-b border-ink-800 pb-3 font-display text-2xl">4. ¿Cómo te escribimos?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="d-cname" className="label">
                Nombre
              </label>
              <input
                id="d-cname"
                name="contactName"
                required
                autoComplete="name"
                className={cn("field", errorFor("contactName") && "border-ember-600 bg-ember-50")}
                placeholder="Tu nombre"
              />
              {errorFor("contactName") && (
                <p role="alert" className="mt-1 text-xs font-bold text-ember-400">
                  {errorFor("contactName")}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="d-phone" className="label">
                Teléfono o WhatsApp
              </label>
              <input
                id="d-phone"
                name="contactPhone"
                type="tel"
                autoComplete="tel"
                className="field"
                placeholder="0412-1234567"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="d-cemail" className="label">
                Correo (opcional)
              </label>
              <input
                id="d-cemail"
                name="contactEmail"
                type="email"
                autoComplete="email"
                className={cn("field", errorFor("contactEmail") && "border-ember-600 bg-ember-50")}
                placeholder="tu@correo.com"
              />
              {errorFor("contactEmail") && (
                <p role="alert" className="mt-1 text-xs font-bold text-ember-400">
                  {errorFor("contactEmail")}
                </p>
              )}
            </div>
          </div>
        </section>

      </div>

      <div className="mt-10 space-y-3">
        {state.status === "error" && state.message && (
          <p
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-ember-500/40 bg-ember-600/15 p-4 text-sm font-bold text-ember-300"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-ember-400" />
            {state.message}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn btn-solid btn-lg w-full py-4 text-base">
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Enviando…
            </>
          ) : (
            "Enviar mi solicitud"
          )}
        </button>
        <p className="text-center text-xs text-ink-400">
          Sin compromiso. Cotizamos gratis y solo imprime si apruebas la muestra.
        </p>
        <p className="hint text-center">
          Las fotos que subes son material de referencia del taller. No las
          usamos en el catálogo ni las compartimos.
        </p>
      </div>
    </form>
  );
}
