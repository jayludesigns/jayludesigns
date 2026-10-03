/**
 * Utilidades de protección de la tienda.
 *
 * Aquí vive lo que frena a un atacante sin montar servicios nuevos:
 *
 *  - Un limitador de intentos por ventana para el acceso al panel, el rastreo
 *    de pedidos y los formularios públicos. Sin esto, la contraseña del panel
 *    se puede adivinar por fuerza bruta y cualquiera puede llenar la base de
 *    datos de pedidos falsos.
 *  - Un limpiador de mensajes de error. Los errores de la base de datos traen
 *    nombres de tablas y columnas; en un formulario público eso no le sirve de
 *    nada a quien lo ve y sí le sirve a quien quiere mapear el sistema.
 */

import { createHash } from "node:crypto";
import { headers } from "next/headers";

/* ------------------------------------------------------------------ */
/* Identidad del que llama                                             */
/* ------------------------------------------------------------------ */

/**
 * Clave opaca de la petición en curso.
 *
 * Se combina IP, agente y un fragmento de `accept-language`. Va hasheada para no
 * guardar direcciones IP en claro: si algún día estas ventanas se persisten,
 * lo que queda en la base es un digest, no un dato personal.
 */
export async function clientKey(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("cf-connecting-ip")?.trim() ||
    "desconocida";
  const agente = h.get("user-agent")?.slice(0, 64) ?? "";
  const idioma = h.get("accept-language")?.slice(0, 24) ?? "";
  return createHash("sha256")
    .update(`${ip}|${agente}|${idioma}`)
    .digest("base64url")
    .slice(0, 32);
}

/* ------------------------------------------------------------------ */
/* Limitador de intentos                                               */
/* ------------------------------------------------------------------ */

export interface Limite {
  /** Cuántos intentos se permiten dentro de la ventana. */
  max: number;
  /** Largo de la ventana, en milisegundos. */
  ventanaMs: number;
}

/** Marcas de tiempo de los intentos fallidos, por cubo. */
const intentos = new Map<string, number[]>();

function purgar(cubo: string, ahora: number, ventanaMs: number): number[] {
  const lista = (intentos.get(cubo) ?? []).filter((t) => ahora - t < ventanaMs);
  intentos.set(cubo, lista);
  return lista;
}

/**
 * Segundos que faltan para que se abra la ventana. 0 si no está bloqueado.
 *
 * Solo mira: no cuenta nada. Sirve para el acceso al panel, donde cuenta el
 * fallo y no el acierto, para no echar al administrador que se equivoca dos
 * veces seguidas y luego entra bien.
 */
export async function segundosBloqueados(cubo: string, limite: Limite): Promise<number> {
  const ahora = Date.now();
  const lista = purgar(cubo, ahora, limite.ventanaMs);
  if (lista.length < limite.max) return 0;
  const masAntigua = lista[0];
  return Math.max(0, Math.ceil((masAntigua + limite.ventanaMs - ahora) / 1000));
}

/** Anota un intento fallido. */
export async function anotarFallo(cubo: string, limite: Limite): Promise<void> {
  const ahora = Date.now();
  const lista = purgar(cubo, ahora, limite.ventanaMs);
  lista.push(ahora);
  intentos.set(cubo, lista);

  // Poda de las claves que ya no sirven, para que el Map no crezca sin fin si
  // alguien barre muchas direcciones.
  if (intentos.size > 5000) {
    for (const [clave, marcas] of intentos) {
      if (marcas.every((t) => ahora - t >= limite.ventanaMs)) intentos.delete(clave);
    }
  }
}

/**
 * Cuenta un intento. Devuelve los segundos restantes si queda bloqueado, o 0 si
 * pasa. Pensado para los formularios de clientes, donde todo intento cuenta
 * porque el envío en sí ya es el abuso.
 */
export async function consumirIntento(cubo: string, limite: Limite): Promise<number> {
  const bloqueado = await segundosBloqueados(cubo, limite);
  if (bloqueado > 0) return bloqueado;
  await anotarFallo(cubo, limite);
  return 0;
}

/* ------------------------------------------------------------------ */
/* Mensajes de error                                                   */
/* ------------------------------------------------------------------ */

/**
 * Traduce un fallo interno a algo que sí se le pueda decir a un cliente.
 *
 * El detalle se queda en el registro del servidor. El esquema vive en un
 * repositorio público, así que filtrar nombres de tabla no filtra un secreto,
 * pero sí confirma qué versión del sistema hay desplegada y ayuda a encajar un
 * ataque; y algunos errores del controlador traen más de lo que uno cree.
 */
export function errorAlCliente(error: unknown, contexto: string, sustituto: string): string {
  console.error(`[${contexto}]`, error);
  return sustituto;
}

/** Los cubos y sus ventanas, en un sitio para no inventar números por ahí. */
export const LIMITES = {
  panel: { max: 5, ventanaMs: 15 * 60_000 },
  rastreo: { max: 10, ventanaMs: 15 * 60_000 },
  pedido: { max: 6, ventanaMs: 60 * 60_000 },
  diseno: { max: 4, ventanaMs: 60 * 60_000 },
  contacto: { max: 5, ventanaMs: 60 * 60_000 },
  subida: { max: 40, ventanaMs: 60 * 60_000 },
} satisfies Record<string, Limite>;