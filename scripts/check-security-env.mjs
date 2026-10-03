// Comprueba que en producción estén puestas las variables que sostienen la
// seguridad. Sin esto, un despliegue se lleva por delante un panel abierto o una
// tienda que nadie puede cambiar desde el panel.
//
//   node scripts/check-security-env.mjs                       → solo informa
//   node scripts/check-security-env.mjs --entorno=production  → falla si algo falta

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const raiz = process.cwd();
const produccion = process.argv.includes("--entorno=production");

const leer = (ruta) => {
  try {
    return readFileSync(join(raiz, ruta), "utf8");
  } catch {
    return "";
  }
};

const env = leer(".env.local") + "\n" + leer(".env") + "\n" + leer(".env.example");

// Busca "CLAVE=" o "CLAVE = valor" en un archivo de entorno.
function valorEn(clave) {
  const m = env.match(new RegExp(`^\\s*${clave}\\s*=\\s*(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
}

const NIVEL_PRODUCCION = 20;
const NIVEL_AVISO = 10;

const chequeos = [
  {
    clave: "ADMIN_SESSION_SECRET",
    obligatoria: true,
    nivel: NIVEL_PRODUCCION,
    motivo: "Firma las sesiones del panel y los enlaces de pedido. Sin ella el código lanza error en vez de firmar con una constante del repositorio.",
    valida: (v) => v.length >= 32 && !/cambia-esto/i.test(v),
    explica: "debe tener al menos 32 caracteres y no ser la de ejemplo",
  },
  {
    clave: "ADMIN_PASSWORD",
    obligatoria: true,
    nivel: NIVEL_PRODUCCION,
    motivo: "Única contraseña del panel. Es lo que un atacante va a adivinar.",
    valida: (v) => v.length >= 16 && v !== "jaylu2026",
    explica: "debe tener al menos 16 caracteres y no ser la de ejemplo",
  },
  {
    clave: "ADMIN_EMAIL",
    obligatoria: false,
    nivel: NIVEL_AVISO,
    motivo: "Correo del panel.",
    valida: () => true,
  },
  {
    clave: "SUPABASE_SERVICE_ROLE_KEY",
    obligatoria: true,
    nivel: NIVEL_PRODUCCION,
    motivo: "Única vía para que el panel escriba en Postgres. Nunca se envía al navegador.",
    valida: (v) => v.length > 20,
    explica: "parece una clave de servicio de verdad",
  },
  {
    clave: "NEXT_PUBLIC_SUPABASE_URL",
    obligatoria: true,
    nivel: NIVEL_PRODUCCION,
    motivo: "Dirección del proyecto de Supabase.",
    valida: (v) => /^https:\/\/.+\.supabase\.co/.test(v),
    explica: "debe ser la URL https://<proyecto>.supabase.co",
  },
  {
    clave: "NEXT_PUBLIC_SITE_URL",
    obligatoria: false,
    nivel: NIVEL_AVISO,
    motivo: "Con esto se arman los enlaces de pedido y los correos.",
    valida: (v) => /^https:\/\//.test(v),
    explica: "debe empezar por https://",
  },
  {
    clave: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    obligatoria: false,
    nivel: NIVEL_AVISO,
    motivo:
      "No hace falta para nada: el servidor usa la clave de servicio. Definirla solo abre la API pública de Supabase a quien la lea.",
    avisaContra: true,
    valida: () => true,
  },
];

const problemas = [];
const avisos = [];

console.log("");
console.log("=== Variables de seguridad ===");

for (const c of chequeos) {
  const valor = valorEn(c.clave);

  if (valor === null || valor === "") {
    if (c.avisaContra) continue;
    const texto = `${c.clave} no está definida. ${c.motivo}`;
    if (c.obligatoria && produccion) problemas.push(texto);
    else avisos.push(texto);
    console.log(`  ?  ${c.clave}`);
    continue;
  }

  const bien = c.valida(valor);
  if (bien) {
    console.log(`  ok ${c.clave}`);
    continue;
  }

  const texto = `${c.clave} está definida pero ${c.explica ?? "no cumple lo mínimo"}.`;
  if (c.obligatoria && produccion) problemas.push(texto);
  else avisos.push(texto);
  console.log(`  X  ${c.clave}`);
}

// Que ninguna clave real se haya quedado en el control de versiones.
// Que ninguna clave real se haya quedado en el control de versiones. Se le
// pregunta a git, que es quien sabe interpretar los patrones.
for (const archivo of [".env", ".env.local", ".env.production"]) {
  try {
    readFileSync(join(raiz, archivo), "utf8");
  } catch {
    continue; // No existe en esta máquina, nada que comprobar.
  }
  try {
    execFileSync("git", ["check-ignore", "-q", archivo], { cwd: raiz, stdio: "ignore" });
  } catch {
    avisos.push(`${archivo} existe y no está en .gitignore. No debería subirse nunca.`);
  }
}

console.log("");
for (const a of avisos) console.log(`  aviso: ${a}`);
for (const p of problemas) console.log(`  FALLO: ${p}`);

if (problemas.length > 0) {
  console.log("");
  console.log(`Faltan ${problemas.length} cosa(s) para desplegar con seguridad.`);
  process.exit(1);
}

console.log(produccion ? "Listo para producción." : "Sin fallos graves (no es producción).");
console.log("");