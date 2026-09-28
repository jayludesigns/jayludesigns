/**
 * Regenera los iconos de la PWA con la identidad actual: fondo #6b201a y
 * monograma "J" blanco (el mismo motivo del favicon app/icon.svg).
 *
 * Determinista: sin aleatoriedad, mismas salidas en cada ejecución.
 * Uso: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const OUT = "public/icons";
await mkdir(OUT, { recursive: true });

/** Monograma "J" geométrico en blanco, centrado en un viewBox 64×64. */
const MARK = `
  <g fill="#ffffff">
    <rect x="26" y="8" width="12" height="40" rx="6"/>
    <rect x="15" y="41" width="23" height="11" rx="5.5"/>
  </g>
`;

function svg(size, { maskable = false } = {}) {
  const radius = maskable ? 0 : Math.round(size * 0.22);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${radius}" fill="#6b201a"/>
  ${MARK}
</svg>`;
}

/** El área segura de los iconos maskable deja un 20 % de margen. */
function svgMaskable(size) {
  const g = 64 * 0.2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#6b201a"/>
  <g transform="translate(${g} ${g}) scale(${(64 - 2 * g) / 64})">
    ${MARK}
  </g>
</svg>`;
}

const targets = [
  { file: "icon-192.png", size: 192, svg: svg(192) },
  { file: "icon-512.png", size: 512, svg: svg(512) },
  { file: "apple-touch-icon.png", size: 180, svg: svg(180, { maskable: true }) },
  { file: "icon-maskable-192.png", size: 192, svg: svgMaskable(192) },
  { file: "icon-maskable-512.png", size: 512, svg: svgMaskable(512) },
];

for (const { file, size, svg: body } of targets) {
  await sharp(Buffer.from(body)).png().toFile(`${OUT}/${file}`);
  console.log(`${file} (${size}px) listo`);
}