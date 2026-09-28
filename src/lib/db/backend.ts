import type { TableName } from "./schema";

export type Where =
  | { column: string; op: "eq" | "neq"; value: unknown }
  | { column: string; op: "gt" | "gte" | "lt" | "lte"; value: number | string }
  | { column: string; op: "in" | "nin"; value: unknown[] }
  | { column: string; op: "contains"; value: unknown }
  | { column: string; op: "ilike"; value: string }
  | { column: string; op: "is"; value: null | boolean };

export interface Order {
  column: string;
  asc?: boolean;
}

export interface QueryOptions {
  where?: Where[];
  order?: Order[];
  limit?: number;
  offset?: number;
}

export type Row = object;

/**
 * Fila a insertar: `id`, `created_at` y `updated_at` los pone el backend si no
 * vienen. Las tablas que no tienen alguna de esas columnas no se ven afectadas
 * porque `Omit` solo quita lo que existe.
 */
type AutoColumns = "id" | "created_at" | "updated_at";

export type Insertable<T> = Omit<T, AutoColumns> &
  Partial<Pick<T, Extract<keyof T, AutoColumns>>>;

export interface Backend {
  readonly kind: "supabase" | "local";
  list<T extends object>(table: TableName, opts?: QueryOptions): Promise<T[]>;
  one<T extends object>(table: TableName, opts: QueryOptions): Promise<T | null>;
  count(table: TableName, where?: Where[]): Promise<number>;
  insert<T extends object>(table: TableName, row: Insertable<T>): Promise<T>;
  insertMany<T extends object>(table: TableName, rows: Insertable<T>[]): Promise<T[]>;
  update<T extends object>(table: TableName, id: string, patch: Partial<T>): Promise<T>;
  /** Inserta o actualiza usando la clave primaria de la fila. */
  upsert<T extends object>(table: TableName, row: Insertable<T>): Promise<T>;
  remove(table: TableName, id: string): Promise<void>;
  removeMany(table: TableName, where: Where[]): Promise<void>;
  getSetting<T>(key: string, fallback: T): Promise<T>;
  setSetting(key: string, value: unknown): Promise<void>;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
