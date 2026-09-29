import { Building2, CreditCard, Info, RefreshCw, Save, Store, Wallet } from "lucide-react";

import { ActionForm } from "@/components/admin/ActionForm";
import { PageHeader } from "@/components/admin/AdminUI";
import { Pill } from "@/components/admin/Pill";
import { CheckField, TextAreaField, TextField } from "@/components/admin/Fields";
import { refreshRateAction, saveSettingsAction } from "@/app/admin/actions";
import { adminCredentials } from "@/lib/auth";
import { getStoreSettings, isSupabaseConfigured } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";
import { formatDateTime, formatVes } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Ajustes de la tienda.
 *
 * Casi todo lo que se ve en la web sale de aquí: nombre, datos de contacto,
 * reglas de envío, cuentas para cobrar y la tasa del BCV. Cada sección es una
 * acción aparte para que un cambio a medias no pise lo demás: cada formulario
 * manda todos los campos, así que se guardan en bloque.
 */
export default async function AdminSettingsPage() {
  const [settings, supabase, siteUrl] = await Promise.all([
    getStoreSettings(),
    Promise.resolve(isSupabaseConfigured()),
    getSiteUrl(),
  ]);
  const credentials = adminCredentials();
  const rate = settings.bcv_rate;
  const manual = settings.bcv_eur_manual_rate;

  return (
    <>
      <PageHeader
        title="Ajustes"
        description="Los datos que se usan en la tienda, en el checkout y en las facturas. Lo que se guarde aquí se refleja en toda la web al momento."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {/* ---------- Identidad ---------- */}
        <ActionForm
          action={saveSettingsAction}
          submitLabel="Guardar identidad"
          submitIcon={<Save className="size-4" />}
          submitClassName="btn btn-sm btn-solid mt-4"
          className="card p-4"
        >
          <h2 className="flex items-center gap-2 border-b border-ink-200 pb-2.5 font-mono text-[0.67rem] font-bold tracking-[0.16em] uppercase">
            <Store className="size-3.5" />
            Identidad
          </h2>

          <div className="mt-3 space-y-3">
            <TextField name="store_name" label="Nombre" value={settings.store_name} required />
            <TextField
              name="tagline"
              label="Bajada"
              value={settings.tagline}
              hint="Va bajo el logo en la portada y en el título por defecto de las páginas."
            />
            <TextAreaField
              name="description"
              label="Descripción"
              rows={3}
              value={settings.description}
              hint="Se usa como metadescripción y en la parte inferior del checkout."
            />
            <TextField
              name="currency_symbol"
              label="Símbolo de moneda"
              value={settings.currency_symbol}
              inputClassName="font-mono"
            />
          </div>
        </ActionForm>

        {/* ---------- Contacto ---------- */}
        <ActionForm
          action={saveSettingsAction}
          submitLabel="Guardar contacto"
          submitIcon={<Save className="size-4" />}
          submitClassName="btn btn-sm btn-solid mt-4"
          className="card p-4"
        >
          <h2 className="flex items-center gap-2 border-b border-ink-200 pb-2.5 font-mono text-[0.67rem] font-bold tracking-[0.16em] uppercase">
            <Building2 className="size-3.5" />
            Contacto
          </h2>

          <div className="mt-3 space-y-3">
            <TextField name="email" label="Correo" type="email" value={settings.email} />
            <div className="grid grid-cols-2 gap-3">
              <TextField name="phone" label="Teléfono" value={settings.phone} inputMode="tel" />
              <TextField
                name="whatsapp"
                label="WhatsApp"
                value={settings.whatsapp}
                inputMode="tel"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextField name="instagram" label="Instagram" value={settings.instagram} />
              <TextField name="tiktok" label="TikTok" value={settings.tiktok} />
            </div>
            <TextAreaField name="address" label="Dirección" rows={2} value={settings.address} />
          </div>
        </ActionForm>

        {/* ---------- Envío ---------- */}
        <ActionForm
          action={saveSettingsAction}
          submitLabel="Guardar envío"
          submitIcon={<Save className="size-4" />}
          submitClassName="btn btn-sm btn-solid mt-4"
          className="card p-4"
        >
          <h2 className="flex items-center gap-2 border-b border-ink-200 pb-2.5 font-mono text-[0.67rem] font-bold tracking-[0.16em] uppercase">
            <Wallet className="size-3.5" />
            Envío
          </h2>

          <div className="mt-3 space-y-3">
            <TextField
              name="shipping_flat_ves"
              label="Envío fijo (Bs)"
              type="number"
              value={settings.shipping_flat_ves}
              hint="Lo que se suma al total en el checkout."
            />
            <TextField
              name="free_shipping_over_ves"
              label="Envío gratis desde (Bs)"
              type="number"
              value={settings.free_shipping_over_ves}
              hint="Cero si no quieres el umbral."
            />
            <CheckField
              name="online_payments_enabled"
              label="Pasarela de pago en línea"
              defaultChecked={settings.online_payments_enabled}
              hint="Aparece en el checkout, desactivada hasta que haya proveedor."
            />
          </div>
        </ActionForm>

        {/* ---------- BCV ---------- */}
        <div className="card p-4">
          <h2 className="flex items-center gap-2 border-b border-ink-200 pb-2.5 font-mono text-[0.67rem] font-bold tracking-[0.16em] uppercase">
            <RefreshCw className="size-3.5" />
            Tasa del BCV
          </h2>

          <dl className="mt-3 space-y-2 text-sm">
            {[
              ["Tasa en uso", formatVes(rate, "Bs/€", false)],
              [
                "Origen",
                settings.bcv_source === "bcv"
                  ? "automática (BCV)"
                  : settings.bcv_source === "env"
                    ? "variable de entorno"
                    : "manual",
              ],
              [
                "Actualizada",
                settings.bcv_updated_at
                  ? formatDateTime(settings.bcv_updated_at)
                  : "nunca",
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-ink-600">{label}</dt>
                <dd className="font-mono text-xs font-bold">{value}</dd>
              </div>
            ))}
          </dl>

          {settings.bcv_stale && (
            <p className="mt-3 rounded-xl border-2 border-ink-300 bg-ink-50 p-2.5 text-xs font-bold">
              La tasa automática tiene más de 6 horas. Los precios en euros
              pueden estar desfasados.
            </p>
          )}

          <ActionForm
            action={refreshRateAction}
            submitLabel="Actualizar ahora"
            submitIcon={<RefreshCw className="size-4" />}
            submitClassName="btn btn-sm w-full mt-4"
          />

          <div className="mt-4 border-t border-ink-200 pt-4">
            <ActionForm
              action={saveSettingsAction}
              submitLabel="Guardar tasa manual"
              submitIcon={<Save className="size-4" />}
              submitClassName="btn btn-sm w-full mt-3"
            >
              <TextField
                name="bcv_eur_manual_rate"
                label="Tasa manual (Bs por 1 €)"
                type="number"
                value={manual}
                step="0.0001"
                hint="Si la pones, manda sobre la automática hasta que la actualices de nuevo."
                inputClassName="font-mono"
              />
            </ActionForm>
          </div>

          <p className="hint mt-3">
            Los precios en euros de la tienda y del panel se derivan de esta
            tasa. El pedido guarda la que estaba vigente al comprarse.
          </p>
        </div>

        {/* ---------- Cuentas para cobrar ---------- */}
        <div className="card p-4 xl:col-span-2">
          <h2 className="flex items-center gap-2 border-b border-ink-200 pb-2.5 font-mono text-[0.67rem] font-bold tracking-[0.16em] uppercase">
            <CreditCard className="size-3.5" />
            Cuentas para cobrar
          </h2>
          <p className="mt-2 text-xs text-ink-600">
            El checkout muestra estos datos cuando el cliente elige pago
            manual, y los copia al portapapeles con un clic. Si un campo queda
            vacío, ese método no aparece en la lista.
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <ActionForm
              action={saveSettingsAction}
              submitLabel="Guardar banco y pago móvil"
              submitIcon={<Save className="size-4" />}
              submitClassName="btn btn-sm btn-solid mt-4"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <TextField name="bank_name" label="Banco" value={settings.bank_name} />
                  <TextField
                    name="bank_account_type"
                    label="Tipo de cuenta"
                    value={settings.bank_account_type}
                    placeholder="Corriente, ahorro…"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    name="bank_account_number"
                    label="Número"
                    value={settings.bank_account_number}
                    inputClassName="font-mono text-xs"
                  />
                  <TextField
                    name="bank_account_name"
                    label="A nombre de"
                    value={settings.bank_account_name}
                  />
                </div>
                <TextField
                  name="pago_movil_phone"
                  label="Pago móvil (teléfono)"
                  value={settings.pago_movil_phone}
                  inputMode="tel"
                  inputClassName="font-mono text-xs"
                />
              </div>
            </ActionForm>

            <ActionForm
              action={saveSettingsAction}
              submitLabel="Guardar Zelle y Binance"
              submitIcon={<Save className="size-4" />}
              submitClassName="btn btn-sm btn-solid mt-4"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <TextField name="zelle_name" label="Zelle (nombre)" value={settings.zelle_name} />
                  <TextField
                    name="zelle_phone"
                    label="Zelle (teléfono)"
                    value={settings.zelle_phone}
                    inputMode="tel"
                    inputClassName="font-mono text-xs"
                  />
                </div>
                <TextField
                  name="binance_email"
                  label="Binance Pay (correo)"
                  type="email"
                  value={settings.binance_email}
                />
                <TextField
                  name="binance_pay_id"
                  label="Binance Pay ID"
                  value={settings.binance_pay_id}
                  inputClassName="font-mono text-xs"
                />
              </div>
            </ActionForm>
          </div>

          <p className="hint mt-3">
            Métodos conocidos:{" "}
            {Object.values(PAYMENT_METHOD_LABELS).join(" · ")}
          </p>
        </div>

        {/* ---------- Sistema ---------- */}
        <div className="card p-4">
          <h2 className="flex items-center gap-2 border-b border-ink-200 pb-2.5 font-mono text-[0.67rem] font-bold tracking-[0.16em] uppercase">
            <Info className="size-3.5" />
            Sistema
          </h2>

          <dl className="mt-3 space-y-2.5 text-sm">
            {[
              ["Base de datos", supabase ? "Supabase" : "Archivo local (.data/db.json)"],
              ["URL pública", siteUrl],
              ["Correo del panel", credentials.email],
              ["Contraseña configurada", process.env.ADMIN_PASSWORD ? "desde el entorno" : "valor de desarrollo"],
              [
                "Firma de sesión",
                process.env.ADMIN_SESSION_SECRET ? "secret propio" : "derivada de la contraseña",
              ],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 border-b border-ink-100 pb-2">
                <dt className="shrink-0 text-ink-600">{label}</dt>
                <dd className="truncate text-right font-mono text-xs">{value}</dd>
              </div>
            ))}
          </dl>

          {!supabase && (
            <p className="mt-3 rounded-xl border-2 border-ink-300 bg-ink-50 p-2.5 text-xs">
              Estás en modo local: todo se guarda en{" "}
              <code className="font-mono">.data/db.json</code>. Para trabajar en
              varios equipos, configura <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
              <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> y ejecuta{" "}
              <code className="font-mono">supabase/schema.sql</code>.
            </p>
          )}

          <p className="hint mt-3">
            La contraseña y el secreto de firma se cambian por variables de
            entorno, no desde aquí: por eso no hay ningún campo para ellas.
          </p>
        </div>

        {/* ---------- Estado ---------- */}
        <div className="card p-4">
          <h2 className="border-b border-ink-200 pb-2.5 font-mono text-[0.67rem] font-bold tracking-[0.16em] uppercase">
            Estado actual
          </h2>

          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span className="text-ink-600">Almacenamiento</span>
              <Pill tone={supabase ? "solid" : "outline"}>
                {supabase ? "nube" : "local"}
              </Pill>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-ink-600">Pagos en línea</span>
              <Pill tone={settings.online_payments_enabled ? "solid" : "muted"}>
                {settings.online_payments_enabled ? "activos" : "apagados"}
              </Pill>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-ink-600">Tasa BCV</span>
              <Pill tone={settings.bcv_stale ? "outline" : "solid"}>
                {settings.bcv_stale ? "vieja" : "al día"}
              </Pill>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-ink-600">Envío gratis desde</span>
              <span className="font-mono text-xs font-bold">
                {settings.free_shipping_over_ves > 0
                  ? formatVes(settings.free_shipping_over_ves)
                  : "no"}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-ink-600">Coste de envío</span>
              <span className="font-mono text-xs font-bold">
                {formatVes(settings.shipping_flat_ves)}
              </span>
            </li>
          </ul>

          <p className="hint mt-4">
            Los formularios de esta página guardan todos los campos del bloque
            en el que están, no solo los que editaste: por eso conviene
            guardarlos enteros y no una sección a medias.
          </p>
        </div>
      </div>
    </>
  );
}
