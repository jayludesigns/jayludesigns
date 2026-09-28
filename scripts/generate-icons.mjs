/**
 * Genera los iconos de la PWA a partir de `logo_jaylu.svg`.
 * Uso: node scripts/generate-icons.mjs
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const logo = path.join(root, "logo_jaylu.svg");
const outPublic = path.join(root, "public", "icons");
const outApp = path.join(root, "src", "app");

mkdirSync(outPublic, { recursive: true });

// El SVG tiene relleno transparente arriba y abajo; recortamos al contenido real
// (viewBox 810x1012.5, contenido visible entre y=81 y y=915 sobre un ancho de 1080).
const WIDTH = 1080;
const TOP = Math.round((81 / 1012.5) * 1350);
const HEIGHT = Math.round(((915 - 81) / 1012.5) * 1350);

const content = await sharp(logo, { density: 400 })
  .resize({ width: WIDTH })
  .ensureAlpha()
  .extract({ left: 0, top: TOP, width: WIDTH, height: HEIGHT })
  .toBuffer();

const meta = await sharp(content).metadata();
console.log(`contenido recortado: ${meta.width}x${meta.height}`);

async function onLight(size, file, inset = 0.1) {
  const inner = Math.round(size * (1 - inset * 2));
  const scaled = await sharp(content).resize({ width: inner, height: inner, fit: "inside" }).toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: "#FFFFFF" },
  })
    .composite([{ input: scaled, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(file);
  console.log(`  ${path.relative(root, file)} (${size}x${size}, fondo blanco)`);
}

async function onDark(size, file, inset = 0.16) {
  const inner = Math.round(size * (1 - inset * 2));
  const scaled = await sharp(content).resize({ width: inner, height: inner, fit: "inside" }).toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: "#000000" },
  })
    .composite([{ input: scaled, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(file);
  console.log(`  ${path.relative(root, file)} (${size}x${size}, fondo negro)`);
}

console.log("Generando iconos...");
await onLight(192, path.join(outPublic, "icon-192.png"), 0.08);
await onLight(512, path.join(outPublic, "icon-512.png"), 0.08);
await onDark(512, path.join(outPublic, "icon-maskable-512.png"), 0.2);
await onDark(192, path.join(outPublic, "icon-maskable-192.png"), 0.2);
await onDark(180, path.join(outPublic, "apple-touch-icon.png"), 0.18);
await onLight(512, path.join(outApp, "icon.png"), 0.08);
await onLight(32, path.join(outApp, "favicon.ico"), 0.04);

console.log("Listo.");
