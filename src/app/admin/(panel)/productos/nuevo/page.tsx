import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { ProductForm } from "@/components/admin/ProductForm";
import { getCategories, getCollections } from "@/lib/data/catalog";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, collections] = await Promise.all([
    getCategories(false),
    getCollections(true),
  ]);

  return (
    <>
      <div className="mb-5">
        <Link href="/admin/productos" className="btn btn-sm">
          <ChevronLeft className="size-3.5" />
          Volver a productos
        </Link>
      </div>

      <header className="mb-6 border-b border-ink-200 pb-4">
        <h1 className="font-display text-4xl leading-none">Nuevo producto</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-600">
          Se crea directamente en el catálogo. Las secciones de imágenes y
          variantes se habilitan en cuanto el producto tiene identificador.
        </p>
      </header>

      <div className="max-w-5xl">
        <ProductForm
          product={null}
          categories={categories}
          collections={collections}
          selectedCollectionIds={[]}
          images={[]}
        />
      </div>
    </>
  );
}
