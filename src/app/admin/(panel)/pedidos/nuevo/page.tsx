import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import {
  ManualOrderForm,
  type ManualProduct,
} from "@/components/admin/ManualOrderForm";
import { getAllProducts } from "@/lib/data/catalog";
import { getStoreSettings } from "@/lib/db";
import { getBackend } from "@/lib/db";
import type { Product, Variant } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewManualOrderPage() {
  const [all, backend, settings] = await Promise.all([
    getAllProducts(),
    Promise.resolve(getBackend()),
    getStoreSettings(),
  ]);

  const variants = await backend.list<Variant>("variants", {
    where: [{ column: "is_active", op: "eq", value: true }],
  });

  // Solo entra al pedido manual lo que está visible en la tienda: `createOrder`
  // rechaza lo que no esté activo, así que no tiene sentido ofrecerlo.
  const products: ManualProduct[] = all
    .filter((product: Product) => product.is_active && !product.is_custom_only)
    .map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price_ves: product.base_price_ves,
      variants: variants
        .filter((variant) => variant.product_id === product.id)
        .map((variant) => ({
          id: variant.id,
          label: `${variant.size ?? "Única"} / ${variant.color ?? "—"}`,
          available: Math.max(0, variant.stock - variant.reserved_stock),
        })),
    }));

  return (
    <>
      <div className="mb-5">
        <Link href="/admin/pedidos" className="btn btn-sm">
          <ChevronLeft className="size-3.5" />
          Volver a pedidos
        </Link>
      </div>

      <header className="mb-6 border-b border-ink-200 pb-4">
        <h1 className="font-display text-4xl leading-none">Pedido manual</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-600">
          Para ventas en el taller, pedidos por teléfono o encargos de uniformes
          que no pasaron por la web. El cliente recibe el mismo enlace de
          rastreo que en el checkout.
        </p>
      </header>

      <div className="max-w-5xl">
        <ManualOrderForm products={products} rate={settings.bcv_rate} />
      </div>
    </>
  );
}
