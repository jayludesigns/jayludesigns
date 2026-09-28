/**
 * Genera `supabase/seed.sql` a partir de `src/lib/db/seed.ts`.
 *
 * El seed en TypeScript es la fuente de verdad (es el mismo que carga el
 * backend local en `.data/db.json`). Este script lo traduce a sentencias
 * `INSERT` para poder subirlo al editor SQL de Supabase, que no sabe
 * ejecutar TypeScript.
 *
 *   npx tsx scripts/generate-seed-sql.ts
 *
 * Las tablas se cargan en el orden en que las declara `TABLES`, que ya
 * respeta el orden de las claves foráneas: primero las que no dependen de
 * nadie y al final las que las referencian.
 */

import { writeFileSync } from "node:fs";
import path from "node:path";

import { buildSeedData } from "../src/lib/db/seed";
import { TABLES, TABLE_COLUMNS, type TableName } from "../src/lib/db/schema";

/** Columnas que son `text[]` en el esquema de Postgres. */
const ARRAY_COLUMNS = new Set<string>([
  "sizes",
  "colors_txt",
  "tags",
  "frames",
  "reference_urls",
]);

/** Columnas que son `jsonb`. */
const JSON_COLUMNS = new Set<string>(["colors", "bulk_prices", "options", "shipping_address", "meta"]);

/** Columnas de fecha: se castean para no depender del formato de la sesión. */
const TIMESTAMP_COLUMNS = new Set<string>([
  "created_at",
  "updated_at",
  "starts_at",
  "ends_at",
  "deadline",
  "due_at",
  "paid_at",
  "shipped_at",
  "delivered_at",
]);

/** `custom_designs.colors` es `text[]`, pero `products.colors` es `jsonb`. */
const ARRAY_BY_TABLE: Partial<Record<TableName, Set<string>>> = {
  custom_designs: new Set(["sizes", "colors", "reference_urls"]),
};

function isArrayColumn(table: TableName, column: string): boolean {
  if (table === "products") return ARRAY_COLUMNS.has(column) && column !== "colors_txt";
  if (ARRAY_BY_TABLE[table]?.has(column)) return true;
  return ARRAY_COLUMNS.has(column) && column !== "colors_txt";
}

function isJsonColumn(table: TableName, column: string): boolean {
  if (table === "products" && column === "colors") return true;
  if (table === "custom_designs" && column === "colors") return false;
  return JSON_COLUMNS.has(column);
}

/** Comillas de SQL: se duplican las simples y se neutralizan las barras. */
function quote(value: string): string {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

/** Un valor sin tipo de columna: solo se usa dentro de un `array[...]`. */
function scalar(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return quote(value);
  return quote(JSON.stringify(value));
}

function parseStringArray(value: string, table: string, column: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) return parsed.map((item) => String(item));
    throw new Error("no es una lista");
  } catch {
    throw new Error(
      `public.${table}.${column} llegó como texto plano (${value.slice(0, 40)}) y no como lista JSON. ` +
        "Revisa ARRAY_COLUMNS en este script.",
    );
  }
}

function literal(table: TableName, column: string, value: unknown): string {
  if (value === null || value === undefined) return "null";

  // El backend guarda los array en JSON, así que un `text[]` puede venir como
  // lista real o como texto: se aceptan las dos formas.
  if (Array.isArray(value)) {
    if (isJsonColumn(table, column)) return `${quote(JSON.stringify(value))}::jsonb`;
    // `scalar` y no `literal`: cada elemento de la lista es un valor simple y
    // no debe reentrar por la rama de array de la propia columna.
    return `array[${value.map(scalar).join(", ")}]`;
  }

  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);

  if (typeof value === "string") {
    if (isArrayColumn(table, column)) {
      // A veces la lista llega como texto (así la guarda el backend local);
      // en ese caso es JSON y se interpreta, no se parte por comas.
      const items = value.trim() ? parseStringArray(value, table, column).map(quote) : [];
      return `array[${items.join(", ")}]::text[]`;
    }
    if (isJsonColumn(table, column)) return `${quote(value)}::jsonb`;
    if (TIMESTAMP_COLUMNS.has(column)) return `${quote(value)}::timestamptz`;
    return quote(value);
  }

  if (typeof value === "object") return `${quote(JSON.stringify(value))}::jsonb`;

  throw new Error(`No se sabe convertir ${table}.${column} (${typeof value})`);
}

function insertRows(table: TableName, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) {
    return `-- ${table}: sin filas en la demostración, se empieza vacío.`;
  }

  // Solo las columnas que el esquema declara y la fila trae de verdad: así el
  // seed no se rompe si mañana se añade una columna nueva al tipo de dominio.
  const columns = TABLE_COLUMNS[table];
  const present = columns.filter((column) => rows.some((row) => row[column] !== undefined));

  const head =
    `insert into public.${table} (${present.join(", ")}) values\n`;

  const body = rows
    .map((row) => {
      const values = present
        .map((column) => literal(table, column, row[column]))
        .join(", ");
      return `  (${values})`;
    })
    .join(",\n");

  return `${head}${body}\non conflict do nothing;`;
}

/** Descripción de una tabla, para que el archivo se lea sin contexto. */
const COMMENTS: Partial<Record<TableName, string>> = {
  settings: "Ajustes de la tienda (clave `store`) y caché de la tasa del BCV (clave `bcv`).",
  categories: "Franelas, remeras, hoodies, uniformes, etc.",
  collections: "Colecciones publicadas: drops, colaboraciones y uniformes.",
  products: "Catálogo. `colors` es jsonb con [{ name, hex }] y `bulk_prices` la lista de precios por volumen.",
  product_collections: "Un producto puede estar en varias colecciones; el orden lo fija `sort_order`.",
  product_images: "Fotos de producto. `kind` distingue la principal, la galería y los pósters del 360.",
  product_spin360: "Visor 360°: una fila por producto con los fotogramas en orden.",
  promotions: "Descuentos por producto o por colección, en porcentaje o monto fijo.",
  coupons: "Códigos de descuento para el checkout.",
  variants: "Talla × color con su stock. Una fila por combinación.",
  stock_movements: "Libro de movimientos de producto terminado: entra, sale, reserva y ajuste.",
  raw_materials: "Materia prima: tela, tintas, papel de sublimación, film DTF y empaque.",
  material_movements: "Libro de movimientos de materia prima.",
  customers: "Fichas de cliente con su historial de pedidos en el panel.",
  crm_activities: "Notas, llamadas y tareas de seguimiento por cliente.",
  leads: "Contactos que preguntaron pero todavía no compraron.",
  orders: "Pedidos. `total_eur` y `bcv_rate` quedan congelados al confirmar, como la factura.",
  order_items: "Líneas del pedido, con nombre y precio ya resueltos.",
  custom_designs: "Solicitudes de diseño a medida. `reference_urls` apunta al bucket privado `design-references`.",
  reviews: "Reseñas de producto; solo se muestran las aprobadas.",
  activity_log: "Auditoría de lo que se hizo desde el panel.",
};

function main(): void {
  const data = buildSeedData();
  const tables = Object.values(TABLES) as TableName[];

  const header = `-- ============================================================================
--  JayLu · datos de demostración
-- ============================================================================
--
--  Generado con \`npx tsx scripts/generate-seed-sql.ts\` a partir de
--  \`src/lib/db/seed.ts\`, la misma fuente que usa el backend local. Si cambias
--  el seed, vuelve a correr el script: no editar este archivo a mano.
--
--  Cómo se usa
--  -----------
--  1. Ejecuta antes \`supabase/schema.sql\` (este archivo necesita las tablas).
--  2. Pega este contenido en el editor SQL de Supabase y ejecútalo.
--  3. Arranca la app. La tienda debe verse con el catálogo de JayLu.
--
--  Es idempotente: todas las sentencias terminan en \`on conflict do nothing\`, así
--  que se puede volver a cargar sin duplicar nada ni pisar lo que ya se editó
--  desde el panel. Para empezar de cero, borra las filas antes.
--
--  Aviso: las fotos de la demostración son dibujos SVG generados por
--  \`scripts/generate-demo-assets.mjs\`, no photographs. Reemplázalas al subir
--  las reales a los buckets \`product-images\` y \`design-360\`.
-- ============================================================================

begin;

-- Por si el proyecto se acaba de crear y se quiere empezar de verdad vacío:
-- descomenta lo de abajo para dejar solo el catálogo, sin pedidos ni clientes.
--
-- truncate table public.activity_log, public.reviews, public.order_items,
--   public.orders, public.custom_designs, public.material_movements,
--   public.stock_movements, public.leads, public.crm_activities,
--   public.customers, public.raw_materials, public.variants, public.coupons,
--   public.promotions, public.product_spin360, public.product_images,
--   public.product_collections, public.products, public.collections,
--   public.categories
-- restart identity cascade;
`;

  const sections = tables.map((table) => {
    const rows = (data[table] ?? []) as Record<string, unknown>[];
    const note = COMMENTS[table] ? `-- ${COMMENTS[table]}\n` : "";
    return [
      "-- ---------------------------------------------------------------------------",
      `-- ${table}${rows.length ? ` · ${rows.length} fila${rows.length === 1 ? "" : "s"}` : ""}`,
      "-- ---------------------------------------------------------------------------",
      `${note}${insertRows(table, rows)}`,
    ].join("\n");
  });

  const footer = `
commit;

-- ---------------------------------------------------------------------------
--  Verificación
-- ---------------------------------------------------------------------------
--
--  Estas consultas deberían devolver 12 productos, 8 colecciones, 9 pedidos y
--  128 variantes. Si no, algo no se cargó: revisa el mensaje del editor SQL.
--
--   select count(*) from public.products;
--   select count(*) from public.collections;
--   select count(*) from public.orders;
--   select count(*) from public.variants;
--
--  Para arrancar de cero en una instalación de prueba:
--
--   truncate table public.activity_log, public.reviews, public.order_items,
--     public.orders, public.custom_designs, public.material_movements,
--     public.stock_movements, public.leads, public.crm_activities,
--     public.customers, public.raw_materials, public.variants, public.coupons,
--     public.promotions, public.product_spin360, public.product_images,
--     public.product_collections, public.products, public.collections,
--     public.categories
--   restart identity cascade;
`;

  const target = path.join(process.cwd(), "supabase", "seed.sql");
  writeFileSync(target, header + "\n" + sections.join("\n\n") + "\n" + footer, "utf8");

  const total = tables.reduce((acc, t) => acc + ((data[t] ?? []).length as number), 0);
  process.stdout.write(`supabase/seed.sql · ${total} filas en ${tables.length} tablas\n`);
}

main();
