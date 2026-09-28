"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Rastreo público: los números de pedido son correlativos, así que además del
 * número se pide un dato de contacto del pedido. Con los dos se entra al
 * enlace privado de confirmación.
 */
export function TrackOrderForm({
  knownOrder,
  knownPhone,
}: {
  knownOrder?: string;
  knownPhone?: string;
}) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState(knownOrder ?? "");
  const [phone, setPhone] = useState(knownPhone ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const number = orderNumber.trim().toUpperCase();
    const digits = phone.replace(/\D/g, "");
    if (!number) return setError("Escribe el número de pedido.");
    if (digits.length < 7) return setError("Escribe el teléfono con el que compraste.");

    setPending(true);
    try {
      const response = await fetch("/api/pedidos/rastrear", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber: number, phone }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (data.url) {
        router.push(data.url);
      } else {
        setError(data.error ?? "No encontramos ese pedido con ese teléfono.");
      }
    } catch {
      setError("No pudimos consultar. Revisa tu conexión e inténtalo otra vez.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="orderNumber" className="label">
            Número de pedido
          </label>
          <input
            id="orderNumber"
            name="orderNumber"
            value={orderNumber}
            onChange={(event) => setOrderNumber(event.target.value)}
            placeholder="JLY-2609-0001"
            className="field font-mono uppercase"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="phone" className="label">
            Teléfono del pedido
          </label>
          <input
            id="phone"
            name="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="0412-1234567"
            inputMode="tel"
            className="field"
            autoComplete="tel"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl border-2 border-ink-300 bg-ink-50 p-3 text-sm font-bold">
          {error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-solid btn-lg mt-4 w-full">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
        {pending ? "Buscando…" : "Rastrear mi pedido"}
      </button>
      <p className="mt-2 text-xs text-ink-500">
        El número aparece en la confirmación de compra y en el mensaje de
        WhatsApp que te enviamos.
      </p>
    </form>
  );
}

/** Copia un valor al portapapeles con confirmación visual. */
export function CopyToClipboard({
  value,
  label = "Copiar enlace",
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          ?.writeText(value)
          .then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          })
          .catch(() => undefined);
      }}
      className={cn("btn btn-sm", className)}
    >
      {copied ? "Copiado" : label}
    </button>
  );
}
