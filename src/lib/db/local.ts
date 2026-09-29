/**
 * Backend local basado en un archivo JSON.
 *
 * Permite ejecutar y administrar la tienda completa en el equipo sin tener un
 * proyecto de Supabase configurado. Al definir `.env.local` con las variables de
 * Supabase, el backend cambia a Postgres automáticamente.
 */

import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import type { Backend, Insertable, QueryOptions, Row, Where } from "./backend";
import { newId, nowIso } from "./backend";
import { assertColumn, assertTable, hasColumn, primaryKey, TABLES, type TableName } from "./schema";
import { buildSeedData } from "./seed";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

type Db = Record<string, Row[]>;

let cache: Db | null = null;
let cacheMtime: number | null = null;
/** Serializa escrituras para evitar carreras entre requests concurrentes. */
let writeChain: Promise<unknown> = Promise.resolve();

async function load(): Promise<Db> {
  // En desarrollo, Next puede mantener más de una instancia de este módulo
  // (páginas, server actions y route handlers), cada una con su propia
  // memoria. El archivo en disco es la única verdad compartida: si cambió su
  // fecha de modificación, se vuelve a leer para que la tienda refleje al
  // instante lo que se edita en el panel (subir o borrar imágenes, precios…)
  // sin necesidad de reiniciar el servidor.
  let raw: string | null = null;
  let mtime: number | null = null;
  try {
    const st = await fs.stat(DB_FILE);
    mtime = st.mtimeMs;
    raw = await fs.readFile(DB_FILE, "utf8");
  } catch {
    // Archivo ausente o ilegible: quedarse con lo que ya hay en memoria.
  }

  if (cache && (raw === null || mtime === cacheMtime)) return cache;

  let loaded: Db;
  if (raw !== null) {
    try {
      loaded = JSON.parse(raw) as Db;
    } catch {
      // Escritura a medias por otra instancia: conservar el último estado bueno.
      if (cache) return cache;
      loaded = buildSeedData() as unknown as Db;
    }
  } else {
    loaded = buildSeedData() as unknown as Db;
  }
  // Asegura que existan todas las tablas aunque el archivo sea viejo.
  for (const table of Object.values(TABLES)) {
    if (!loaded[table]) loaded[table] = [];
  }
  cache = loaded;
  cacheMtime = mtime;
  if (!existsSync(DB_FILE)) await persist(loaded);
  return loaded;
}

async function persist(db: Db): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

/** Ejecuta una mutación con acceso exclusivo y guarda en disco. */
function mutate<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const run = writeChain.then(async () => {
    const db = await load();
    const result = await fn(db);
    await persist(db);
    return result;
  });
  writeChain = run.catch(() => undefined);
  return run;
}

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return -1;
  if (b === null || b === undefined) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "es");
}

function matches(row: Row, table: TableName, where: Where[] = []): boolean {
  const record = row as Record<string, unknown>;
  for (const clause of where) {
    assertColumn(table, clause.column);
    const actual = record[clause.column];
    switch (clause.op) {
      case "eq":
        if (actual !== clause.value) return false;
        break;
      case "neq":
        if (actual === clause.value) return false;
        break;
      case "gt":
        if (!((actual as number) > (clause.value as number))) return false;
        break;
      case "gte":
        if (!((actual as number) >= (clause.value as number))) return false;
        break;
      case "lt":
        if (!((actual as number) < (clause.value as number))) return false;
        break;
      case "lte":
        if (!((actual as number) <= (clause.value as number))) return false;
        break;
      case "in":
        if (!clause.value.includes(actual)) return false;
        break;
      case "nin":
        if (clause.value.includes(actual)) return false;
        break;
      case "contains":
        if (!Array.isArray(actual) || !actual.includes(clause.value)) return false;
        break;
      case "ilike": {
        const term = clause.value.replace(/^%|%$/g, "").toLowerCase();
        const hay = String(actual ?? "").toLowerCase();
        if (!hay.includes(term)) return false;
        break;
      }
      case "is":
        if (clause.value === null ? actual !== null : actual !== clause.value) return false;
        break;
      default:
        return false;
    }
  }
  return true;
}

function applyQuery(rows: Row[], table: TableName, opts: QueryOptions = {}): Row[] {
  let result = rows.filter((row) => matches(row, table, opts.where));
  if (opts.order?.length) {
    result = [...result].sort((a, b) => {
      const aRecord = a as Record<string, unknown>;
      const bRecord = b as Record<string, unknown>;
      for (const o of opts.order!) {
        assertColumn(table, o.column);
        const cmp = compare(aRecord[o.column], bRecord[o.column]);
        if (cmp !== 0) return o.asc === false ? -cmp : cmp;
      }
      return 0;
    });
  }
  if (opts.offset) result = result.slice(opts.offset);
  if (opts.limit) result = result.slice(0, opts.limit);
  return result;
}

function withDefaults<T extends object>(table: TableName, row: T): T {
  const out: Record<string, unknown> = { ...(row as Record<string, unknown>) };
  if (!("id" in out) && hasColumn(table, "id")) out.id = newId();
  if (table !== "settings" && !("created_at" in out) && hasColumn(table, "created_at")) {
    out.created_at = nowIso();
  }
  if (
    out.updated_at === undefined &&
    table !== "settings" &&
    hasColumn(table, "updated_at")
  ) {
    out.updated_at = nowIso();
  }
  return out as T;
}

export class LocalBackend implements Backend {
  readonly kind = "local" as const;

  async list<T extends object>(table: TableName, opts: QueryOptions = {}): Promise<T[]> {
    assertTable(table);
    const db = await load();
    return applyQuery(db[table] ?? [], table, opts) as T[];
  }

  async one<T extends object>(table: TableName, opts: QueryOptions): Promise<T | null> {
    assertTable(table);
    const db = await load();
    const [row] = applyQuery(db[table] ?? [], table, { ...opts, limit: 1 });
    return (row as T) ?? null;
  }

  async count(table: TableName, where?: Where[]): Promise<number> {
    assertTable(table);
    const db = await load();
    return (db[table] ?? []).filter((r) => matches(r, table, where)).length;
  }

  async insert<T extends object>(table: TableName, row: Insertable<T>): Promise<T> {
    assertTable(table);
    return mutate((db) => {
      const full = withDefaults(table, row);
      for (const key of Object.keys(full)) assertColumn(table, key);
      db[table] = db[table] ?? [];
      db[table].push(full as Row);
      return full as T;
    });
  }

  async insertMany<T extends object>(table: TableName, rows: Insertable<T>[]): Promise<T[]> {
    assertTable(table);
    return mutate((db) => {
      const full = rows.map((r) => withDefaults(table, r));
      for (const r of full) for (const key of Object.keys(r)) assertColumn(table, key);
      db[table] = db[table] ?? [];
      db[table].push(...(full as Row[]));
      return full as T[];
    });
  }

  async update<T extends object>(table: TableName, id: string, patch: Partial<T>): Promise<T> {
    assertTable(table);
    for (const key of Object.keys(patch)) assertColumn(table, key);
    return mutate((db) => {
      db[table] = db[table] ?? [];
      const index = db[table].findIndex((r) => (r as Record<string, unknown>).id === id);
      if (index === -1) throw new Error(`No existe ${table}/${id}`);
      const merged = {
        ...(db[table][index] as Record<string, unknown>),
        ...(patch as Record<string, unknown>),
      } as Record<string, unknown>;
      if (hasColumn(table, "updated_at")) merged.updated_at = nowIso();
      db[table][index] = merged;
      return merged as T;
    });
  }

  /**
   * Inserta o reemplaza por clave primaria. Algunas tablas (`product_spin360`,
   * `product_collections`) no tienen `id`: su clave la declara `primaryKey`, y
   * las filas que coincidan con ella se sustituyen en lugar de duplicarse.
   */
  async upsert<T extends object>(table: TableName, row: Insertable<T>): Promise<T> {
    assertTable(table);
    for (const key of Object.keys(row)) assertColumn(table, key);
    return mutate((db) => {
      db[table] = db[table] ?? [];
      const record = row as Record<string, unknown>;
      const keyColumns = primaryKey(table).filter((c) => c in record);
      const index = db[table].findIndex((r) => {
        const existing = r as Record<string, unknown>;
        return keyColumns.every((c) => existing[c] === record[c]);
      });
      const full = withDefaults(table, row);
      if (index === -1) db[table].push(full as Row);
      else db[table][index] = { ...(db[table][index] as Row), ...(full as Row) };
      return full as T;
    });
  }

  async remove(table: TableName, id: string): Promise<void> {
    assertTable(table);
    const keys = primaryKey(table);
    await mutate((db) => {
      db[table] = (db[table] ?? []).filter(
        (r) => !keys.every((key) => (r as Record<string, unknown>)[key] === id),
      );
    });
  }

  async removeMany(table: TableName, where: Where[]): Promise<void> {
    assertTable(table);
    await mutate((db) => {
      db[table] = (db[table] ?? []).filter((r) => !matches(r, table, where));
    });
  }

  async getSetting<T>(key: string, fallback: T): Promise<T> {
    const db = await load();
    const row = (db.settings ?? []).find((r) => (r as Record<string, unknown>).key === key);
    return row ? ((row as Record<string, unknown>).value as T) : fallback;
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    await mutate((db) => {
      db.settings = db.settings ?? [];
      const index = db.settings.findIndex((r) => (r as Record<string, unknown>).key === key);
      const row = { key, value, updated_at: nowIso() };
      if (index === -1) db.settings.push(row as Row);
      else db.settings[index] = row as Row;
    });
  }
}

export const localBackend = new LocalBackend();
