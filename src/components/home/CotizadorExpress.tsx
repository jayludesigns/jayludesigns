"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { SectionHeading } from "@/components/site/SectionHeading";
import { cn, whatsappUrl } from "@/lib/utils";

/** Colores de franela disponibles para el simulador. */
const COLORS = [
  { name: "Blanco", hex: "#ffffff" },
  { name: "Negro", hex: "#000000" },
  { name: "Vino tinto", hex: "#6b201a" },
] as const;

/** Técnicas de estampado de la casa. */
const TECHNIQUES = [
  { id: "dtf", name: "DTF", tagline: "toda tela, todo color" },
  { id: "sublimacion", name: "Sublimación", tagline: "tacto cero, poliéster" },
] as const;

type TechniqueId = (typeof TECHNIQUES)[number]["id"];

/**
 * Ubicaciones del diseño. Los precios son REFERENCIALES (USD) para que el
 * simulador dé al cliente una idea inmediata; la cotización final cerrada
 * llega por WhatsApp con la muestra digital y la tasa del día.
 */
const POSITIONS = [
  { id: "frente", label: "Frente central", price: 14 },
  { id: "pecho", label: "Pecho izquierdo", price: 10 },
  { id: "espalda", label: "Espalda completa", price: 16 },
  { id: "ambos", label: "Frente + espalda", price: 22 },
] as const;

type Position = (typeof POSITIONS)[number];

const VENTAJAS = [
  {
    icon: Truck,
    title: "Envíos nacionales",
    body: "Despachamos a cualquier punto del país con seguimiento.",
  },
  {
    icon: ShieldCheck,
    title: "Garantía real",
    body: "Reemplazamos la prenda si el estampado falla en los primeros lavados.",
  },
  {
    icon: Zap,
    title: "Entrega express",
    body: "Producción rápida para eventos, marcas y pedidos urgentes.",
  },
];

/**
 * Cotizador express de la home: color, técnica, ubicación y cantidad con
 * descuento por volumen. El precio es estimado; el pedido se encarga por
 * WhatsApp. Es una sección interactiva de ejemplo, no el módulo definitivo
 * de cotización con medidas a escala (fase futura).
 */
export function CotizadorExpress({ whatsapp }: { whatsapp: string }) {
  const [color, setColor] = useState<(typeof COLORS)[number]>(COLORS[0]);
  const [technique, setTechnique] = useState<TechniqueId>("dtf");
  const [position, setPosition] = useState<Position>(POSITIONS[0]);
  const [quantity, setQuantity] = useState(1);

  const discount = quantity >= 50 ? 0.2 : quantity >= 12 ? 0.1 : 0;
  const unit = position.price * (1 - discount);
  const total = unit * quantity;
  const isDarkShirt = color.hex !== "#ffffff";

  const sendOrder = () => {
    const message = [
      "Hola JayLu, quiero encargar una franela personalizada:",
      `• Color: ${color.name}`,
      `• Técnica: ${technique === "dtf" ? "DTF" : "Sublimación"}`,
      `• Ubicación del diseño: ${position.label}`,
      `• Cantidad: ${quantity} ${quantity === 1 ? "unidad" : "unidades"}`,
      discount > 0 ? `• Descuento por volumen: −${Math.round(discount * 100)} %` : null,
      `• Total estimado: $${total.toFixed(2)} USD (referencial)`,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n");
    window.open(
      whatsappUrl(whatsapp || "04141234567", message),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-ink-950">
      <div className="glow-ember absolute inset-0 opacity-50" aria-hidden />
      <div className="halftone-light absolute inset-0 opacity-[0.05]" aria-hidden />

      <div className="wrap relative py-16 sm:py-20">
        <SectionHeading
          invert
          eyebrow="Cotizador express"
          title="Cotiza tu franela en segundos"
          description="Elige color, técnica, ubicación del diseño y cantidad: el precio estimado se actualiza al instante y lo encargas directo por WhatsApp."
        />

        <div className="mt-10 grid items-start gap-6 lg:grid-cols-12">
          {/* Controles */}
          <div className="lg:col-span-7">
            <div className="glass-dark space-y-8 rounded-2xl p-6 sm:p-8">
              {/* Color */}
              <fieldset>
                <legend className="mb-3 text-sm font-bold text-paper">Color de la franela</legend>
                <div className="flex items-center gap-4">
                  {COLORS.map((option) => {
                    const active = color.hex === option.hex;
                    return (
                      <button
                        key={option.hex}
                        type="button"
                        onClick={() => setColor(option)}
                        aria-label={`Franela color ${option.name}`}
                        title={option.name}
                        className={cn(
                          "grid size-12 place-items-center rounded-full border-2 transition-all duration-200",
                          option.hex === "#ffffff" && "border-white/20 bg-paper",
                          option.hex === "#000000" && "border-white/20 bg-ink",
                          option.hex === "#6b201a" && "border-ember-500/50 bg-ember-600",
                          active &&
                            "scale-110 border-ember-400 ring-2 ring-ember-400/40 shadow-ember",
                        )}
                      >
                        {active && (
                          <CheckCircle2
                            className={cn(
                              "size-5",
                              option.hex === "#ffffff" ? "text-ink" : "text-paper",
                            )}
                          />
                        )}
                      </button>
                    );
                  })}
                  <span className="text-sm text-white/60">{color.name}</span>
                </div>
              </fieldset>

              {/* Técnica */}
              <fieldset>
                <legend className="mb-3 text-sm font-bold text-paper">Técnica de estampado</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {TECHNIQUES.map((option) => {
                    const active = technique === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setTechnique(option.id)}
                        className={cn(
                          "rounded-xl border p-4 text-left transition-all duration-200",
                          active
                            ? "border-ember-400 bg-white/10 shadow-ember"
                            : "border-white/10 bg-white/[0.03] hover:border-white/25",
                        )}
                      >
                        <span
                          className={cn(
                            "block font-display text-xl",
                            active ? "text-paper" : "text-white/70",
                          )}
                        >
                          {option.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-white/50">{option.tagline}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Ubicación */}
              <fieldset>
                <legend className="mb-3 text-sm font-bold text-paper">Ubicación del diseño</legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {POSITIONS.map((option) => {
                    const active = position.id === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPosition(option)}
                        className={cn(
                          "rounded-xl border px-3 py-3 text-left transition-all duration-200",
                          active
                            ? "border-ember-400 bg-white/10 shadow-ember"
                            : "border-white/10 bg-white/[0.03] hover:border-white/25",
                        )}
                      >
                        <span
                          className={cn(
                            "block text-xs leading-snug font-bold",
                            active ? "text-paper" : "text-white/75",
                          )}
                        >
                          {option.label}
                        </span>
                        <span className="mt-1 block font-mono text-[0.62rem] text-ember-300">
                          ${option.price.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Cantidad */}
              <div>
                <div className="flex items-end justify-between">
                  <span className="text-sm font-bold text-paper">Cantidad</span>
                  <span className="font-display text-3xl leading-none text-ember-300">
                    {quantity}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  aria-label="Cantidad de franelas"
                  className="mt-4 w-full accent-ember-600"
                />
                <div className="mt-2 flex justify-between font-mono text-[0.55rem] tracking-[0.14em] text-white/45 uppercase">
                  <span>1 unidad</span>
                  <span>100 unidades</span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-white/55">
                  Descuento por volumen: −10 % desde 12 unidades, −20 % desde 50.
                  {discount > 0 && (
                    <>
                      {" "}
                      <strong className="text-ember-300">
                        Descuento aplicado: −{Math.round(discount * 100)} %.
                      </strong>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Vista previa + resumen */}
          <div className="lg:col-span-5">
            <div className="shirt-scene rounded-2xl backdrop-blur">
              <div
                className="shirt-card"
                style={{ "--shirt-color": color.hex } as CSSProperties}
              >
                <span className="shirt-sleeve left" aria-hidden />
                <span className="shirt-sleeve right" aria-hidden />
                <span className="shirt-neck" aria-hidden />
                <div className="shirt-design">
                  <div className="flex flex-col items-center gap-1.5 px-2 text-center">
                    <Logo invert={isDarkShirt} className="h-9 w-auto" />
                    <span className="shirt-text text-[0.62rem] tracking-[0.22em] text-ink-700">
                      TU DISEÑO
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-dark mt-6 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between text-sm text-white/60">
                <span>{color.name}</span>
                <span>{technique === "dtf" ? "DTF" : "Sublimación"}</span>
              </div>
              <dl className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/60">Precio por unidad</dt>
                  <dd className="text-paper">
                    ${unit.toFixed(2)}{" "}
                    {discount > 0 && (
                      <span className="text-ember-300 line-through">${position.price.toFixed(2)}</span>
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-white/60">Cantidad</dt>
                  <dd className="font-mono text-paper">× {quantity}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-white/10 pt-4">
                  <dt className="text-lg font-bold text-paper">Total estimado</dt>
                  <dd className="font-display text-3xl text-ember-300">${total.toFixed(2)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-white/45">
                Valor referencial en USD. La cotización cerrada llega con la muestra
                digital y la tasa del día.
              </p>
              <button
                type="button"
                onClick={sendOrder}
                className="btn btn-solid btn-lg mt-6 w-full"
              >
                <ShoppingCart className="size-4" />
                Encargar este diseño
              </button>
            </div>
          </div>
        </div>

        {/* Ventajas */}
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          {VENTAJAS.map((item) => (
            <div key={item.title} className="bg-ink-950 p-5">
              <item.icon className="size-5 text-ember-400" />
              <h3 className="mt-3 text-sm font-bold text-paper">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/55">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}