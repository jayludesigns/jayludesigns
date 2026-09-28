/**
 * Comprueba que todas las rutas de la app responden, con y sin sesión.
 *
 *   node scripts/smoke.mjs [http://localhost:3210]
 *
 * No usa dependencias: llama a `curl.exe`, que viene con Windows, porque
 * `fetch` sigue redirecciones y devuelve el cuerpo de la página de login en
 * lugar de avisar de que la sesión no pasó. Aquí importa distinguir una de
 * otra cosa.
 */

import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const BASE = (process.argv[2] ?? "http://localhost:3210").replace(/\/$/, "");
const OUT = path.join(tmpdir(), "jaylu-smoke.html");

/* ------------------------------------------------------------------ */
/* Sesión de mentira, firmada igual que lo hace src/lib/auth.ts        */
/* ------------------------------------------------------------------ */

const SECRET =
  process.env.ADMIN_SESSION_SECRET ??
  process.env.ADMIN_PASSWORD ??
  "jaylu-desarrollo-cambia-esto";

const session = {
  email: (process.env.ADMIN_EMAIL ?? "admin@jaylu.ve").toLowerCase(),
  name: "Comprobación",
  role: "admin",
  exp: Math.floor(Date.now() / 1000) + 3600,
};

const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
const cookie = `${payload}.${createHmac("sha256", SECRET).update(payload).digest("base64url")}`;

function sign(value) {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

const db = JSON.parse(readFileSync(".data/db.json", "utf8"));
const tables = db.tables ?? db;
const firstOrder = tables.orders[0];

/* ------------------------------------------------------------------ */
/* Peticiones                                                          */
/* ------------------------------------------------------------------ */

function fetchPage(pathname, { auth = false } = {}) {
  const headers = auth ? ["-H", `Cookie: jaylu_admin=${cookie}`] : [];
  const stdout = execFileSync(
    "curl.exe",
    ["-s", "-L", "-o", OUT, "-w", "%{http_code}\t%{url_effective}", ...headers, `${BASE}${pathname}`],
    { encoding: "utf8", windowsHide: true },
  );
  const [code, effective] = stdout.split("\t");
  return { code: Number(code), effective: effective ?? "", body: readFileSync(OUT, "utf8") };
}

/** Rutas que deben responder 200 sin sesión. */
const STOREFRONT = [
  "/",
  "/catalogo",
  "/colecciones",
  "/colecciones/anime-legends",
  "/producto/samurai-zen",
  "/carrito",
  "/checkout",
  "/pedido/buscar",
  "/diseno-a-medida",
  "/nosotros",
  "/contacto",
  "/offline",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
  "/sw.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/brand/logo-jaylu.svg",
];

const PANEL = [
  "/admin",
  "/admin/productos",
  "/admin/productos/nuevo",
  `/admin/productos/${tables.products[0].id}`,
  "/admin/colecciones",
  "/admin/promociones",
  "/admin/inventario",
  "/admin/inventario/materia-prima",
  "/admin/pedidos",
  "/admin/pedidos/nuevo",
  `/admin/pedidos/${tables.orders[0].id}`,
  "/admin/disenos",
  `/admin/disenos/${tables.custom_designs[0].id}`,
  "/admin/clientes",
  `/admin/clientes/${tables.customers[0].id}`,
  "/admin/crm",
  "/admin/finanzas",
  "/admin/ajustes",
];

/* ------------------------------------------------------------------ */

let failures = 0;

/** Comprueba una ruta y su código esperado (o el que resulte). */
function check(label, pathname, { auth = false, expect = 200 } = {}) {
  let result;
  try {
    result = fetchPage(pathname, { auth });
  } catch (error) {
    console.log(`  ✕  ${label.padEnd(38)} ${error.message}`);
    failures += 1;
    return;
  }

  const redirected = result.effective.replace(BASE, "") || "/";
  const bouncedToLogin = /\/admin\/login/.test(redirected);
  const problems = [];

  if (result.code !== expect) problems.push(`código ${result.code}, se esperaba ${expect}`);
  if (auth && bouncedToLogin) problems.push("la sesión no se aceptó");
  if (!auth && pathname.startsWith("/admin") && !bouncedToLogin) {
    problems.push("el panel se sirió sin sesión");
  }

  if (problems.length) {
    console.log(`  ✕  ${label.padEnd(38)} ${problems.join(" · ")}`);
    failures += 1;
  } else {
    console.log(`  ✓  ${label.padEnd(38)} ${result.code}`);
  }
}

console.log(`\nJayLu · comprobación de rutas contra ${BASE}\n`);

console.log("Tienda (sin sesión)");
for (const route of STOREFRONT) check(route, route);

console.log("\nRutas que deben decir 404");
check("producto inexistente", "/producto/no-existe", { expect: 404 });
check("colección inexistente", "/colecciones/no-existe", { expect: 404 });
check("página inexistente", "/no-existe-esta-pagina", { expect: 404 });

console.log("\nPanel (con sesión)");
for (const route of PANEL) check(route, route, { auth: true });

console.log("\nEnlaces que dependen de una firma");
check(
  "pedido con token válido",
  `/pedido/${firstOrder.order_number}?t=${sign(`${firstOrder.id}:${firstOrder.order_number}`)}`,
);
check(
  "pedido con token inválido",
  `/pedido/${firstOrder.order_number}?t=inventado`,
  { expect: 404 },
);
check("pedido sin token", `/pedido/${firstOrder.order_number}`, { expect: 404 });

console.log("\nPanel sin sesión (debe redirigir al login)");
for (const route of ["/admin", "/admin/productos", "/admin/finanzas"]) {
  const { effective } = fetchPage(route);
  const ok = /\/admin\/login/.test(effective);
  console.log(`  ${ok ? "✓" : "✕"}  ${route.padEnd(38)} → ${effective.replace(BASE, "") || "/"}`);
  if (!ok) failures += 1;
}

rmSync(OUT, { force: true });

console.log(
  failures === 0
    ? "\nTodo en orden.\n"
    : `\n${failures} problema${failures === 1 ? "" : "s"}.\n`,
);
process.exit(failures === 0 ? 0 : 1);
