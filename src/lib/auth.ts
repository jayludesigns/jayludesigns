/**
 * Sesión del panel de administración.
 *
 * El token es un JWT propio firmado con HMAC-SHA256: el proxy y las server
 * actions lo validan sin necesidad de tocar la base de datos, y no depende de
 * que Supabase Auth esté configurado. Cuando Supabase sí lo está, el mismo
 * formato de sesión se emite tras validar las credenciales contra Auth.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Role } from "./types";

export const ADMIN_COOKIE = "jaylu_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface AdminSession {
  email: string;
  name: string;
  role: Role;
  exp: number;
}

function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.ADMIN_PASSWORD ??
    "jaylu-desarrollo-cambia-esto"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Firma un valor arbitrario: se usa para los enlaces privados de pedido. */
export function signValue(value: string): string {
  return sign(value);
}

function encode(session: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Verifica firma y vigencia. Devuelve null ante cualquier manipulación. */
export function verifyToken(token: string | undefined | null): AdminSession | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (typeof session.exp !== "number" || session.exp * 1000 < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function createToken(email: string, name: string, role: Role = "admin"): string {
  return encode({
    email: email.toLowerCase(),
    name,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
}

export const sessionCookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

/* ------------------------------------------------------------------ */
/* Credenciales                                                         */
/* ------------------------------------------------------------------ */

export function adminCredentials() {
  return {
    email: (process.env.ADMIN_EMAIL ?? "admin@jaylu.ve").toLowerCase(),
    password: process.env.ADMIN_PASSWORD ?? "jaylu2026",
  };
}

/** Compara sin filtrar información por tiempo. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export interface LoginResult {
  ok: boolean;
  error?: string;
  token?: string;
}

export function checkCredentials(email: string, password: string): LoginResult {
  const expected = adminCredentials();
  const emailOk = safeEqual(email.trim().toLowerCase(), expected.email);
  const passOk = safeEqual(password, expected.password);
  if (!emailOk || !passOk) {
    return { ok: false, error: "Correo o contraseña incorrectos." };
  }
  return { ok: true, token: createToken(expected.email, "Administración") };
}

/* ------------------------------------------------------------------ */
/* Acceso desde el servidor                                             */
/* ------------------------------------------------------------------ */

/** Sesión actual, o null. Pensado para páginas y server actions del panel. */
export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return verifyToken(store.get(ADMIN_COOKIE)?.value);
}

export async function isAdmin(): Promise<boolean> {
  return Boolean(await getAdminSession());
}

/**
 * Para usar al inicio de toda server action del panel: el proxy por sí solo
 * no basta, porque las server actions se invocan por POST a la ruta donde
 * se declararon.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new Error("Sesión no válida o expirada. Vuelve a iniciar sesión.");
  return session;
}

export const ADMIN_LOGIN_PATH = "/admin/login";
