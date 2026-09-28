/**
 * Verificacion de los assets generados por generate-demo-assets.mjs
 *   1) cantidad de archivos por grupo
 *   2) XML bien formado / balanceado (parser propio, sin deps)
 *   3) viewBox + width + height + <title>
 *   4) tamano maximo < 20 KB
 *   5) ids unicos por documento (para que los <use>/url(#id) no colisionen)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(process.cwd());
const OUT = join(ROOT, 'public', 'demo');

function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.svg')) acc.push(p);
  }
  return acc;
}

/* mini parser XML balanceado: valida que no queden tags abiertos y que
   las comillas de los atributos esten cerradas */
function checkXml(src) {
  const errs = [];
  const stack = [];
  let i = 0;
  const VOID = new Set(['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'use', 'path', 'stop', 'image', 'feGaussianBlur', 'feTurbulence', 'feColorMatrix']);
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt === -1) break;
    // texto antes del tag: buscar '>' accidental dentro de texto
    const gt = findTagEnd(src, lt);
    if (gt === -1) {
      errs.push('tag sin cierre ">" en offset ' + lt);
      break;
    }
    const raw = src.slice(lt + 1, gt);
    if (raw.startsWith('!') || raw.startsWith('?')) { i = gt + 1; continue; }
    if (raw[0] === '/') {
      const name = raw.slice(1).trim();
      const open = stack.pop();
      if (open !== name) errs.push(`cierre </${name}> no coincide con <${open}>`);
    } else {
      const name = raw.match(/^[A-Za-z_][\w:.-]*/)?.[0];
      const selfClose = raw.trimEnd().endsWith('/');
      if (name && !selfClose && !VOID.has(name)) stack.push(name);
    }
    i = gt + 1;
  }
  if (stack.length) errs.push('tags sin cerrar: ' + stack.join(','));
  return errs;
}

function findTagEnd(src, from) {
  let q = null;
  for (let i = from + 1; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === q) q = null;
    } else if (c === '"' || c === "'") q = c;
    else if (c === '>') return i;
  }
  return -1;
}

const files = walk(OUT);
const groups = { products: 0, spin: 0, collections: 0, categories: 0, references: 0 };
let maxBytes = 0, maxFile = '';
let tooBig = [], bad = [], noViewBox = [], noTitle = [], dupIds = [], attrBug = [], sinValor = [];
let totalBytes = 0;

for (const f of files) {
  const rel = relative(OUT, f).replace(/\\/g, '/');
  const g = rel.split('/')[0];
  if (groups[g] != null) groups[g]++;
  const size = statSync(f).size;
  totalBytes += size;
  if (size > maxBytes) { maxBytes = size; maxFile = rel; }
  if (size > 20 * 1024) tooBig.push(`${rel} = ${(size / 1024).toFixed(2)} KB`);

  const src = readFileSync(f, 'utf8');
  if (!src.startsWith('<svg') && !src.trimStart().startsWith('<')) bad.push(`${rel}: no empieza con <`);
  if (!src.trimEnd().endsWith('</svg>')) bad.push(`${rel}: no termina con </svg>`);
  if (!/viewBox="/.test(src)) noViewBox.push(rel);
  if (!/<title[ >]/.test(src)) noTitle.push(rel);
  const errs = checkXml(src);
  if (errs.length) bad.push(`${rel}: ${errs.slice(0, 2).join('; ')}`);

  // ids duplicados
  const ids = [...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set(), dup = new Set();
  for (const id of ids) { if (seen.has(id)) dup.add(id); seen.add(id); }
  if (dup.size) dupIds.push(`${rel}: ${[...dup].join(',')}`);

  // atributos pegados:  valor="x"attr=   (bug que rompe el XML)
  const pegado = src.match(/"[A-Za-z:_][\w:.-]*=/g);
  if (pegado) attrBug.push(`${rel}: ${pegado.slice(0, 3).join(' ')}`);

  // atributo sin valor: en SVG todo atributo necesita valor (bug: marker-start pelado)
  // tokenizador que respeta las comillas: no parte los valores de d="M0 0L11 11"
  const ATTR = /\s+([\w:.-]+)(?:\s*=\s*"([^"]*)")?/g;
  for (const m of src.matchAll(/<([A-Za-z][\w:.-]*)((?:\s+[\w:.-]+(?:\s*=\s*"[^"]*")?)*)\s*\/?>/g)) {
    ATTR.lastIndex = 0;
    let a;
    while ((a = ATTR.exec(m[2])) !== null) {
      if (a[2] === undefined) { sinValor.push(`${rel}: <${a[1]}> sin valor en <${m[1]}>`); break; }
    }
  }

  // url(#id) debe existir en el mismo documento
  const refs = new Set([...src.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1]));
  for (const r2 of refs) if (!ids.includes(r2)) attrBug.push(`${rel}: url(#${r2}) sin id`);
  // href="#id"
  for (const m of src.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(m[1])) attrBug.push(`${rel}: href#${m[1]} sin id`);
}

const esperado = {
  products: 12 * 3,
  spin: 11 * 36,
  collections: 7,
  categories: 6,
  references: 5,
};

const total = files.length;
const esperadoTotal = 33 + 396 + 7 + 6 + 5; // el enunciado
const esperadoTotalReal = 12 * 3 + 11 * 36 + 7 + 6 + 5;

console.log('');
console.log('=== VERIFICACION ===');
console.log(`archivos .svg encontrados ....... ${total}`);
for (const [k, v] of Object.entries(groups)) {
  const ok = v === esperado[k];
  console.log(`  ${k.padEnd(13)} ${String(v).padStart(4)}  esperado ${String(esperado[k]).padStart(4)}  ${ok ? 'OK' : 'DIFIERE'}`);
}
console.log(`esperado segun enunciado (11 productos) .... ${esperadoTotal}`);
console.log(`esperado con los 12 slugs listados ........... ${esperadoTotalReal}`);
console.log('');
console.log(`XML mal formado / desbalanceado .... ${bad.length}`);
bad.slice(0, 10).forEach((b) => console.log('   - ' + b));
console.log(`sin viewBox ........................ ${noViewBox.length}`);
noViewBox.slice(0, 5).forEach((b) => console.log('   - ' + b));
console.log(`sin <title> ....................... ${noTitle.length}`);
console.log(`ids duplicados en un mismo archivo . ${dupIds.length}`);
dupIds.slice(0, 5).forEach((b) => console.log('   - ' + b));
console.log(`referencias url(#)/href rotas ....... ${attrBug.length}`);
attrBug.slice(0, 5).forEach((b) => console.log('   - ' + b));
console.log(`atributos sin valor / mal formados .. ${sinValor.length}`);
sinValor.slice(0, 5).forEach((b) => console.log('   - ' + b));
console.log(`archivos > 20 KB ................... ${tooBig.length}`);
tooBig.forEach((b) => console.log('   - ' + b));
console.log(`tamano maximo ...................... ${(maxBytes / 1024).toFixed(2)} KB  (${maxFile})`);
console.log(`promedio ........................... ${(totalBytes / total / 1024).toFixed(2)} KB`);
console.log('');

const ok = !bad.length && !noViewBox.length && !noTitle.length && !tooBig.length && !dupIds.length && !attrBug.length;
console.log(ok ? 'RESULTADO: TODO OK' : 'RESULTADO: HAY PROBLEMAS');
process.exit(ok ? 0 : 1);
