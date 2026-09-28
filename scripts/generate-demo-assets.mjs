#!/usr/bin/env node
/**
 * JayLu · generador de assets SVG de demostracion
 * ------------------------------------------------------------------
 * Escribe ilustraciones vectoriales planas (NO fotos) en public/demo:
 *   products/{slug}-1|-2|-3.svg   1200x1500  (frontal / espalda / detalle)
 *   spin/{slug}/00..35.svg         900x900   (36 pasos de rotacion falsa)
 *   collections/{slug}.svg        2000x800   (banners)
 *   categories/{slug}.svg         1200x900   (siluetas grandes)
 *   references/{name}.svg         1000x1000  ("fotos" del cliente, menor calidad)
 *
 * Solo modulos nativos de Node. Idempotente: se puede ejecutar N veces.
 * Paleta estricta: #FFFFFF, #000000 y grises. Sin color.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'demo');

/* ================================================================== *
 * 0 · utilidades de bajo nivel
 * ================================================================== */

const N = (v) => {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? 0 : r;
};
const FONT = 'Arial, Helvetica, sans-serif';
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** pseudo-aleatorio determinista (para sprinkled dots / pixeles sueltos) */
const rnd = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const COSTURA = 'fill="none" stroke="#8E8E8E" stroke-width="1.3" stroke-dasharray="8 6" stroke-linecap="round"';
const LINEA = 'fill="none" stroke="#000"';

/** texto vectorial: sin fuentes externas */
function txt(x, y, str, o = {}) {
  const {
    size = 24,
    fill = '#000',
    anchor = 'start',
    ls = null,
    stretch = null,
    op = null,
    rot = null,
    tf = null,
    stroke = null,
    sw = null,
  } = o;
  const attrs = [
    `x="${N(x)}"`,
    `y="${N(y)}"`,
    `font-family="${FONT}"`,
    'font-weight="bold"',
    `font-size="${N(size)}"`,
    `fill="${fill}"`,
    anchor !== 'start' ? `text-anchor="${anchor}"` : '',
    ls != null ? `letter-spacing="${N(ls)}"` : '',
    stretch != null ? `textLength="${N(stretch)}" lengthAdjust="spacingAndGlyphs"` : '',
    op != null ? `opacity="${N(op)}"` : '',
    rot != null ? `transform="rotate(${N(rot)} ${N(x)} ${N(y)})"` : '',
    tf != null ? `transform="translate(${N(tf[0])} ${N(tf[1])})"` : '',
    stroke ? `stroke="${stroke}" stroke-width="${N(sw ?? 1)}" stroke-linejoin="round"` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return `<text ${attrs}>${esc(str)}</text>`;
}

/** estrella de n puntas */
function starPath(cx, cy, R, r = R * 0.44, pts = 5, rot = -90) {
  let d = '';
  for (let i = 0; i < pts * 2; i++) {
    const a = ((rot + (i * 180) / pts) * Math.PI) / 180;
    const rad = i % 2 ? r : R;
    d += `${i ? 'L' : 'M'}${N(cx + Math.cos(a) * rad)} ${N(cy + Math.sin(a) * rad)}`;
  }
  return `${d}Z`;
}

/** destello de 4 puntas */
const sparkle = (cx, cy, R) =>
  `M${cx} ${N(cy - R)}Q${N(cx + R * 0.13)} ${N(cy - R * 0.13)} ${N(cx + R)} ${cy}` +
  `Q${N(cx + R * 0.13)} ${N(cy + R * 0.13)} ${cx} ${N(cy + R)}` +
  `Q${N(cx - R * 0.13)} ${N(cy + R * 0.13)} ${N(cx - R)} ${cy}` +
  `Q${N(cx - R * 0.13)} ${N(cy - R * 0.13)} ${cx} ${N(cy - R)}Z`;

/** rayo / relampago */
const rayo = (cx, cy, h) => {
  const w = h * 0.34;
  return (
    `M${N(cx + w * 0.5)} ${N(cy - h / 2)}L${N(cx - w * 0.6)} ${N(cy + h * 0.02)}` +
    `L${N(cx - w * 0.05)} ${N(cy + h * 0.02)}L${N(cx - w * 0.5)} ${N(cy + h / 2)}` +
    `L${N(cx + w * 0.6)} ${N(cy - h * 0.04)}L${N(cx + w * 0.05)} ${N(cy - h * 0.04)}Z`
  );
};

/* ================================================================== *
 * 1 · helpers compartidos: documento, fondo, sombra, marco, captions
 * ================================================================== */

/** documento SVG accesible (viewBox + width/height + title + desc) */
function doc({ w, h, title, desc, defs = '', body }) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"` +
    ` role="img" aria-labelledby="ttl">\n` +
    `<title id="ttl">${esc(title)}</title>\n` +
    (desc ? `<desc>${esc(desc)}</desc>\n` : '') +
    (defs ? `<defs>${defs}</defs>\n` : '') +
    body +
    `\n</svg>\n`
  );
}

/** defs base: semitono, lineas de velocidad, trama de pixeles, malla, blur */
function defsCore() {
  return (
    `<filter id="soft" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="9"/></filter>` +
    `<filter id="soft2" x="-35%" y="-35%" width="170%" height="170%"><feGaussianBlur stdDeviation="3.2"/></filter>` +
    `<pattern id="ht" width="12" height="12" patternUnits="userSpaceOnUse">` +
    `<circle cx="3" cy="3" r="2.1" fill="#000"/><circle cx="9" cy="9" r="2.1" fill="#000"/></pattern>` +
    `<pattern id="htFaint" width="14" height="14" patternUnits="userSpaceOnUse">` +
    `<circle cx="3.5" cy="3.5" r="1.3" fill="#000"/><circle cx="10.5" cy="10.5" r="1.3" fill="#000"/></pattern>` +
    `<pattern id="diag" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">` +
    `<path d="M0 0V18" stroke="#000" stroke-width="2.2" opacity="0.16"/></pattern>` +
    `<pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">` +
    `<circle cx="7" cy="7" r="1.7" fill="#000" opacity="0.13"/></pattern>` +
    `<pattern id="pxgrid" width="20" height="20" patternUnits="userSpaceOnUse">` +
    `<path d="M20 0H0V20" fill="none" stroke="#B4B4B4" stroke-width="1"/></pattern>` +
    `<pattern id="mesh" width="11" height="11" patternUnits="userSpaceOnUse">` +
    `<path d="M0 0L11 11M11 0L0 11" stroke="#9E9E9E" stroke-width="1.1" fill="none"/></pattern>` +
    `<pattern id="snow" width="120" height="120" patternUnits="userSpaceOnUse">` +
    `<circle cx="12" cy="18" r="3" fill="#000" opacity="0.5"/><circle cx="63" cy="47" r="2.2" fill="#000" opacity="0.35"/>` +
    `<circle cx="96" cy="92" r="4" fill="#000" opacity="0.45"/><circle cx="34" cy="104" r="2.6" fill="#000" opacity="0.3"/></pattern>` +
    `<linearGradient id="fold" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="#000" stop-opacity="0.13"/><stop offset="0.2" stop-color="#000" stop-opacity="0"/>` +
    `<stop offset="0.62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.16"/></linearGradient>` +
    `<linearGradient id="shL" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="#000" stop-opacity="0.34"/><stop offset="0.5" stop-color="#000" stop-opacity="0.05"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>` +
    `<linearGradient id="shR" x1="1" y1="0" x2="0" y2="0">` +
    `<stop offset="0" stop-color="#000" stop-opacity="0.34"/><stop offset="0.5" stop-color="#000" stop-opacity="0.05"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`
  );
}

/** fondo claro con textura (nunca transparente) */
function fondo(w, h, o = {}) {
  const { base = '#F2F2F2', tex = 'dots', band = 0, glow = 0 } = o;
  const out = [`<rect width="${w}" height="${h}" fill="${base}"/>`];
  if (glow) out.push(`<circle cx="${N(w * 0.5)}" cy="${N(h * 0.42)}" r="${N(Math.min(w, h) * 0.46)}" fill="#FFFFFF" opacity="${glow}"/>`);
  if (tex && tex !== 'none') out.push(`<rect width="${w}" height="${h}" fill="url(#${tex})"/>`);
  if (band > 0) out.push(`<rect y="${N(h * band)}" width="${w}" height="${N(h * (1 - band))}" fill="#000" opacity="0.05"/>`);
  return out.join('');
}

/** marco / borde con ticks de registro */
function marco(x, y, w, h, o = {}) {
  const { sw = 2.5, stroke = '#000', fill = 'none', dash = '' } = o;
  return `<rect x="${N(x)}" y="${N(y)}" width="${N(w)}" height="${N(h)}" fill="${fill}" stroke="${stroke}" stroke-width="${N(sw)}"${dash}/>`;
}

function ticks(w, h, len = 24, sw = 1.6, c = '#000') {
  const out = [];
  for (const [x, y, sx, sy] of [
    [0, 0, 1, 1],
    [w, 0, -1, 1],
    [0, h, 1, -1],
    [w, h, -1, -1],
  ]) {
    out.push(`<path d="M${x} ${N(y + sy * len)}V${y}H${N(x + sx * len)}" fill="none" stroke="${c}" stroke-width="${sw}"/>`);
  }
  return out.join('');
}

/** badge de texto (ej. ESPALDA) */
function chip(x, y, label, o = {}) {
  const { size = 26, pad = 18, fill = '#000', tc = '#FFFFFF', ls = 3, anchor = 'start' } = o;
  const w = label.length * size * 0.68 + pad * 2;
  const h = size * 1.85;
  const rx = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
  return (
    marco(rx, y, w, h, { sw: 0, fill }) +
    txt(anchor === 'end' ? x - pad : anchor === 'middle' ? x : x + pad, y + h * 0.7, label, { size, fill: tc, ls })
  );
}

/** sombra suave de la silueta + volumen (helper compartido) */
function sombraSilueta(gid, dx = 10, dy = 18, op = 0.16) {
  return `<use href="#${gid}" transform="translate(${N(dx)} ${N(dy)})" fill="#000" stroke="none" opacity="${op}" filter="url(#soft)"/>`;
}
function volumen(gid, op = 0.6) {
  return `<rect width="600" height="750" fill="url(#fold)" clip-path="url(#c-${gid})" opacity="${op}"/>`;
}
/** sombreado lateral de la rotacion: +1 = lado derecho, -1 = lado izquierdo */
function shadeLateral(gid, s, op) {
  if (op <= 0.005) return '';
  const id = s >= 0 ? 'shR' : 'shL';
  return `<rect width="600" height="750" fill="url(#${id})" clip-path="url(#c-${gid})" opacity="${N(op)}"/>`;
}

/** caption editorial chico */
function caption(x, y, a, b, o = {}) {
  const { size = 20, fill = '#9A9A9A' } = o;
  return (
    txt(x, y, a, { size, fill, ls: 4 }) +
    txt(x, y + size * 1.35, b, { size: size * 0.86, fill, ls: 2, op: 0.75 })
  );
}

/* ================================================================== *
 * 2 · siluetas de prenda (espacio local 600 x 750)
 * ================================================================== */

function shirtBody({
  sy = 196, hy = 566, xl = 196, xr = 404,
  soL = 48, soR = 552, sly = 300, shy = 330, apy = 268,
  nw = 100, nd = 38, neck = true,
}) {
  const nL = 300 - nw / 2, nR = 300 + nw / 2;
  const top = neck ? `M${nL} ${sy}C${nL} ${sy + nd} ${nR} ${sy + nd} ${nR} ${sy}` : `M${xl + 112} ${sy + 20}`;
  const close = neck ? 'Z' : `L${xl + 112} ${sy + 20}Z`;
  return (
    `<path d="${top}L${xr + 112} ${sy + 20}L${soR} ${sly}L${xr + 120} ${shy}` +
    `L${xr + 2} ${apy}L${xr + 2} ${hy}L${xl - 2} ${hy}L${xl - 2} ${apy}` +
    `L${xl - 120} ${shy}L${soL} ${sly}${close}"/>`
  );
}

/** FRANELA / reera basica (T-shirt) */
function shapesFranela() {
  return [
    shirtBody({}),
    `<path d="M205 292V548M395 292V548" ${COSTURA}/>`,
    `<path d="M200 550H400" ${COSTURA}/>`,
    `<path d="M250 196c0 30 100 30 100 0" fill="none" stroke="#C0C0C0" stroke-width="8" stroke-linecap="round"/>`,
    `<path d="M62 296L112 322M538 296L488 322" ${COSTURA}/>`,
    `<path d="M268 232l-6 16h76l-6-16" ${COSTURA}/>`,
  ].join('');
}

/** HOODIE con capucha, cordones y bolsillo canguro */
function shapesHoodie() {
  return [
    shirtBody({ sy: 252, hy: 604, xl: 188, xr: 412, soL: 40, soR: 560, sly: 330, shy: 362, apy: 300, neck: false }),
    `<path d="M232 262C214 148 386 148 368 262Z" fill="#F6F6F6" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/>`,
    `<path d="M252 262C238 186 362 186 348 262" ${COSTURA}/>`,
    `<path d="M200 330H400" ${COSTURA}/>`,
    `<path d="M196 360V596M404 360V596" ${COSTURA}/>`,
    `<path d="M198 534H402V586H198Z" fill="#EFEFEF" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/>`,
    `<path d="M198 552H402" ${COSTURA}/>`,
    `<path d="M272 240v46M328 240v46" stroke="#000" stroke-width="3" fill="none"/>`,
    `<path d="M272 292h9M323 292h9" stroke="#000" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    `<path d="M196 592H404M196 598H404" ${COSTURA}/>`,
    `<path d="M56 330L110 358M544 330L490 358" ${COSTURA}/>`,
  ].join('');
}

/** POLO: cuello definido, botonadura y punos con ribete */
function shapesPolo() {
  return [
    shirtBody({ sy: 200, hy: 590, xl: 198, xr: 402, soL: 50, soR: 550, sly: 304, shy: 336, apy: 272, nw: 104, nd: 34 }),
    `<path d="M248 198L300 244V272L266 214Z" fill="#F1F1F1" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/>`,
    `<path d="M352 198L300 244V272L334 214Z" fill="#F1F1F1" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/>`,
    `<path d="M300 244V302" ${LINEA} stroke-width="2.4"/>`,
    `<path d="M292 246h16v58h-16z" fill="none" stroke="#000" stroke-width="1.5"/>`,
    `<circle cx="300" cy="258" r="3.4" fill="#000"/><circle cx="300" cy="276" r="3.4" fill="#000"/><circle cx="300" cy="294" r="3.4" fill="#000"/>`,
    `<path d="M254 214L300 258L346 214" ${COSTURA}/>`,
    `<path d="M56 296L112 330M544 296L488 330" ${COSTURA}/>`,
    `<path d="M62 300L120 330M538 300L480 330" ${LINEA} stroke-width="5"/>`,
    `<path d="M204 574H396" ${COSTURA}/>`,
    `<path d="M206 300V562M394 300V562" ${COSTURA}/>`,
  ].join('');
}

/** UNIFORME ESCOLAR: camisa manga corta con cuello y bolsillo pecho */
function shapesUniforme() {
  return [
    shirtBody({ sy: 198, hy: 600, xl: 198, xr: 402, soL: 50, soR: 550, sly: 300, shy: 334, apy: 268, nw: 108, nd: 30 }),
    `<path d="M246 198L300 240L354 198" fill="#F4F4F4" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/>`,
    `<path d="M246 198L300 254L354 198" fill="none" stroke="#000" stroke-width="1.6"/>`,
    `<path d="M300 240V300" ${LINEA} stroke-width="2.2"/>`,
    `<circle cx="300" cy="252" r="3.2" fill="#000"/><circle cx="300" cy="270" r="3.2" fill="#000"/><circle cx="300" cy="288" r="3.2" fill="#000"/>`,
    `<path d="M330 296h64v48h-64z" fill="#F4F4F4" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/>`,
    `<path d="M330 308h64" ${COSTURA}/>`,
    `<path d="M58 294L112 330M542 294L488 330" ${COSTURA}/>`,
    `<path d="M206 296V586M394 296V586" ${COSTURA}/>`,
    `<path d="M204 584H396" ${COSTURA}/>`,
    `<path d="M232 212h136" ${COSTURA}/>`,
  ].join('');
}

/** GORRA trucker de perfil (corona + visera + malla trasera) */
function shapesGorra() {
  return [
    `<path d="M180 434C172 262 404 246 456 402C464 420 464 430 462 440H182Z" fill="#FFFFFF" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/>`,
    `<path d="M300 254C292 330 292 392 292 438" ${COSTURA}/>`,
    `<path d="M232 288C226 340 226 392 228 438" ${COSTURA}/>`,
    `<path d="M300 254C404 246 456 402 462 440H300Z" fill="url(#mesh)" stroke="none" opacity="0.9"/>`,
    `<path d="M300 254C404 246 456 402 462 440H300Z" fill="none" stroke="#000" stroke-width="1.3"/>`,
    `<circle cx="298" cy="252" r="10" fill="#F0F0F0" stroke="#000" stroke-width="1.8"/>`,
    `<path d="M186 440C300 458 438 452 470 434C512 418 522 456 486 472C438 494 316 498 232 490C186 485 172 452 186 440Z" fill="#FFFFFF" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/>`,
    `<path d="M214 470C300 486 420 480 466 462" ${COSTURA}/>`,
  ].join('');
}

/** BOLSO DE LONA (tote) con asas */
function shapesTote() {
  return [
    `<path d="M226 318C222 212 290 212 286 318" fill="none" stroke="#000" stroke-width="1.8"/>`,
    `<path d="M314 318C310 212 378 212 374 318" fill="none" stroke="#000" stroke-width="1.8"/>`,
    `<path d="M234 296C232 224 288 224 286 296" ${COSTURA}/>`,
    `<path d="M322 296C320 224 376 224 374 296" ${COSTURA}/>`,
    `<path d="M190 318H410L424 606H176Z" fill="#FFFFFF" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/>`,
    `<path d="M204 336H396L408 590H192Z" ${COSTURA}/>`,
    `<path d="M184 556H416" ${COSTURA}/>`,
    `<path d="M190 318H410" stroke="#000" stroke-width="5"/>`,
  ].join('');
}

/** "prenda" del pack: es una ILUSTRACION de 3 personas, no una prenda */
function shapesPack() {
  return [
    `<circle cx="300" cy="360" r="238" fill="url(#htFaint)" stroke="none"/>`,
    `<circle cx="300" cy="360" r="238" fill="none" stroke="#000" stroke-width="1.6" stroke-dasharray="4 9"/>`,
    `<path d="M40 556H560" stroke="#000" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/>`,
    `<path d="M120 596H480" ${COSTURA}/>`,
  ].join('');
}

/* registro de prendas: silueta + caja del estampado */
const PRENDAS = {
  franela: { label: 'FRANELA', shapes: shapesFranela, box: { x: 202, y: 296, w: 196, h: 224 } },
  hoodie: { label: 'HOODIE', shapes: shapesHoodie, box: { x: 202, y: 300, w: 196, h: 224 } },
  polo: { label: 'POLO', shapes: shapesPolo, box: { x: 202, y: 312, w: 196, h: 224 } },
  uniforme: { label: 'UNIFORME', shapes: shapesUniforme, box: { x: 200, y: 350, w: 196, h: 224 } },
  gorra: { label: 'GORRA', shapes: shapesGorra, box: { x: 235, y: 252, w: 150, h: 171 } },
  tote: { label: 'TOTE', shapes: shapesTote, box: { x: 222, y: 340, w: 156, h: 178 } },
  pack: { label: 'ILUSTRACION', shapes: shapesPack, box: { x: 74, y: 96, w: 452, h: 516 } },
};

const prendaDefs = (tipo) => {
  const p = PRENDAS[tipo];
  const gid = `g-${tipo}`;
  return (
    `<g id="${gid}">${p.shapes()}</g>` +
    `<clipPath id="c-${gid}"><use href="#${gid}"/></clipPath>` +
    `<clipPath id="pc-${gid}"><rect x="${p.box.x - 12}" y="${p.box.y - 12}" width="${p.box.w + 24}" height="${p.box.h + 24}"/></clipPath>`
  );
};

/** render de la prenda: sombra suave + relleno blanco + trazo negro + volumen */
function prendaSvg(tipo, o = {}) {
  const gid = `g-${tipo}`;
  const { sombra = true, vol = 0.6 } = o;
  return (
    (sombra ? sombraSilueta(gid) : '') +
    `<use href="#${gid}" fill="#FFFFFF" stroke="#000" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>` +
    (vol > 0 ? volumen(gid, vol) : '')
  );
}

/** coloca el diseno (420x480) dentro de una caja */
function stamp(box, art, o = {}) {
  const { dx = 0, op = 1, clip = null } = o;
  return (
    `<g transform="translate(${N(dx)} 0)" opacity="${N(op)}"${clip ? ` clip-path="url(#${clip})"` : ''}>` +
    `<g transform="translate(${box.x} ${box.y}) scale(${N(box.w / 420)} ${N(box.h / 480)})">${art}</g></g>`
  );
}

/* ================================================================== *
 * 3 · estampados (espacio de diseno 420 x 480)
 * ================================================================== */

const nube = (x, y, s = 1) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M-96 0c0-24 18-30 32-28 8-22 32-22 40 0 16-2 24 10 24 28z" fill="#FFFFFF"/>`;

const veloc = (cx, cy, r0, r1, n, o = {}) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i * 360) / n + (o.rot || 0);
    const rad = (a * Math.PI) / 180;
    return `<path d="M${N(cx + Math.cos(rad) * r0)} ${N(cy + Math.sin(rad) * r0)}L${N(cx + Math.cos(rad) * r1)} ${N(cy + Math.sin(rad) * r1)}" stroke="#000" stroke-width="${o.sw || 2.4}" stroke-linecap="round" fill="none" opacity="${o.op ?? 1}"/>`;
  }).join('');

/**
 * samurai-zen: samurai sentado + luna llena con crateros + nubes japonesas en negativo.
 * La figura se dibuja dos veces: primero un "halo" blanco de separacion y encima
 * la version en negro solido, para que nunca se funda con la banda de nubes.
 */
function dSamuraiZen() {
  const fig = [
    `<path d="M204 236h12l-6-26Z"/>`, //  cresta del casco (maedate)
    `<path d="M170 268C178 232 242 232 250 268C232 254 188 254 170 268Z"/>`, //  kasa
    `<circle cx="210" cy="282" r="22"/>`, //  cabeza
    `<path d="M176 264h68v20h-68Z"/>`, //  visera
    `<path d="M188 292h44l34 96H154Z"/>`, //  torso
    `<path d="M126 430L210 366L294 430Z"/>`, //  piernas
  ].join('');
  return [
    // luna llena con crateros
    `<circle cx="210" cy="88" r="70" fill="#000"/>`,
    `<circle cx="180" cy="66" r="15" fill="#EDEDED"/><circle cx="240" cy="106" r="21" fill="#EDEDED"/>`,
    `<circle cx="200" cy="50" r="8" fill="#B4B4B4"/><circle cx="238" cy="62" r="6" fill="#B4B4B4"/>`,
    `<circle cx="160" cy="108" r="9" fill="#CFCFCF"/>`,
    // banda de nubes japonesas en negativo
    `<rect x="0" y="156" width="420" height="42" fill="#000"/>`,
    nube(66, 194, 0.72), nube(214, 196, 0.86), nube(362, 194, 0.72),
    // samurai: halo blanco + solido negro
    `<g fill="#FFFFFF" stroke="#FFFFFF" stroke-width="10" stroke-linejoin="round" stroke-linecap="round">${fig}</g>`,
    `<g fill="#000000" stroke="#000000" stroke-width="1.4" stroke-linejoin="round">${fig}</g>`,
    `<path d="M172 267C190 253 230 253 248 267" stroke="#FFF" stroke-width="6" fill="none" stroke-linecap="round"/>`, //  ala del casco
    `<path d="M188 273h44" stroke="#FFF" stroke-width="5" stroke-linecap="round"/>`, //  ranura de la visera
    `<path d="M262 300L336 452" stroke="#000" stroke-width="7" stroke-linecap="round"/>`, //  katana
    `<path d="M248 314l28 12" stroke="#000" stroke-width="6" stroke-linecap="round"/>`, //  guarda
    `<path d="M156 390h108" stroke="#FFF" stroke-width="3"/>`, //  separacion torso/piernas
    `<path d="M40 462H380" stroke="#000" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>`,
    veloc(210, 462, 60, 88, 5, { sw: 2, op: 0.5 }),
  ].join('');
}

/** neon-shinigami: espada vertical con aura de velocidad + calavera estilizada */
function dNeonShinigami() {
  return [
    `<circle cx="210" cy="292" r="128" fill="none" stroke="#D2D2D2" stroke-width="30"/>`,
    veloc(210, 292, 132, 214, 18, { sw: 2.6, op: 0.85 }),
    veloc(210, 292, 138, 196, 9, { sw: 5, op: 0.35, rot: 10 }),
    `<g>`,
    `<path d="M210 202c-46 0-72 30-72 66 0 26 14 44 32 56l-8 34h96l-8-34c18-12 32-30 32-56 0-36-26-66-72-66z" fill="#FFFFFF" stroke="#000" stroke-width="6" stroke-linejoin="round"/>`,
    `<path d="M158 274c-6 24 4 40 22 44-10-16-8-32 2-46z" fill="#000"/>`,
    `<path d="M262 274c6 24-4 40-22 44 10-16 8-32-2-46z" fill="#000"/>`,
    `<path d="M210 316l-13 24h26z" fill="#000"/>`,
    `<path d="M172 340h76M180 354h60M192 368h36" stroke="#000" stroke-width="4" stroke-linecap="round"/>`,
    `</g>`,
    `<path d="M200 296L205 22h10l5 274z" fill="#FFFFFF" stroke="#000" stroke-width="6" stroke-linejoin="round"/>`,
    `<path d="M210 40V288" stroke="#000" stroke-width="2.4"/>`,
    `<path d="M162 296h96a10 10 0 0 1 0 20h-96a10 10 0 0 1 0-20z" fill="#000"/>`,
    `<path d="M198 316h24v78h-24z" fill="#FFFFFF" stroke="#000" stroke-width="5"/>`,
    `<path d="M198 336h24M198 358h24M198 378h24" stroke="#000" stroke-width="3"/>`,
    `<circle cx="210" cy="404" r="11" fill="#000"/>`,
  ].join('');
}

/** dragon-ashes: dragon en S con alas membranosas y llama, todo en semitono */
function dDragonAshes() {
  const ala = `<path d="M204 306C150 250 74 250 34 206C58 292 118 330 200 344Z" fill="url(#ht)" stroke="#000" stroke-width="5" stroke-linejoin="round"/>`;
  return [
    `<g transform="translate(420 0) scale(-1 1)">${ala}</g>`,
    ala,
    `<path d="M196 300C120 288 70 268 44 226M186 314C128 316 84 308 56 288" stroke="#000" stroke-width="3.4" fill="none"/>`,
    `<path d="M210 300C300 254 322 182 244 150C166 118 122 202 202 234C282 266 302 332 220 362" fill="none" stroke="#000" stroke-width="30" stroke-linecap="round"/>`,
    `<path d="M210 300C300 254 322 182 244 150C166 118 122 202 202 234" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" opacity="0.85"/>`,
    `<path d="M258 168l24-20-6 30z" fill="#000"/><path d="M180 196l-28-14 12 30z" fill="#000"/><path d="M286 330l26 12-26 12z" fill="#000"/>`,
    `<path d="M196 152C170 122 190 84 226 76C196 96 190 126 206 146Z" fill="url(#ht)" stroke="#000" stroke-width="4" stroke-linejoin="round"/>`,
    `<path d="M210 96C196 76 206 54 232 44C222 68 224 84 236 96Z" fill="#000"/>`,
    `<circle cx="222" cy="118" r="7" fill="#FFFFFF" stroke="#000" stroke-width="3"/>`,
    `<circle cx="224" cy="118" r="2.6" fill="#000"/>`,
    // tres lenguas de fuego separadas en x, con nucleo solido y chispas
    `<g fill="url(#htFaint)" stroke="#000" stroke-width="4" stroke-linejoin="round">`,
    `<path d="M74 472C74 424 96 392 130 366C118 400 128 442 156 472Z"/>`,
    `<path d="M346 472C346 424 324 392 290 366C302 400 292 442 264 472Z"/>`,
    `</g>`,
    `<path d="M170 472C168 408 176 366 212 334C242 370 250 412 248 472Z" fill="#000"/>`,
    `<path d="M196 472C194 434 200 406 216 386C222 410 224 442 224 472Z" fill="url(#htFaint)"/>`,
    `<g fill="#000">`,
    `<rect x="162" y="400" width="10" height="10"/><rect x="156" y="440" width="7" height="7"/>`,
    `<rect x="252" y="408" width="10" height="10"/><rect x="264" y="444" width="7" height="7"/>`,
    `<rect x="200" y="322" width="8" height="8"/><rect x="232" y="344" width="6" height="6"/>`,
    `</g>`,
    `<path d="M70 474H350" stroke="#000" stroke-width="4" stroke-dasharray="3 9" stroke-linecap="round"/>`,
  ].join('');
}

/** sakura-8bit: pixel art real con retícula visible + sprites sueltos */
function pixelArt() {
  const CW = 15, CH = 15, PX = 20;
  const g = Array.from({ length: CH }, () => new Array(CW).fill('.'));
  const set = (x, y, v) => {
    if (x >= 0 && x < CW && y >= 0 && y < CH) g[y][x] = v;
  };
  // flor de 7x7: silueta clara con muesca central
  const flor = [
    '...#...',
    '..###..',
    '.#####.',
    '##.#.##',
    '.#####.',
    '..###..',
    '...#...',
  ];
  const stampF = (cx, cy, v) => {
    flor.forEach((row, j) =>
      [...row].forEach((c, i) => {
        if (c === '#') set(cx + i - 3, cy + j - 3, v);
      })
    );
  };
  // rama principal: diagonal limpia de 1 px
  [[1, 13], [2, 12], [3, 11], [4, 10], [5, 9], [6, 8], [7, 7], [8, 6], [9, 5], [10, 4]]
    .forEach(([x, y]) => set(x, y, '#'));
  // sub-ramas cortas
  [[4, 10, 1, -1, 3], [7, 7, -1, -1, 2], [8, 6, 1, -1, 2]].forEach(([sx, sy, dx, dy, n]) => {
    for (let i = 0; i < n; i++) set(sx + dx * i, sy + dy * i, '#');
  });
  stampF(3, 11, '#');
  stampF(9, 4, '#');
  stampF(11, 10, '+');
  // hojas sueltas
  [[2, 14], [5, 13], [11, 13], [13, 10], [4, 4]].forEach(([a, b]) => set(a, b, '#'));
  // sprites sueltos (claros)
  [[1, 7], [13, 1], [12, 14], [2, 8]].forEach(([a, b]) => set(a, b, '+'));

  // run-length por fila -> pocos rects
  const fill = { '#': '#000', '+': '#9E9E9E' };
  let out = `<rect x="0" y="0" width="${CW * PX}" height="${CH * PX}" fill="#FFFFFF"/>`;
  out += `<rect x="0" y="0" width="${CW * PX}" height="${CH * PX}" fill="url(#pxgrid)"/>`;
  for (let r = 0; r < CH; r++) {
    let c = 0;
    while (c < CW) {
      const v = g[r][c];
      if (v === '.') { c++; continue; }
      let n = 1;
      while (c + n < CW && g[r][c + n] === v) n++;
      out += `<rect x="${c * PX}" y="${r * PX}" width="${n * PX}" height="${PX}" fill="${fill[v]}"/>`;
      c += n;
    }
  }
  out += `<rect x="0" y="0" width="${CW * PX}" height="${CH * PX}" fill="none" stroke="#000" stroke-width="2"/>`;
  return `<g transform="translate(60 70)">${out}</g>`;
}

function dSakura8bit() {
  return [
    pixelArt(),
    `<path d="M60 402h300" stroke="#000" stroke-width="2" stroke-dasharray="6 7"/>`,
    `<rect x="60" y="418" width="300" height="34" fill="url(#ht)" stroke="#000" stroke-width="2"/>`,
    txt(360, 392, '8-BIT', { size: 26, fill: '#000', ls: 4 }),
    `<path d="M330 424h40v18h-40z" fill="#000"/><path d="M338 424v18M346 424v18M354 424v18" stroke="#FFF" stroke-width="1.6"/>`,
  ].join('');
}

/** mago-rpg: sombrero, barba, baston, circulo de runas y barra de mana */
function dMagoRpg() {
  const runas = Array.from({ length: 8 }, (_, i) => {
    const a = ((i * 45 - 90) * Math.PI) / 180;
    const cx = 210 + Math.cos(a) * 148, cy = 236 + Math.sin(a) * 148;
    const rot = i * 45;
    return `<g transform="translate(${N(cx)} ${N(cy)}) rotate(${rot})" stroke="#000" stroke-width="4" stroke-linecap="round" fill="none">` +
      `<path d="M-13 0H13M-9 9L9 -9"/><circle cx="0" cy="0" r="3" fill="#000" stroke="none"/></g>`;
  }).join('');
  return [
    `<circle cx="210" cy="236" r="168" fill="none" stroke="#000" stroke-width="3"/>`,
    `<circle cx="210" cy="236" r="126" fill="none" stroke="#000" stroke-width="1.6" stroke-dasharray="10 9"/>`,
    runas,
    `<path d="M336 320L374 470" stroke="#000" stroke-width="11" stroke-linecap="round"/>`,
    `<circle cx="330" cy="296" r="30" fill="url(#ht)" stroke="#000" stroke-width="5"/>`,
    veloc(330, 296, 36, 52, 8, { sw: 3, op: 0.7 }),
    `<path d="M210 40L312 158H108Z" fill="#000"/>`,
    `<path d="M84 158C150 142 270 142 336 158C300 188 120 188 84 158Z" fill="#FFFFFF" stroke="#000" stroke-width="5" stroke-linejoin="round"/>`,
    `<circle cx="210" cy="208" r="46" fill="#FFFFFF" stroke="#000" stroke-width="5"/>`,
    `<path d="M186 204h14M210 204h14" stroke="#000" stroke-width="6" stroke-linecap="round"/>`,
    `<path d="M164 226C172 288 248 288 256 226C240 258 180 258 164 226Z" fill="#000"/>`,
    `<path d="M176 236C190 250 230 250 244 236C230 262 190 262 176 236Z" fill="#FFFFFF"/>`,
    `<path d="M56 406h300v42H56z" fill="#FFFFFF" stroke="#000" stroke-width="5"/>`,
    `<path d="M64 414h238v26H64z" fill="#000"/>`,
    `<path d="M112 414v26M160 414v26M208 414v26M256 414v26" stroke="#FFFFFF" stroke-width="3"/>`,
    `<path d="M302 414h46v26h-46z" fill="url(#htFaint)" stroke="#000" stroke-width="3"/>`,
    txt(56, 396, 'MANA', { size: 22, fill: '#000', ls: 5 }),
  ].join('');
}

/** uniforme-escolar-jb: escudo escolar + corona de laurel + 2 estrellas + trazo grueso */
function laurel(cx, cy, R, n = 7) {
  const hoja = (a, r) => {
    const rad = (a * Math.PI) / 180;
    const px = cx + Math.cos(rad) * r, py = cy + Math.sin(rad) * r;
    return `<ellipse cx="${N(px)}" cy="${N(py)}" rx="16" ry="7" fill="#000" transform="rotate(${N(a + 90)} ${N(px)} ${N(py)})"/>`;
  };
  let out = `<path d="M${N(cx)} ${N(cy + R * 0.62)}C${N(cx - R * 0.9)} ${N(cy + R * 0.3)} ${N(cx - R * 0.78)} ${N(cy - R * 0.55)} ${N(cx - R * 0.34)} ${N(cy - R * 0.86)}" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round"/>`;
  for (let i = 0; i < n; i++) out += hoja(196 + i * 13, R * (0.92 - i * 0.045));
  out += `<path d="M${N(cx)} ${N(cy + R * 0.62)}C${N(cx + R * 0.9)} ${N(cy + R * 0.3)} ${N(cx + R * 0.78)} ${N(cy - R * 0.55)} ${N(cx + R * 0.34)} ${N(cy - R * 0.86)}" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round"/>`;
  for (let i = 0; i < n; i++) out += hoja(-16 - i * 13, R * (0.92 - i * 0.045));
  return out;
}

function dEscudoEscolar() {
  const escudo = (k) => `M${N(210 - 142 * k)} ${N(66 + 44 * k)}C${N(210 - 142 * k)} ${N(214 + 44 * k)} ${N(210 - 68 * k)} ${N(310 + 44 * k)} ${N(210)} ${N(374 + 44 * k)}C${N(210 + 68 * k)} ${N(310 + 44 * k)} ${N(210 + 142 * k)} ${N(214 + 44 * k)} ${N(210 + 142 * k)} ${N(66 + 44 * k)}Z`;
  return [
    `<path d="${escudo(1)}" fill="#FFFFFF" stroke="#000" stroke-width="7" stroke-linejoin="round"/>`,
    `<path d="${escudo(0.88)}" fill="none" stroke="#000" stroke-width="2.2" stroke-dasharray="7 7"/>`,
    `<path d="${escudo(0.74)}" fill="none" stroke="#000" stroke-width="3.4"/>`,
    laurel(210, 232, 118),
    txt(210, 250, 'J B', { size: 116, fill: '#000', anchor: 'middle', stretch: 150 }),
    `<path d="M140 300H280" stroke="#000" stroke-width="6" stroke-linecap="round"/>`,
    `<path d="${starPath(126, 152, 34)}" fill="#000"/>`,
    `<path d="${starPath(294, 152, 34)}" fill="#000"/>`,
    `<path d="M84 420h252" stroke="#000" stroke-width="2" stroke-dasharray="4 8"/>`,
  ].join('');
}

/** polo-corporativo-liso: escudo generico + rombo + texto CORP vectorial */
function dPoloCorp() {
  return [
    `<path d="M210 56L352 96V208C352 306 286 372 210 412C134 372 68 306 68 208V96Z" fill="#FFFFFF" stroke="#000" stroke-width="7" stroke-linejoin="round"/>`,
    `<path d="M210 76L334 110V206C334 292 276 350 210 388C144 350 86 292 86 206V110Z" fill="none" stroke="#000" stroke-width="2" stroke-dasharray="6 7"/>`,
    `<path d="M210 138L268 208L210 278L152 208Z" fill="#000"/>`,
    `<path d="M210 166L244 208L210 250L176 208Z" fill="#FFFFFF"/>`,
    `<path d="M136 300H284" stroke="#000" stroke-width="5" stroke-linecap="round"/>`,
    txt(210, 344, 'CORP', { size: 56, fill: '#000', anchor: 'middle', stretch: 168, ls: 6 }),
    `<path d="M126 384H294" stroke="#000" stroke-width="2" stroke-dasharray="3 7"/>`,
  ].join('');
}

/** hoodie-ronin: kasa (sombrero de paja) grande con hueco + mascara Noh */
function dHoodieRonin() {
  return [
    `<path d="M210 74C300 74 356 152 364 236H56C64 152 120 74 210 74Z" fill="#FFFFFF" stroke="#000" stroke-width="7" stroke-linejoin="round"/>`,
    ...[0, 1, 2, 3, 4, 5].map((i) => {
      const a = (-84 + i * 33.6) * (Math.PI / 180);
      return `<path d="M210 78L${N(210 + Math.cos(a) * 196)} ${N(240 + Math.sin(a) * 196)}" stroke="#000" stroke-width="2.2"/>`;
    }),
    `<path d="M40 236C120 212 300 212 380 236C300 268 120 268 40 236Z" fill="#F1F1F1" stroke="#000" stroke-width="6" stroke-linejoin="round"/>`,
    `<ellipse cx="210" cy="240" rx="34" ry="12" fill="#FFFFFF" stroke="#000" stroke-width="4" stroke-dasharray="6 6"/>`,
    `<path d="M150 330C150 296 176 276 210 276C244 276 270 296 270 330C270 372 244 404 210 404C176 404 150 372 150 330Z" fill="#FFFFFF" stroke="#000" stroke-width="6"/>`,
    `<path d="M168 322l34 6-34 6z" fill="#000"/><path d="M252 322l-34 6 34 6z" fill="#000"/>`,
    `<path d="M196 356h28" stroke="#000" stroke-width="5" stroke-linecap="round"/>`,
    `<path d="M186 380c14 10 34 10 48 0" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/>`,
    `<path d="M210 300v34" stroke="#000" stroke-width="3"/>`,
    `<path d="M158 340l-16 8M262 340l16 8" stroke="#000" stroke-width="3.4" stroke-linecap="round"/>`,
    `<path d="M84 430h252" stroke="#000" stroke-width="2" stroke-dasharray="5 8"/>`,
  ].join('');
}

/** mono-logo: solo "JL" gigante condensado con contorno */
function dMonoLogo() {
  const sombraTexto = txt(210, 330, 'JL', {
    size: 330, fill: '#000', anchor: 'middle', stretch: 300, sw: 26, stroke: '#000',
    tf: [13, 17], op: 0.28,
  });
  const frente = txt(210, 330, 'JL', {
    size: 330, fill: '#FFFFFF', anchor: 'middle', stretch: 300, sw: 26, stroke: '#000',
  });
  return [
    `<rect x="20" y="86" width="380" height="330" fill="url(#htFaint)" opacity="0.55"/>`,
    sombraTexto,
    frente,
    `<path d="M40 372H380" stroke="#000" stroke-width="4" stroke-linecap="round"/>`,
    `<path d="M40 396H380" stroke="#000" stroke-width="10" stroke-linecap="round"/>`,
    `<path d="M20 60H400" stroke="#000" stroke-width="2" stroke-dasharray="3 9"/>`,
    txt(210, 452, 'EST. 2019', { size: 34, fill: '#000', anchor: 'middle', ls: 12, stretch: 220 }),
  ].join('');
}

/** gorra-kuchisake: ojo afilado con rayas emanando (el accesorio es la gorra) */
function dGorraKuchisake() {
  return [
    veloc(210, 244, 96, 190, 14, { sw: 3, op: 0.9 }),
    `<path d="M44 244C104 186 190 172 250 182C310 192 352 216 376 244C306 282 190 296 116 284C84 279 58 262 44 244Z" fill="#FFFFFF" stroke="#000" stroke-width="7" stroke-linejoin="round"/>`,
    `<path d="M44 244C104 186 190 172 250 182C310 192 352 216 376 244" fill="none" stroke="#000" stroke-width="16" stroke-linecap="round"/>`,
    `<path d="M210 186L246 244L210 300L174 244Z" fill="#000"/>`,
    `<path d="M210 210L230 244L210 278L190 244Z" fill="#FFFFFF"/>`,
    `<circle cx="210" cy="244" r="13" fill="#000"/>`,
    `<path d="M132 330l18 22-30-8zM288 330l-18 22 30-8z" fill="#000"/>`,
    `<path d="M70 400H350" stroke="#000" stroke-width="3" stroke-dasharray="4 10"/>`,
  ].join('');
}

/** tote-studio: rayo + estrella simple con circulo discontinuo (caja chica: trazo grueso) */
function dToteStudio() {
  return [
    `<circle cx="210" cy="240" r="168" fill="none" stroke="#000" stroke-width="10" stroke-dasharray="16 18"/>`,
    `<circle cx="210" cy="240" r="140" fill="none" stroke="#000" stroke-width="4" stroke-dasharray="6 16"/>`,
    `<path d="${rayo(196, 240, 330)}" fill="#000"/>`,
    `<path d="${sparkle(330, 122, 66)}" fill="#000"/>`,
    `<path d="${sparkle(104, 356, 40)}" fill="#000"/>`,
    `<path d="M60 412h300" stroke="#000" stroke-width="4" stroke-dasharray="5 12"/>`,
  ].join('');
}

/** pack-grupos-eventos: 3 siluetas de personas + rayo/asterisco detras del grupo */
function persona(x, y, s) {
  return `<g transform="translate(${x} ${y}) scale(${s})">` +
    `<circle cx="0" cy="-140" r="30"/>` +
    `<path d="M-40 -104H40L54 40H-54Z"/>` +
    `<path d="M-40 -84L-72 -6H-46L-30 -66ZM40 -84L72 -6H46L30 -66Z"/>` +
    `<path d="M-54 40h44l-6 66h-32zM10 40h44l-6 66H16z"/>` +
    `</g>`;
}

function dPackGrupos() {
  const grupo = [persona(78, 336, 0.68), persona(342, 336, 0.68), persona(210, 326, 0.83)].join('');
  return [
    // rayo y destello detras, en semitono, para que el grupo se lea por delante
    `<path d="${rayo(150, 216, 196)}" fill="url(#htFaint)" stroke="#000" stroke-width="5" stroke-linejoin="round"/>`,
    `<path d="${sparkle(298, 166, 66)}" fill="#000" opacity="0.9"/>`,
    // grupo: halo blanco de separacion + solido negro
    `<g fill="#FFFFFF" stroke="#FFFFFF" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">${grupo}</g>`,
    `<g fill="#000000" stroke="#000000" stroke-width="1.4" stroke-linejoin="round">${grupo}</g>`,
    `<path d="M50 434H370" stroke="#000" stroke-width="4" stroke-dasharray="3 10" stroke-linecap="round"/>`,
  ].join('');
}

const DISENOS = {
  samuraiZen: dSamuraiZen,
  neonShinigami: dNeonShinigami,
  dragonAshes: dDragonAshes,
  sakura8bit: dSakura8bit,
  magoRpg: dMagoRpg,
  escudoEscolar: dEscudoEscolar,
  poloCorp: dPoloCorp,
  hoodieRonin: dHoodieRonin,
  monoLogo: dMonoLogo,
  gorraKuchisake: dGorraKuchisake,
  toteStudio: dToteStudio,
  packGrupos: dPackGrupos,
};

/* ================================================================== *
 * 4 · registro de productos
 * ================================================================== */

const PRODUCTOS = [
  { slug: 'samurai-zen', prenda: 'franela', diseno: 'samuraiZen', nombre: 'Franela Samurai Zen' },
  { slug: 'neon-shinigami', prenda: 'franela', diseno: 'neonShinigami', nombre: 'Franela Neon Shinigami' },
  { slug: 'dragon-ashes', prenda: 'franela', diseno: 'dragonAshes', nombre: 'Franela Dragon Ashes' },
  { slug: 'sakura-8bit', prenda: 'franela', diseno: 'sakura8bit', nombre: 'Franela Sakura 8bit' },
  { slug: 'mago-rpg', prenda: 'franela', diseno: 'magoRpg', nombre: 'Franela Mago RPG' },
  { slug: 'uniforme-escolar-jb', prenda: 'uniforme', diseno: 'escudoEscolar', nombre: 'Uniforme Escolar JB' },
  { slug: 'polo-corporativo-liso', prenda: 'polo', diseno: 'poloCorp', nombre: 'Polo Corporativo Liso' },
  { slug: 'hoodie-ronin', prenda: 'hoodie', diseno: 'hoodieRonin', nombre: 'Hoodie Ronin' },
  { slug: 'mono-logo', prenda: 'franela', diseno: 'monoLogo', nombre: 'Franela Mono Logo' },
  { slug: 'gorra-kuchisake', prenda: 'gorra', diseno: 'gorraKuchisake', nombre: 'Gorra Trucker Kuchisake' },
  { slug: 'tote-studio', prenda: 'tote', diseno: 'toteStudio', nombre: 'Bolso Tote Studio' },
  { slug: 'pack-grupos-eventos', prenda: 'pack', diseno: 'packGrupos', nombre: 'Pack Grupos Eventos' },
];

const SPIN_SLUGS = PRODUCTOS.filter((p) => p.prenda !== 'pack').map((p) => p.slug);

/* ================================================================== *
 * 5 · productos: -1 frontal, -2 espalda, -3 detalle
 * ================================================================== */

const FONDOS = ['#F2F2F2', '#EDEDED', '#E8E4DC', '#FFFFFF'];

function fondoProducto(meta, i) {
  return fondo(1200, 1500, {
    base: FONDOS[i % FONDOS.length],
    tex: i % 3 === 0 ? 'dots' : i % 3 === 1 ? 'htFaint' : 'diag',
    band: 0.74,
  });
}

function productoFrontal(meta, i) {
  const box = PRENDAS[meta.prenda].box;
  const art = DISENOS[meta.diseno]();
  return doc({
    w: 1200, h: 1500,
    title: `${meta.nombre} — vista frontal (ilustracion vectorial monocroma)`,
    desc: `Silueta de ${PRENDAS[meta.prenda].label.toLowerCase()} en blanco con trazo negro, costuras punteadas y sombra difusa, con el estampado centrado "${meta.slug}" en negro, grises y blanco.`,
    defs: defsCore() + prendaDefs(meta.prenda),
    body:
      fondoProducto(meta, i) +
      `<g transform="scale(2)">` +
      prendaSvg(meta.prenda) +
      stamp(box, art, { clip: `pc-g-${meta.prenda}` }) +
      `</g>` +
      ticks(1200, 1500, 40, 2, '#000') +
      caption(66, 1392, `JAYLU / ${String(i + 1).padStart(2, '0')}`, meta.nombre.toUpperCase()) +
      chip(1134, 92, 'FRONTAL', { anchor: 'end' }),
  });
}

function productoEspalda(meta, i) {
  const box = PRENDAS[meta.prenda].box;
  const art = DISENOS[meta.diseno]();
  const bw = box.w * 0.66, bh = box.h * 0.66;
  const back = { x: box.x + (box.w - bw) / 2, y: box.y - 34, w: bw, h: bh };
  return doc({
    w: 1200, h: 1500,
    title: `${meta.nombre} — vista de espalda con badge ESPALDA (ilustracion vectorial)`,
    desc: 'Misma prenda en blanco con trazo negro; el estampado reducido y subido, mas un badge de texto ESPALDA en la esquina superior derecha.',
    defs: defsCore() + prendaDefs(meta.prenda),
    body:
      fondoProducto(meta, i + 1) +
      `<g transform="scale(2)">` +
      prendaSvg(meta.prenda) +
      stamp(back, art, { clip: `pc-g-${meta.prenda}` }) +
      `</g>` +
      ticks(1200, 1500, 40, 2, '#000') +
      caption(66, 1392, `JAYLU / ${String(i + 1).padStart(2, '0')}`, `${meta.nombre.toUpperCase()} · ESPALDA`) +
      chip(1134, 92, 'ESPALDA', { anchor: 'end' }),
  });
}

function productoDetalle(meta, i) {
  const art = DISENOS[meta.diseno]();
  const big = { x: 78, y: 96, w: 444, h: 507 };
  return doc({
    w: 1200, h: 1500,
    title: `${meta.nombre} — detalle ampliado del estampado en marco (ilustracion vectorial)`,
    desc: 'Zoom 2x del estampado dentro de un marco negro con ticks de registro, mas una miniatura de la prenda en la esquina inferior derecha.',
    defs: defsCore() + prendaDefs(meta.prenda),
    body:
      fondo(1200, 1500, { base: FONDOS[(i + 2) % FONDOS.length], tex: 'dots', band: 0.82 }) +
      marco(96, 128, 1008, 1108, { sw: 5 }) +
      ticks(96, 128, 34, 2.4) +
      `<g transform="scale(2)">` +
      marco(48, 64, 504, 560, { sw: 3, dash: ' stroke-dasharray="14 10"' }) +
      stamp(big, art) +
      `<g transform="translate(452 566) scale(0.2)">` + prendaSvg(meta.prenda, { sombra: false, vol: 0.4 }) + `</g>` +
      `</g>` +
      caption(96, 96, 'DETALLE / STAMP 1:1', meta.slug) +
      chip(1104, 96, 'ZOOM', { anchor: 'end', size: 24 }),
  });
}

/* ================================================================== *
 * 6 · spin: 36 frames de rotacion falsa
 * ================================================================== */

const SPIN_K = 1.1;
const SPIN_TX = (900 - 600 * SPIN_K) / 2;
const SPIN_TY = (900 - 750 * SPIN_K) / 2;

function spinFrame(meta, i) {
  const theta = i * 10; // grados
  const rad = (theta * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const cs = (c < 0 ? -1 : 1) * Math.max(Math.abs(c), 0.12); // nunca desaparece
  const dx = 420 * (theta / 360); // recorrido de una vuelta completa
  const wrap = dx <= 105 ? 1 : Math.max(0, 1 - (dx - 105) / 115);
  const op = (0.12 + 0.88 * Math.abs(c)) * wrap;
  const shOp = 0.08 + 0.52 * Math.abs(s);
  const box = PRENDAS[meta.prenda].box;
  const art = DISENOS[meta.diseno]();
  const gid = `g-${meta.prenda}`;

  return doc({
    w: 900, h: 900,
    title: `${meta.nombre} — spin ${String(i).padStart(2, '0')}/35 (${theta} grados, ilustracion vectorial)`,
    desc: `Frame de rotacion falsa: la prenda se comprime en X con factor ${N(cs)} y el estampado se desplaza ${N(dx)} px con opacidad ${N(op)}.`,
    defs: defsCore() + prendaDefs(meta.prenda),
    body:
      fondo(900, 900, { base: i % 2 ? '#F2F2F2' : '#EDEDED', tex: 'dots' }) +
      `<g transform="translate(450 0) scale(${N(cs)} 1) translate(-450 0)">` +
      `<g transform="translate(${N(SPIN_TX)} ${N(SPIN_TY)}) scale(${SPIN_K})">` +
      sombraSilueta(gid, 10, 18, 0.15) +
      `<use href="#${gid}" fill="#FFFFFF" stroke="#000" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>` +
      stamp(box, art, { dx: dx / SPIN_K, op, clip: `pc-${gid}` }) +
      shadeLateral(gid, s, shOp) +
      `</g></g>` +
      txt(30, 866, `${String(i).padStart(2, '0')}/35 · ${theta}°`, { size: 24, fill: '#9A9A9A', ls: 3 }) +
      txt(870, 866, meta.slug, { size: 20, fill: '#9A9A9A', anchor: 'end', ls: 2, op: 0.85 }),
  });
}

/* ================================================================== *
 * 7 · colecciones (2000 x 800)
 * ================================================================== */

const W = 2000, H = 800;

function ramasSecas(x, y, ang, len, w, depth) {
  if (depth === 0) return '';
  const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
  const mx = x + Math.cos(ang + 0.4) * len * 0.5, my = y + Math.sin(ang + 0.4) * len * 0.5;
  const out = `<path d="M${N(x)} ${N(y)}Q${N(mx)} ${N(my)} ${N(x2)} ${N(y2)}" fill="none" stroke="#000" stroke-width="${N(w)}" stroke-linecap="round"/>`;
  const s1 = rnd(x + y) * 0.7 + 0.35;
  return (
    out +
    ramasSecas(x2, y2, ang - s1, len * 0.66, w * 0.62, depth - 1) +
    ramasSecas(x2, y2, ang + s1 * 0.85, len * 0.7, w * 0.66, depth - 1)
  );
}

/**
 * Tipografia display gigante en gris claro: da escala editorial al banner sin competir
 * con la trama. Se dibuja debajo del resto del arte.
 */
const displayGhost = (str, x, y, size = 430, rot = -7) =>
  txt(x, y, str, { size, fill: '#DDDDDD', anchor: 'middle', stretch: 118, ls: 10, rot, sw: 3, stroke: '#CFCFCF' });

const COLECCIONES = {
  'anime-legends': (w, h) =>
    fondo(w, h, { base: '#EDEDED', tex: 'dots' }) +
    displayGhost('LEGENDS', 1090, 470) +
    `<circle cx="1390" cy="560" r="300" fill="url(#ht)" stroke="#000" stroke-width="4"/>` +
    veloc(1390, 560, 316, 430, 26, { sw: 3, op: 0.35 }) +
    `<rect x="0" y="560" width="${w}" height="240" fill="#000"/>` +
    Array.from({ length: 12 }, (_, i) => `<rect x="${i * 180}" y="600" width="110" height="200" fill="#EDEDED"/>`).join('') +
    `<rect x="0" y="0" width="760" height="${h}" fill="url(#diag)"/>` +
    `<path d="M120 520L640 300M120 640L520 380" stroke="#000" stroke-width="18" stroke-linecap="round"/>` +
    marco(40, 40, w - 80, h - 80, { sw: 3 }) +
    caption(80, 116, 'COLECCION', 'ANIME LEGENDS'),
  'neo-mythos': (w, h) =>
    fondo(w, h, { base: '#E8E4DC', tex: 'htFaint' }) +
    displayGhost('MYTHOS', 700, 620, 400) +
    `<circle cx="1470" cy="290" r="215" fill="#000"/>` +
    `<circle cx="1400" cy="230" r="42" fill="#E8E4DC"/><circle cx="1520" cy="350" r="58" fill="#E8E4DC"/>` +
    `<circle cx="1440" cy="200" r="22" fill="#B0B0B0"/><circle cx="1556" cy="238" r="16" fill="#B0B0B0"/>` +
    ramasSecas(300, 760, -Math.PI / 2, 190, 16, 4) +
    `<rect x="0" y="700" width="${w}" height="100" fill="#000" opacity="0.08"/>` +
    `<path d="M0 620H${w}" stroke="#000" stroke-width="2" stroke-dasharray="6 10"/>` +
    marco(40, 40, w - 80, h - 80, { sw: 3 }) +
    caption(90, 116, 'COLECCION', 'NEO MYTHOS'),
  'pixel-arena': (w, h) => {
    const CW = 18, CH = 8, P = 50;
    let px = '';
    for (let r = 0; r < CH; r++) {
      for (let c = 0; c < CW; c++) {
        const v = rnd(r * 31 + c * 7);
        if (v > 0.62) px += `<rect x="${c * P}" y="${r * P}" width="${P}" height="${P}" fill="#000"/>`;
        else if (v > 0.44) px += `<rect x="${c * P}" y="${r * P}" width="${P}" height="${P}" fill="#9A9A9A"/>`;
      }
    }
    return (
      fondo(w, h, { base: '#EDEDED', tex: 'none' }) +
      `<g transform="translate(300 150)">` +
      `<rect width="${CW * P}" height="${CH * P}" fill="#FFFFFF"/>` +
      `<rect width="${CW * P}" height="${CH * P}" fill="url(#pxgrid)"/>` + px +
      `<rect width="${CW * P}" height="${CH * P}" fill="none" stroke="#000" stroke-width="5"/>` +
      `<path d="${sparkle(200, 200, 120)}" fill="#FFFFFF"/>` +
      `</g>` +
      `<rect x="0" y="0" width="300" height="${h}" fill="url(#htFaint)"/>` +
      marco(40, 40, w - 80, h - 80, { sw: 3 }) +
      caption(80, 116, 'COLECCION', 'PIXEL ARENA')
    );
  },
  'mono-essential': (w, h) =>
    fondo(w, h, { base: '#FFFFFF', tex: 'none' }) +
    displayGhost('MONO', 1000, 500, 470, -6) +
    `<circle cx="1000" cy="400" r="210" fill="#000"/>` +
    `<rect x="200" y="120" width="300" height="560" fill="none" stroke="#000" stroke-width="14"/>` +
    `<path d="M1380 120L1700 680" stroke="#000" stroke-width="26" stroke-linecap="square"/>` +
    `<rect x="1560" y="180" width="120" height="120" fill="#000"/>` +
    `<circle cx="320" cy="600" r="52" fill="none" stroke="#000" stroke-width="8"/>` +
    `<path d="M0 400h240M1760 400h240" stroke="#000" stroke-width="3"/>` +
    marco(40, 40, w - 80, h - 80, { sw: 2 }) +
    ticks(w, h, 34, 2) +
    caption(80, 116, 'COLECCION', 'MONO ESSENTIAL'),
  'uniformes-escolares': (w, h) =>
    fondo(w, h, { base: '#F2F2F2', tex: 'pxgrid' }) +
    `<g transform="translate(760 70) scale(1.55)">` +
    `<rect x="-30" y="-30" width="480" height="540" fill="#FFFFFF"/>` +
    dEscudoEscolar() +
    `<rect x="-30" y="-30" width="480" height="540" fill="none" stroke="#000" stroke-width="3"/>` +
    `</g>` +
    `<path d="M60 400H620M1380 400H1940" stroke="#000" stroke-width="8" stroke-linecap="round"/>` +
    `<path d="M60 430H620M1380 430H1940" stroke="#000" stroke-width="2" stroke-dasharray="6 10"/>` +
    marco(40, 40, w - 80, h - 80, { sw: 3 }) +
    caption(80, 116, 'COLECCION', 'UNIFORMES ESCOLARES'),
  'drop-invierno-26': (w, h) =>
    fondo(w, h, { base: '#EDEDE9', tex: 'diag' }) +
    `<circle cx="1420" cy="300" r="250" fill="url(#ht)"/>` +
    `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#snow)"/>` +
    `<path d="M-100 760L900 120" stroke="#000" stroke-width="40" opacity="0.14"/>` +
    `<path d="M-60 820L980 150" stroke="#000" stroke-width="10" opacity="0.2"/>` +
    `<rect x="0" y="600" width="${w}" height="200" fill="#000"/>` +
    Array.from({ length: 26 }, (_, i) => `<rect x="${i * 80}" y="640" width="44" height="120" fill="#EDEDE9"/>`).join('') +
    marco(40, 40, w - 80, h - 80, { sw: 3 }) +
    caption(80, 116, 'DROP', 'INVIERNO 26'),
  'colab-mtz': (w, h) =>
    fondo(w, h, { base: '#F4F4F4', tex: 'dots' }) +
    displayGhost('MTZ', 900, 620, 400) +
    `<path d="M620 100L1180 700H120Z" fill="#000" opacity="0.32"/>` +
    `<circle cx="900" cy="400" r="250" fill="none" stroke="#000" stroke-width="30" opacity="0.4"/>` +
    `<rect x="1250" y="140" width="330" height="330" fill="url(#mesh)" stroke="#000" stroke-width="6"/>` +
    `<path d="${sparkle(1420, 520, 190)}" fill="#000" opacity="0.55"/>` +
    `<path d="M180 140C420 140 420 660 180 660C60 660 60 300 220 240" fill="none" stroke="#000" stroke-width="24" opacity="0.6"/>` +
    `<path d="M380 90L560 710" stroke="#000" stroke-width="14" opacity="0.5"/>` +
    `<circle cx="900" cy="400" r="120" fill="#FFFFFF" opacity="0.55"/>` +
    marco(40, 40, w - 80, h - 80, { sw: 3 }) +
    caption(80, 116, 'COLAB', 'MTZ'),
};

/* ================================================================== *
 * 8 · categorias (1200 x 900)
 * ================================================================== */

const CATEGORIAS = {
  franelas: { prenda: 'franela', base: '#F2F2F2', tex: 'dots', nombre: 'FRANELAS' },
  remeras: { prenda: 'franela', base: '#EDEDED', tex: 'diag', nombre: 'REMERAS' },
  hoodies: { prenda: 'hoodie', base: '#E8E4DC', tex: 'htFaint', nombre: 'HOODIES' },
  uniformes: { prenda: 'uniforme', base: '#FFFFFF', tex: 'pxgrid', nombre: 'UNIFORMES' },
  accesorios: { prenda: 'gorra', base: '#F2F2F2', tex: 'dots', nombre: 'ACCESORIOS' },
  'a-medida': { prenda: 'tote', base: '#EDEDED', tex: 'diag', nombre: 'A MEDIDA' },
};

function categoria(slug, cfg) {
  const K = 1.12;
  const body =
    fondo(1200, 900, { base: cfg.base, tex: cfg.tex, band: 0.78 }) +
    `<g transform="translate(${N((1200 - 600 * K) / 2)} ${N((900 - 750 * K) / 2)}) scale(${K})">` +
    (slug === 'a-medida'
      ? `<path d="M40 300H560M300 200V640" stroke="#9A9A9A" stroke-width="1.6" stroke-dasharray="10 10" clip-path="url(#c-g-tote)"/>` +
        `<path d="M40 300H560" stroke="#000" stroke-width="1.6" stroke-dasharray="10 10"/>`
      : '') +
    prendaSvg(cfg.prenda) +
    `</g>` +
    marco(40, 40, 1120, 820, { sw: 3 }) +
    ticks(40, 40, 34, 2) +
    chip(1128, 92, cfg.nombre, { anchor: 'end' }) +
    caption(76, 800, 'JAYLU / CATEGORIA', slug.toUpperCase());
  return doc({
    w: 1200, h: 900,
    title: `Categoria ${cfg.nombre} — silueta de prenda en gran formato (ilustracion vectorial monocroma)`,
    desc: 'Silueta de la prenda en blanco con trazo negro, costuras punteadas y sombra difusa sobre fondo claro con textura.',
    defs: defsCore() + prendaDefs(cfg.prenda),
    body,
  });
}

/* ================================================================== *
 * 9 · referencias del cliente (1000 x 1000, menor calidad, a lapiz)
 * ================================================================== */

const LAPIZ = 'fill="none" stroke="#5E5E5E" stroke-width="3" stroke-dasharray="12 9" stroke-linecap="round"';
const LAPIZ_T = 'fill="none" stroke="#5E5E5E" stroke-width="2.4" stroke-dasharray="5 7"';

function refDefs() {
  return (
    defsCore() +
    `<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="n"/>` +
    `<feColorMatrix in="n" type="saturate" values="0"/></filter>` +
    `<marker id="ah" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="9" markerHeight="9" orient="auto">` +
    `<path d="M0 0L12 6L0 12L3.5 6Z" fill="#5E5E5E"/></marker>`
  );
}

function nota(x, y, texto, o = {}) {
  const { rot = -4, size = 30, w = null } = o;
  const linesArr = String(texto).split('|');
  const ww = w || Math.max(...linesArr.map((l) => l.length)) * size * 0.58 + 34;
  const hh = linesArr.length * size * 1.3 + 22;
  return (
    `<g transform="rotate(${rot} ${x} ${y})">` +
    marco(x, y, ww, hh, { sw: 2.4, stroke: '#5E5E5E', dash: ' stroke-dasharray="7 6"' }) +
    linesArr.map((l, i) => txt(x + 17, y + size + i * size * 1.3, l, { size, fill: '#4A4A4A' })).join('') +
    `</g>`
  );
}

function flecha(d, o = {}) {
  return `<path d="${d}" ${LAPIZ_T}` +
    `${o.start ? ' marker-start="url(#ah)"' : ''} marker-end="url(#ah)"/>`;
}

function refDoc({ title, desc, body }) {
  return doc({
    w: 1000, h: 1000,
    title,
    desc,
    defs: refDefs(),
    body:
      fondo(1000, 1000, { base: '#E8E4DC', tex: 'none' }) +
      `<rect width="1000" height="1000" filter="url(#grain)" opacity="0.12"/>` +
      `<g transform="rotate(-2.4 500 500)">` + body + `</g>` +
      `<rect x="26" y="26" width="948" height="948" fill="none" stroke="#000" stroke-width="3" opacity="0.35"/>` +
      `<rect x="0" y="906" width="1000" height="94" fill="#000"/>` +
      txt(500, 966, 'FOTO DE REFERENCIA DEL CLIENTE · NO ES ARTE FINAL', {
        size: 30, fill: '#FFFFFF', anchor: 'middle', ls: 3, stretch: 860,
      }),
  });
}

const REFERENCIAS = {
  'mage-1': () =>
    refDoc({
      title: 'Referencia del cliente 1 — bosquejo a lapiz de un mago con sombrero puntiagudo (baja calidad, no arte final)',
      desc: 'Boceto tosco con trazos gruesos, etiquetas a lapiz y flechas que explican el pedido.',
      body:
        `<rect x="70" y="60" width="860" height="820" fill="#F2EDE2" stroke="#B9B2A4" stroke-width="6"/>` +
        `<g stroke="#000" stroke-width="9" fill="#F2EDE2" stroke-linejoin="round" stroke-linecap="round">` +
        `<path d="M250 520L500 180L750 520Z"/>` +
        `<path d="M200 520C300 490 700 490 800 520C700 570 300 570 200 520Z"/>` +
        `<path d="M300 640H700L760 860H240Z"/>` +
        `<path d="M760 560L830 850" stroke-width="12"/>` +
        `<circle cx="500" cy="590" r="80"/>` +
        `<path d="M430 630C450 720 550 720 570 630" />` +
        `</g>` +
        `<path d="M420 570h50M530 570h50" stroke="#000" stroke-width="14" stroke-linecap="round"/>` +
        flecha('M180 240L268 330') +
        nota(60, 120, '1) sombrero mas|ancho y puntiagudo') +
        nota(660, 300, '2) barba larga|como la foto', { rot: 5 }) +
        `<circle cx="500" cy="700" r="120" fill="none" stroke="#5E5E5E" stroke-width="5" stroke-dasharray="16 12"/>` +
        txt(500, 720, 'OK?', { size: 72, fill: '#5E5E5E', anchor: 'middle', stretch: 130 }),
  }),
  'mage-2': () =>
    refDoc({
      title: 'Referencia del cliente 2 — segundo bosquejo del mago con baston y capa (baja calidad, no arte final)',
      desc: 'Boceto tosco con anotaciones a lapiz sobre color y bordes.',
      body:
        `<rect x="60" y="70" width="880" height="800" fill="#EFEBE0" stroke="#B9B2A4" stroke-width="6"/>` +
        `<g stroke="#000" stroke-width="9" fill="#EFEBE0" stroke-linejoin="round" stroke-linecap="round">` +
        `<path d="M500 140L620 300H380Z"/>` +
        `<path d="M330 300C300 420 280 560 300 800H700C720 560 700 420 670 300Z"/>` +
        `<path d="M300 800C240 760 220 660 250 560"/>` +
        `<path d="M700 800C760 760 780 660 750 560"/>` +
        `<path d="M760 420L790 850" stroke-width="12"/>` +
        `<circle cx="775" cy="380" r="52"/>` +
        `</g>` +
        `<path d="M420 380l60 40M580 380l-60 40" stroke="#000" stroke-width="12" stroke-linecap="round"/>` +
        flecha('M240 500L352 600') +
        nota(70, 130, '3) capa con ondas|no muy lisa', { rot: 3 }) +
        nota(600, 640, '4) SIN COLOR|mono blanco y negro') +
        `<path d="M120 700h200" stroke="#5E5E5E" stroke-width="4" stroke-dasharray="14 10"/>` +
        flecha('M320 700L400 700'),
  }),
  'grupo-1': () =>
    refDoc({
      title: 'Referencia del cliente 3 — grupo de 3 personas con rayo entre ellas (ilustracion, baja calidad, no arte final)',
      desc: 'Tres siluetas toscas a lapiz con flechas y una nota con la cantidad exacta de personas.',
      body:
        `<rect x="60" y="80" width="880" height="790" fill="#F2EDE2" stroke="#B9B2A4" stroke-width="6"/>` +
        `<g stroke="#000" stroke-width="9" fill="#EFEBE0" stroke-linejoin="round" stroke-linecap="round">` +
        `<circle cx="280" cy="330" r="62"/><path d="M200 400H360L390 620H170Z"/><path d="M170 620h100l-10 200H180ZM280 620h100l10 200H290Z"/>` +
        `<circle cx="500" cy="290" r="70"/><path d="M410 366H590L620 610H380Z"/><path d="M380 610h120l-10 210H390ZM500 610h120l10 210H510Z"/>` +
        `<circle cx="720" cy="330" r="62"/><path d="M640 400H800L830 620H610Z"/><path d="M610 620h100l-10 200H620ZM720 620h100l10 200H730Z"/>` +
        `</g>` +
        `<path d="${rayo(390, 500, 200)}" fill="#000"/>` +
        flecha('M180 180L268 262') +
        nota(620, 160, 'SON 3 PERSONAS|una al lado de|la otra', { rot: 4 }) +
        nota(120, 560, '5) mismo alto|las tres', { rot: -6 }) +
        `<path d="M60 840H940" stroke="#5E5E5E" stroke-width="4" stroke-dasharray="16 12"/>`,
    }),
  'uniforme-escudo': () =>
    refDoc({
      title: 'Referencia del cliente 4 — escudo escolar con laurel y dos estrellas (baja calidad, no arte final)',
      desc: 'Escudo dibujado a mano con lineas de trazo gruesas y anotaciones.',
      body:
        `<rect x="70" y="70" width="860" height="800" fill="#F2EDE2" stroke="#B9B2A4" stroke-width="6"/>` +
        `<path d="M500 160L760 220C760 470 660 690 500 800C340 690 240 470 240 220Z" fill="#F2EDE2" stroke="#000" stroke-width="11" stroke-linejoin="round"/>` +
        `<path d="M500 200L720 250C720 460 636 650 500 748C364 650 280 460 280 250Z" ${LAPIZ}/>` +
        `<path d="${starPath(370, 330, 52)}" fill="#000"/><path d="${starPath(630, 330, 52)}" fill="#000"/>` +
        `<path d="M360 560C420 700 580 700 640 560" ${LAPIZ}/>` +
        flecha('M200 300L300 350') +
        nota(80, 140, '6) escudo va|al pecho izq.', { rot: 3 }) +
        nota(640, 560, '7) DTF textil|sin costura', { rot: -5 }) +
        txt(500, 480, 'J B', { size: 150, fill: '#5E5E5E', anchor: 'middle', stretch: 200 }),
  }),
  'custom-1': () =>
    refDoc({
      title: 'Referencia del cliente 5 — custom con rayo y estrella, medida dudosa (baja calidad, no arte final)',
      desc: 'Tanda minima dibujada a mano con interrogantes y anotaciones de medida.',
      body:
        `<rect x="70" y="90" width="860" height="760" fill="#EFEBE0" stroke="#B9B2A4" stroke-width="6"/>` +
        `<circle cx="470" cy="450" r="250" fill="none" stroke="#000" stroke-width="9" stroke-dasharray="26 20"/>` +
        `<path d="${rayo(430, 450, 480)}" fill="#000" stroke="#000" stroke-width="9" stroke-linejoin="round"/>` +
        `<path d="${sparkle(700, 260, 90)}" fill="#000"/>` +
        flecha('M220 700L360 560') +
        nota(80, 180, '8) asi va el|logo del estudio') +
        nota(700, 620, '9) medida?|confirmar', { rot: 6 }) +
        `<path d="M240 560L700 560" stroke="#5E5E5E" stroke-width="4" stroke-dasharray="14 10"/>` +
        flecha('M240 560L700 560', { start: true }) +
        txt(470, 800, '~ 30 cm de ancho aprox.', { size: 34, fill: '#5E5E5E', anchor: 'middle' }),
    }),
};

/* ================================================================== *
 * 10 · escritura en disco + resumen
 * ================================================================== */

const escrito = [];
const bytes = [];

function write(rel, content) {
  const file = join(OUT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content, 'utf8');
  escrito.push(rel);
  bytes.push(Buffer.byteLength(content, 'utf8'));
}

const fmt = (n) => n.toLocaleString('es-AR');

/* A) productos -------------------------------------------------------- */
PRODUCTOS.forEach((meta, i) => {
  write(`products/${meta.slug}-1.svg`, productoFrontal(meta, i));
  write(`products/${meta.slug}-2.svg`, productoEspalda(meta, i));
  write(`products/${meta.slug}-3.svg`, productoDetalle(meta, i));
});

/* B) spin ------------------------------------------------------------- */
for (const slug of SPIN_SLUGS) {
  const meta = PRODUCTOS.find((p) => p.slug === slug);
  for (let i = 0; i < 36; i++) {
    write(`spin/${slug}/${String(i).padStart(2, '0')}.svg`, spinFrame(meta, i));
  }
}

/* C) colecciones ------------------------------------------------------ */
for (const [slug, fn] of Object.entries(COLECCIONES)) {
  write(
    `collections/${slug}.svg`,
    doc({
      w: W, h: H,
      title: `Banner de coleccion ${slug} — composicion abstracta monocroma`,
      desc: 'Banner editorial 2000x800 en blanco, negro y grises: semitono, lineas de velocidad, formas geometricas y tipografia condensada.',
      defs: defsCore(),
      body: fn(W, H),
    })
  );
}

/* D) categorias ------------------------------------------------------- */
for (const [slug, cfg] of Object.entries(CATEGORIAS)) {
  write(`categories/${slug}.svg`, categoria(slug, cfg));
}

/* E) referencias ------------------------------------------------------ */
for (const [name, fn] of Object.entries(REFERENCIAS)) {
  write(`references/${name}.svg`, fn());
}

/* resumen ------------------------------------------------------------- */
const porGrupo = (prefijo) => escrito.filter((f) => f.startsWith(prefijo)).length;
const max = Math.max(...bytes);
const maxFile = escrito[bytes.indexOf(max)];

console.log('');
console.log('  JayLu · assets SVG de demostracion generados');
console.log('  ' + '-'.repeat(56));
console.log(`  products/     ${fmt(porGrupo('products/'))}  (${PRODUCTOS.length} slugs x 3 vistas)`);
console.log(`  spin/         ${fmt(porGrupo('spin/'))}  (${SPIN_SLUGS.length} slugs x 36 frames)`);
console.log(`  collections/  ${fmt(porGrupo('collections/'))}`);
console.log(`  categories/   ${fmt(porGrupo('categories/'))}`);
console.log(`  references/   ${fmt(porGrupo('references/'))}`);
console.log('  ' + '-'.repeat(56));
console.log(`  total         ${fmt(escrito.length)} archivos SVG`);
console.log(`  tamano max    ${(max / 1024).toFixed(2)} KB  (${maxFile})`);
console.log(`  ruta          ${OUT}`);
console.log('');
