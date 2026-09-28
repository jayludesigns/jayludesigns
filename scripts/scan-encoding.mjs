/**
 * Revisa los archivos de texto del proyecto en busca de mojibake: secuencias
 * que no deberían existir porque todo el contenido está en español/inglés con
 * acentos, eñes y símbolos.
 *
 * Uso: node scripts/scan-encoding.mjs [carpeta]
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const TARGETS = process.argv.slice(2);
const SELF = path.basename(new URL(import.meta.url).pathname).replace(/^\//, "");
const SKIP = new Set(["node_modules", ".next", ".git", ".data", "public", "tsconfig.tsbuildinfo"]);

// Caracteres permitidos: ASCII imprimible + acentos españoles + signos comunes.
const ALLOWED = new Set(
  [
    ...Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)),
    "\n", "\r", "\t", "﻿", // el BOM del CSV es intencional
    "á", "é", "í", "ó", "ú", "ü", "ñ", "Á", "É", "Í", "Ó", "Ú", "Ü", "Ñ",
    "°", "€", "·", "–", "—", "“", "”", "‘", "’", "−",
    "×", "→", "…", "«", "»", "✦", "⚠", "©", "®", "²", "³", "½", "¿", "¡", "±", "≤", "≥",
    "▲", "▼", "↗", "↘", "•", "◼", "☰", "✓", "✔", "✕", "▪", "●", "◆", "★", "☆", "→", "≈",
  ].map((c) => c),
);

// Sustitutos y marcadores típicos de UTF-8 leído como Latin-1.
const SMELLS = [
  "Ã©", "Ã¡", "Ã­", "Ã³", "Ãº", "Ã±", "Â°", "â€", "â€™", "â€œ", "â€",
  "ï¿½", "�", "Â", "Rights reservado", "CierreInvierno", ",wq",
];

/**
 * Rangos que no tienen ningún sentido en un proyecto escrito en español: si
 * aparece algo aquí, casi siempre es un fragmento de texto corrupto que se
 * coló al escribir el archivo (pasó con varios párrafos del sitio).
 */
const FOREIGN = [
  [0x2e80, 0x9fff], // CJK, hiragana, katakana
  [0xac00, 0xd7af], // hangul
  [0x0400, 0x04ff], // cirílico
  [0x0590, 0x05ff], // hebreo
  [0x0600, 0x06ff], // árabe
  [0x0e00, 0x0e7f], // tailandés
  [0xff00, 0xffef], // ancho completo
];

function isForeign(code) {
  return FOREIGN.some(([from, to]) => code >= from && code <= to);
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name) || entry.name === SELF) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx|js|jsx|mjs|css|json|md|svg)$/.test(entry.name)) yield full;
  }
}

const roots = TARGETS.length ? TARGETS : [path.join(ROOT, "src"), path.join(ROOT, "scripts")];
let problems = 0;
let scanned = 0;

for (const root of roots) {
  for await (const file of walk(root)) {
    scanned += 1;
    const text = await readFile(file, "utf8");
    const lines = text.split("\n");

    lines.forEach((line, i) => {
      for (const smell of SMELLS) {
        if (line.includes(smell)) {
          problems += 1;
          console.log(`[smell] ${path.relative(ROOT, file)}:${i + 1}  ${JSON.stringify(smell)}  ->  ${line.trim()}`);
        }
      }
      for (const char of line) {
        if (char === "\n" || char === "\r") continue;
        if (isForeign(char.codePointAt(0))) {
          problems += 1;
          console.log(
            `[extr ] ${path.relative(ROOT, file)}:${i + 1}  U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}  ->  ${line.trim().slice(0, 120)}`,
          );
          break;
        }
        if (!ALLOWED.has(char)) {
          problems += 1;
          console.log(
            `[char ] ${path.relative(ROOT, file)}:${i + 1}  U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}  ->  ${line.trim().slice(0, 120)}`,
          );
          break;
        }
      }
    });
  }
}

console.log(`\n${scanned} archivos revisados · ${problems} problemas.`);
process.exit(problems ? 1 : 0);
