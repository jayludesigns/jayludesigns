"use client";

import { Printer } from "lucide-react";

/** Botón de impresión: llama a la impresora del sistema. */
export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn btn-sm flex-1"
    >
      <Printer className="size-3" />
      {label}
    </button>
  );
}
