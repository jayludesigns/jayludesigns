// E2E del flujo de portada: sube una imagen de prueba tipo "main" a
// prd_dragon_ashes por la ruta real (/api/uploads) y comprueba en db.json que
// queda de primera (sort_order 0) y que la portada anterior pasa a galería.
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SECRET = "jaylu-desarrollo-cambia-esto";
const BASE = "http://127.0.0.1:3000";

function token() {
  const session = {
    email: "admin@jaylu.ve",
    name: "Admin JayLu",
    role: "admin",
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

(async () => {
  // PNG 1x1 válido.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );

  const form = new FormData();
  form.append("file", new Blob([png], { type: "image/png" }), "test-portada-e2e.png");
  form.append("product_id", "prd_dragon_ashes");
  form.append("kind", "main");

  const res = await fetch(`${BASE}/api/uploads`, {
    method: "POST",
    headers: { cookie: `jaylu_admin=${token()}` },
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  console.log(`upload HTTP ${res.status}: ${JSON.stringify(body)}`);
  if (res.status !== 200) process.exit(1);

  const db = JSON.parse(readFileSync(join(process.cwd(), ".data", "db.json"), "utf8"));
  const imgs = db.product_images
    .filter((i) => i.product_id === "prd_dragon_ashes")
    .sort((a, b) => a.sort_order - b.sort_order);

  const test = imgs.find((i) => i.url.includes("test-portada-e2e.png"));
  const oldMain = imgs.find((i) => i.url.includes("1790641281154-y8d48x.jpg"));

  console.log(`test row: ${test ? `sort ${test.sort_order} kind ${test.kind}` : "NO EXISTE"}`);
  console.log(`portada anterior: ${oldMain ? `sort ${oldMain.sort_order} kind ${oldMain.kind}` : "NO EXISTE"}`);

  const ok =
    test?.sort_order === 0 &&
    test?.kind === "main" &&
    oldMain?.kind === "gallery" &&
    oldMain?.sort_order === 1;
  console.log(ok ? "PROMOCIÓN OK: la subida quedó de portada" : "FALLO en la promoción a portada");
  process.exit(ok ? 0 : 1);
})();