// Elimina de .data/db.json las filas de product_images cuyo archivo local no
// existe en public/ (imágenes rotas: subidas borradas a mano o resucitadas por
// la copia en memoria del backend local) y reordena sort_order por producto.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const file = join(process.cwd(), ".data", "db.json");
const db = JSON.parse(readFileSync(file, "utf8"));

if (!Array.isArray(db.product_images)) {
  console.error("No hay product_images en db.json");
  process.exit(1);
}

const before = db.product_images.length;
let removed = 0;

db.product_images = db.product_images.filter((row) => {
  if (typeof row?.url !== "string" || !row.url.startsWith("/")) return true; // URL externa: se deja
  const fsPath = join(process.cwd(), "public", row.url.replaceAll("/", "\\"));
  if (!existsSync(fsPath)) {
    removed += 1;
    console.log(`- sin archivo: ${row.product_id} | ${row.kind} | ${row.url}`);
    return false;
  }
  return true;
});

// Reordena sort_order de 0..n por producto (los huecos no rompen nada, pero
// así el panel y la tienda muestran el orden limpio).
const byProduct = new Map();
for (const img of db.product_images) {
  const list = byProduct.get(img.product_id) ?? [];
  list.push(img);
  byProduct.set(img.product_id, list);
}
for (const list of byProduct.values()) {
  list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  list.forEach((img, i) => {
    img.sort_order = i;
  });
}

writeFileSync(file, JSON.stringify(db, null, 2), "utf8");
console.log(`product_images: ${before} -> ${db.product_images.length} (quitadas ${removed})`);