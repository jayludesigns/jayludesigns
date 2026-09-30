/**
 * Backend Supabase (Postgres) para producción.
 * Se activa al definir NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 * (o NEXT_PUBLIC_SUPABASE_ANON_KEY) en el entorno.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Backend, Insertable, QueryOptions, Row, Where } from "./backend";
import { newId, nowIso } from "./backend";
import { assertColumn, assertTable, hasColumn, primaryKey, type TableName } from "./schema";

function client(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY. Configura .env.local o usa el backend local.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Cliente sin envolver, para lo que no sea una consulta a una tabla: subir
 * imágenes a Storage, sobre todo. Comparte credenciales con `client()`.
 */
export function supabaseService(): SupabaseClient {
  return client();
}

/**
 * Subconjunto de la API de PostgREST que usamos, para poder encadenar filtros
 * sin depender de los tipos internos de @supabase/postgrest-js.
 */
interface QueryResult {
  data: unknown;
  error: { message: string } | null;
  count?: number | null;
}

interface Filterable {
  eq(column: string, value: unknown): Filterable;
  neq(column: string, value: unknown): Filterable;
  gt(column: string, value: unknown): Filterable;
  gte(column: string, value: unknown): Filterable;
  lt(column: string, value: unknown): Filterable;
  lte(column: string, value: unknown): Filterable;
  in(column: string, values: unknown[]): Filterable;
  not(column: string, operator: string, values: string): Filterable;
  contains(column: string, values: unknown[]): Filterable;
  ilike(column: string, pattern: string): Filterable;
  is(column: string, value: null | boolean): Filterable;
  order(column: string, options: { ascending: boolean; nullsFirst: boolean }): Filterable;
  limit(count: number): Filterable;
  range(from: number, to: number): Filterable;
  select(columns?: string, options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }): Filterable;
  insert(values: unknown): Filterable;
  update(values: unknown): Filterable;
  upsert(values: unknown, options?: { onConflict?: string }): Filterable;
  delete(): Filterable;
  then<R>(onfulfilled: (value: QueryResult) => R): Promise<R>;
}

function table(name: string): Filterable {
  return client().from(name) as unknown as Filterable;
}

/** Traduce nuestro Where a los filtros de PostgREST. */
function applyWhere(query: Filterable, table: TableName, where: Where[] = []): Filterable {
  for (const clause of where) {
    assertColumn(table, clause.column);
    switch (clause.op) {
      case "eq":
        query = query.eq(clause.column, clause.value);
        break;
      case "neq":
        query = query.neq(clause.column, clause.value);
        break;
      case "gt":
        query = query.gt(clause.column, clause.value);
        break;
      case "gte":
        query = query.gte(clause.column, clause.value);
        break;
      case "lt":
        query = query.lt(clause.column, clause.value);
        break;
      case "lte":
        query = query.lte(clause.column, clause.value);
        break;
      case "in":
        query = query.in(clause.column, clause.value);
        break;
      case "nin":
        query = query.not(clause.column, "in", `(${clause.value.join(",")})`);
        break;
      case "contains":
        query = query.contains(clause.column, [clause.value]);
        break;
      case "ilike": {
        const term = clause.value.replace(/^%|%$/g, "");
        query = query.ilike(clause.column, `%${term}%`);
        break;
      }
      case "is":
        query = clause.value === null
          ? query.is(clause.column, null)
          : query.eq(clause.column, clause.value);
        break;
    }
  }
  return query;
}

function unwrap<T>(data: unknown, error: { message: string } | null, what: string): T {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data as T;
}

export class SupabaseBackend implements Backend {
  readonly kind = "supabase" as const;

  private q(name: TableName, opts: QueryOptions = {}) {
    assertTable(name);
    let query = applyWhere(table(name), name, opts.where);
    for (const o of opts.order ?? []) {
      assertColumn(name, o.column);
      query = query.order(o.column, { ascending: o.asc !== false, nullsFirst: false });
    }
    if (opts.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 1000) - 1);
    else if (opts.limit) query = query.limit(opts.limit);
    return query;
  }

  async list<T extends object>(name: TableName, opts: QueryOptions = {}): Promise<T[]> {
    const rows = await this.q(name, opts);
    return unwrap<T[]>(rows.data, rows.error, `Error leyendo ${name}`) ?? [];
  }

  async one<T extends object>(name: TableName, opts: QueryOptions): Promise<T | null> {
    const rows = await this.q(name, { ...opts, limit: 1 });
    return unwrap<T[]>(rows.data, rows.error, `Error leyendo ${name}`)?.[0] ?? null;
  }

  async count(name: TableName, where?: Where[]): Promise<number> {
    assertTable(name);
    const head = applyWhere(
      table(name).select("*", { count: "exact", head: true }),
      name,
      where,
    );
    const { count, error } = await head;
    if (error) throw new Error(`Error contando ${name}: ${error.message}`);
    return count ?? 0;
  }

  async insert<T extends object>(name: TableName, row: Insertable<T>): Promise<T> {
    assertTable(name);
    for (const key of Object.keys(row)) assertColumn(name, key);
    const [result] = await this.insertMany(name, [row]);
    return result;
  }

  async insertMany<T extends object>(name: TableName, rows: Insertable<T>[]): Promise<T[]> {
    assertTable(name);
    if (rows.length === 0) return [];
    for (const row of rows) for (const key of Object.keys(row)) assertColumn(name, key);
    const full = rows.map((row) => {
      const r = { ...row } as Record<string, unknown>;
      if (!("id" in r)) r.id = newId();
      if (name !== "settings" && !r.created_at) r.created_at = nowIso();
      if (name !== "settings" && r.updated_at === undefined) r.updated_at = nowIso();
      return r as Row;
    });
    const result = await table(name).insert(full).select();
    return unwrap<T[]>(result.data, result.error, `Error creando en ${name}`);
  }

  async update<T extends object>(name: TableName, id: string, patch: Partial<T>): Promise<T> {
    assertTable(name);
    for (const key of Object.keys(patch)) assertColumn(name, key);
    const payload: Record<string, unknown> = { ...(patch as Record<string, unknown>) };
    if (hasColumn(name, "updated_at")) payload.updated_at = nowIso();
    const result = await table(name).update(payload).eq("id", id).select();
    const row = unwrap<T[]>(result.data, result.error, `Error actualizando ${name}`)?.[0];
    if (!row) throw new Error(`No se encontró ${name}/${id}`);
    return row;
  }

  async upsert<T extends object>(name: TableName, row: Insertable<T>): Promise<T> {
    assertTable(name);
    for (const key of Object.keys(row)) assertColumn(name, key);
    const result = await table(name)
      .upsert(row, { onConflict: primaryKey(name).join(",") })
      .select();
    const saved = unwrap<T[]>(result.data, result.error, `Error guardando en ${name}`)?.[0];
    if (!saved) throw new Error(`No se pudo guardar ${name}`);
    return saved;
  }

  async remove(name: TableName, id: string): Promise<void> {
    assertTable(name);
    let query = table(name);
    for (const column of primaryKey(name)) query = query.eq(column, id);
    const result = await query.delete();
    if (result.error) throw new Error(`Error borrando de ${name}: ${result.error.message}`);
  }

  async removeMany(name: TableName, where: Where[]): Promise<void> {
    assertTable(name);
    const result = await applyWhere(table(name).delete(), name, where);
    if (result.error) throw new Error(`Error borrando de ${name}: ${result.error.message}`);
  }

  async getSetting<T>(key: string, fallback: T): Promise<T> {
    const result = await table("settings").select("value").eq("key", key);
    if (result.error) throw new Error(`Error leyendo ajuste ${key}: ${result.error.message}`);
    const row = (result.data as { value?: unknown }[] | null)?.[0];
    return (row?.value as T) ?? fallback;
  }

  async setSetting(key: string, value: unknown): Promise<void> {
    const result = await table("settings").upsert(
      { key, value, updated_at: nowIso() },
      { onConflict: "key" },
    );
    if (result.error) throw new Error(`Error guardando ajuste ${key}: ${result.error.message}`);
  }
}
