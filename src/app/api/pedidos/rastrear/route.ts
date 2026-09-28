import { getOrderByNumber, orderToken } from "@/lib/data/orders";
import { normalizePhone } from "@/lib/utils";

/**
 * Rastreo público de un pedido.
 *
 * El número de pedido es correlativo, así que no basta: se compara también el
 * teléfono con el registrado. Si ambos coinciden se devuelve la URL firmada
 * del pedido, que es la misma que recibió el cliente al comprar.
 */
export async function POST(request: Request) {
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

  const order = await getOrderByNumber(number);
  if (!order) {
    return Response.json({ error: "No encontramos ese número de pedido." }, { status: 404 });
  }

  // Se comparan los últimos dígitos: el cliente puede escribirlo con o sin
  // guiones, con o sin el prefijo del país.
  const stored = normalizePhone(order.customer_phone).slice(-7);
  if (stored.length < 7 || !stored.endsWith(phone.slice(-7))) {
    return Response.json(
      { error: "El teléfono no coincide con ese pedido." },
      { status: 403 },
    );
  }

  return Response.json({ url: `/pedido/${order.order_number}?t=${orderToken(order)}` });
}
