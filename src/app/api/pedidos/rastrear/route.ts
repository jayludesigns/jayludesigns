import { getOrderByNumber, orderToken } from "@/lib/data/orders";
import { LIMITES, clientKey, consumirIntento } from "@/lib/security";
import { normalizePhone } from "@/lib/utils";

/**
 * Rastreo público de un pedido.
 *
 * El número de pedido es correlativo, así que no basta: se compara también el
 * teléfono con el registrado. Si ambos coinciden se devuelve la URL firmada
 * del pedido, que es la misma que recibió el cliente al comprar.
 *
 * Además se cierran los límites: los números se cuentan, de modo que probarlos
 * uno a uno agota la ventana. Y cuando el pedido existe pero el teléfono no
 * cuadra se responde igual que cuando no existe, para no confirmar que ese
 * número de pedido está dado de alta.
 */
export async function POST(request: Request) {
  const clave = await clientKey();
  const restantes = await consumirIntento(`rastreo:${clave}`, LIMITES.rastreo);
  if (restantes > 0) {
    const minutos = Math.max(1, Math.ceil(restantes / 60));
    return Response.json(
      {
        error: `Demasiadas consultas. Vuelve a intentarlo en ${minutos} ${minutos === 1 ? "minuto" : "minutos"}.`,
      },
      { status: 429 },
    );
  }

  let body: { orderNumber?: string; phone?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const number = body.orderNumber?.trim() ?? "";
  const phone = normalizePhone(body.phone);
  if (!number || !phone) {
    return Response.json(
      { error: "Falta el número de pedido o el teléfono." },
      { status: 400 },
    );
  }

  // Mismo mensaje y mismo código para los dos fallos: no revela qué números de
  // pedido existen.
  const sinCoincidencia = () =>
    Response.json(
      { error: "No encontramos un pedido con esos datos." },
      { status: 404 },
    );

  const order = await getOrderByNumber(number);
  if (!order) return sinCoincidencia();

  // Se comparan los últimos dígitos: el cliente puede escribirlo con o sin
  // guiones, con o sin el prefijo del país.
  const stored = normalizePhone(order.customer_phone).slice(-7);
  if (stored.length < 7 || !stored.endsWith(phone.slice(-7))) {
    return sinCoincidencia();
  }

  return Response.json({ url: `/pedido/${order.order_number}?t=${orderToken(order)}` });
}
