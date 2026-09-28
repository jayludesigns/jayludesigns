"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  Check,
  Copy,
  Loader2,
  Lock,
  MapPin,
  Package,
  ShieldCheck,
  User,
} from "lucide-react";
import { useCart } from "@/components/cart/CartContext";
import { EmptyState } from "@/components/shop/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { PriceDisplay } from "@/components/currency/PriceDisplay";
import { submitOrder, idleState, type FormState } from "@/lib/actions/store";
import { cn, formatVes, round2 } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/types";

interface PaymentDetails {
  bank_name: string;
  bank_account_type: string;
  bank_account_number: string;
  bank_account_name: string;
  pago_movil_phone: string;
  zelle_name: string;
  zelle_phone: string;
  binance_email: string;
  binance_pay_id: string;
}

const METHODS: { value: PaymentMethod; hint: string }[] = [
  { value: "pago_movil", hint: "Transferencia inmediata desde tu banco." },
  { value: "zelle", hint: "Para compras desde el exterior o personas en USA." },
  { value: "transferencia", hint: "Transferencia bancaria nacional." },
  { value: "binance", hint: "Paga con saldo de Binance Pay." },
  { value: "efectivo", hint: "Pagas al recoger en Caracas." },
  { value: "otro", hint: "Lo coordinamos por WhatsApp." },
];

export function CheckoutClient({
  couponCode,
  payments,
  shippingFlat,
  freeOver,
  whatsapp,
}: {
  couponCode: string;
  payments: PaymentDetails;
  shippingFlat: number;
  freeOver: number;
  whatsapp: string;
}) {
  const { items, subtotal, clear } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const [state, formAction, pending] = useActionState<FormState, FormData>(submitOrder, idleState);
  const [method, setMethod] = useState<PaymentMethod>("pago_movil");
  const [copied, setCopied] = useState(false);

  const lines = useMemo(
    () =>
      items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    [items],
  );

  // Si el pedido se registró, limpiamos el carrito y llevamos a la confirmación.
  useEffect(() => {
    if (state.status === "ok" && state.orderNumber) {
      clear();
      for (const warning of state.warnings ?? []) {
        toast(warning, { tone: "info" });
      }
      router.push(
        `/pedido/${state.orderNumber}${state.token ? `?t=${state.token}` : ""}`,
      );
    }
  }, [state, clear, router, toast]);

  const shipping = freeOver > 0 && subtotal >= freeOver ? 0 : shippingFlat;
  const total = round2(subtotal + shipping);

  if (items.length === 0 && state.status !== "ok") {
    return (
      <EmptyState
        icon={Package}
        title="No hay nada que cobrar"
        description="Tu carrito está vacío. Agrega algo del catálogo o pídelo a medida."
        actions={
          <>
            <Link href="/catalogo" className="btn btn-solid btn-lg">
              Ver catálogo
            </Link>
            <Link href="/diseno-a-medida" className="btn btn-lg">
              Diseño a medida
            </Link>
          </>
        }
      />
    );
  }

  const errorFor = (key: string) => state.fields?.[key];

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <input type="hidden" name="couponCode" value={couponCode} />
      <input type="hidden" name="paymentMethod" value={method} />

      <div className="space-y-8">
        {/* ---------- Datos ---------- */}
        <section>
          <h2 className="mb-4 flex items-center gap-2.5 border-b border-ink-200 pb-3 font-display text-2xl">
            <span className="grid size-8 place-items-center rounded-full bg-ember-50 text-ember-600">
              <User className="size-4" strokeWidth={2} />
            </span>
            Quién recibe
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="customerName"
              label="Nombre y apellido"
              required
              autoComplete="name"
              error={errorFor("customerName")}
              className="sm:col-span-2"
            />
            <Field
              name="customerPhone"
              label="Teléfono o WhatsApp"
              required
              type="tel"
              autoComplete="tel"
              placeholder="0412-1234567"
              error={errorFor("customerPhone")}
            />
            <Field
              name="customerEmail"
              label="Correo (opcional)"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              error={errorFor("customerEmail")}
              hint="Si lo dejas, puedes rastrear el pedido con el número."
            />
          </div>
        </section>

        {/* ---------- Dirección ---------- */}
        <section>
          <h2 className="mb-4 flex items-center gap-2.5 border-b border-ink-200 pb-3 font-display text-2xl">
            <span className="grid size-8 place-items-center rounded-full bg-ember-50 text-ember-600">
              <MapPin className="size-4" strokeWidth={2} />
            </span>
            Dirección de entrega
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="address"
              label="Dirección"
              required
              autoComplete="street-address"
              placeholder="Calle, número, referencia"
              error={errorFor("address")}
              className="sm:col-span-2"
            />
            <Field
              name="city"
              label="Ciudad"
              required
              autoComplete="address-level2"
              error={errorFor("city")}
            />
            <Field
              name="state"
              label="Estado"
              required
              autoComplete="address-level1"
              error={errorFor("state")}
            />
            <Field name="zip" label="Código postal (opcional)" autoComplete="postal-code" />
            <Field
              name="notes"
              label="Indicaciones para la entrega (opcional)"
              placeholder="Punto de referencia, horario, persona que recibe…"
              error={errorFor("notes")}
              className="sm:col-span-2"
            />
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-ink-500">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
            Si prefieres recoger en Caracas, escríbenos por WhatsApp después de
            confirmar y cambiamos la entrega.
          </p>
        </section>

        {/* ---------- Pago ---------- */}
        <section>
          <h2 className="mb-4 flex items-center gap-2.5 border-b border-ink-200 pb-3 font-display text-2xl">
            <span className="grid size-8 place-items-center rounded-full bg-ember-50 text-ember-600">
              <Banknote className="size-4" strokeWidth={2} />
            </span>
            Cómo quieres pagar
          </h2>
          <p className="mb-4 text-sm text-ink-600">
            Registramos el pedido primero y te enviamos los datos para pagar. El
            pedido queda reservado mientras confirmas.
          </p>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {METHODS.map((option) => {
              const active = method === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMethod(option.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-200",
                    active
                      ? "border-ember-600 bg-ember-50 shadow-sm"
                      : "border-ink-200 hover:border-ink-300 hover:bg-ink-50",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2 transition-colors",
                      active ? "border-ember-600" : "border-ink-300",
                    )}
                  >
                    {active && <span className="size-2 rounded-full bg-ember-600" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{PAYMENT_METHOD_LABELS[option.value] ?? option.value}</span>
                    <span className="mt-0.5 block text-xs text-ink-500">{option.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <PaymentInstructions method={method} payments={payments} onCopied={setCopied} copied={copied} />

          <div className="mt-4">
            <Field
              name="paymentRef"
              label="Referencia del pago (opcional)"
              placeholder="Si ya pagaste, escribe la referencia para adelantar"
            />
          </div>
        </section>

        {state.status === "error" && state.message && (
          <p
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-ember-600 bg-ember-50 p-4 text-sm font-bold text-ember-900"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-ember-600" />
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || items.length === 0}
          className="btn btn-solid btn-lg w-full py-4 text-base sm:w-auto sm:px-12"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Registrando pedido…
            </>
          ) : (
            <>
              <Lock className="size-4" />
              Confirmar pedido · {formatVes(total)}
            </>
          )}
        </button>
        <p className="text-xs text-ink-500">
          Al confirmar aceptas que te contactemos por WhatsApp o correo para
          coordinar la entrega. No se cobra nada todavía.
        </p>
      </div>

      {/* ---------- Resumen ---------- */}
      <aside className="lg:sticky lg:top-32 lg:self-start">
        <div className="card overflow-hidden">
          <p className="bg-ink-950 px-4 py-3 font-mono text-[0.62rem] font-bold tracking-[0.18em] text-paper uppercase">
            Tu pedido
          </p>

          <ul className="divide-y divide-ink-100">
            {items.map((item) => (
              <li key={item.key} className="flex gap-3 p-3">
                <span className="w-16 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="aspect-square w-full object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{item.name}</span>
                  <span className="block font-mono text-[0.6rem] text-ink-500">
                    {item.variantLabel} · {item.quantity} × {formatVes(item.unitPrice)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular">
                  {formatVes(round2(item.unitPrice * item.quantity))}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-ink-100 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-600">Subtotal</span>
              <span className="font-semibold tabular">{formatVes(subtotal)}</span>
            </div>
            {couponCode && (
              <div className="flex justify-between">
                <span className="text-ink-600">Cupón</span>
                <span className="rounded-full bg-ember-50 px-2 py-0.5 font-mono font-bold text-ember-700">
                  {couponCode}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-600">Envío</span>
              <span className="font-semibold tabular">
                {shipping === 0 ? "Gratis" : formatVes(shipping)}
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-ink-100 pt-3">
              <span className="font-bold">Total</span>
              <PriceDisplay
                ves={total}
                size="lg"
                align="right"
                showRate
                className="text-ember-600"
              />
            </div>
          </div>

          <div className="space-y-1.5 border-t border-ink-100 p-4 text-xs leading-relaxed text-ink-600">
            <p className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-ember-600" strokeWidth={2.5} />
              Muestra digital antes de imprimir, sin costo.
            </p>
            <p className="flex items-start gap-2">
              <Check className="mt-0.5 size-3.5 shrink-0 text-ember-600" strokeWidth={2.5} />
              Cambios de talla sin costo si el pedido aún no entra en producción.
            </p>
          </div>
        </div>

        {whatsapp && (
          <a
            href={`https://wa.me/58${whatsapp.replace(/\D/g, "").replace(/^58/, "")}`}
            target="_blank"
            rel="noreferrer noopener"
            className="btn mt-3 w-full"
          >
            ¿Dudas antes de confirmar?
          </a>
        )}
      </aside>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Piezas                                                             */
/* ------------------------------------------------------------------ */

function Field({
  name,
  label,
  hint,
  error,
  className,
  ...rest
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={cn("field", error && "border-ember-600 bg-ember-50")}
        {...rest}
      />
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs font-bold text-ember-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function PaymentInstructions({
  method,
  payments,
  copied,
  onCopied,
}: {
  method: PaymentMethod;
  payments: PaymentDetails;
  copied: boolean;
  onCopied: (value: boolean) => void;
}) {
  const data: { label: string; value: string }[] = [];

  if (method === "pago_movil") {
    if (payments.pago_movil_phone) data.push({ label: "Teléfono", value: payments.pago_movil_phone });
    if (payments.bank_name) data.push({ label: "Banco", value: payments.bank_name });
    if (payments.bank_account_type)
      data.push({ label: "Tipo", value: payments.bank_account_type });
    if (payments.bank_account_number)
      data.push({ label: "Número", value: payments.bank_account_number });
    if (payments.bank_account_name)
      data.push({ label: "Titular", value: payments.bank_account_name });
  } else if (method === "zelle") {
    if (payments.zelle_name) data.push({ label: "Nombre", value: payments.zelle_name });
    if (payments.zelle_phone) data.push({ label: "Teléfono", value: payments.zelle_phone });
  } else if (method === "transferencia") {
    if (payments.bank_name) data.push({ label: "Banco", value: payments.bank_name });
    if (payments.bank_account_number)
      data.push({ label: "Cuenta", value: payments.bank_account_number });
    if (payments.bank_account_name)
      data.push({ label: "Titular", value: payments.bank_account_name });
  } else if (method === "binance") {
    if (payments.binance_email) data.push({ label: "Correo", value: payments.binance_email });
    if (payments.binance_pay_id) data.push({ label: "Pay ID", value: payments.binance_pay_id });
  }

  if (data.length === 0) {
    return (
      <p className="mt-4 rounded-xl bg-ink-50 p-3.5 text-xs text-ink-600">
        Los datos de pago se envían por WhatsApp al confirmar el pedido.
      </p>
    );
  }

  const copyAll = () => {
    navigator.clipboard
      ?.writeText(data.map((row) => `${row.label}: ${row.value}`).join("\n"))
      .then(() => {
        onCopied(true);
        window.setTimeout(() => onCopied(false), 1800);
      })
      .catch(() => undefined);
  };

  return (
    <div className="card mt-4 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-ink-100 bg-ember-50 px-3.5 py-2.5">
        <span className="font-mono text-[0.6rem] font-bold tracking-[0.14em] text-ember-700 uppercase">
          Datos para pagar
        </span>
        <button
          type="button"
          onClick={copyAll}
          className="flex items-center gap-1.5 font-mono text-[0.6rem] font-bold uppercase text-ember-700 transition-colors hover:text-ember-900"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <dl className="divide-y divide-ink-100 text-sm">
        {data.map((row) => (
          <div key={row.label} className="flex justify-between gap-3 px-3.5 py-2.5">
            <dt className="font-mono text-[0.65rem] tracking-wider text-ink-500 uppercase">
              {row.label}
            </dt>
            <dd className="break-all text-right font-mono text-xs font-bold">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
