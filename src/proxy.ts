import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyToken, ADMIN_LOGIN_PATH } from "@/lib/auth";

/**
 * Guardia de rutas del panel.
 *
 * Solo comprueba que haya una sesión válida: la autorización real se repite
 * dentro de cada server action, porque las server actions llegan por POST a
 * la ruta donde se declararon y no siempre pasan por aquí.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = verifyToken(request.cookies.get(ADMIN_COOKIE)?.value);
  const isLogin = pathname === ADMIN_LOGIN_PATH;

  if (!session && !isLogin) {
    const url = new URL(ADMIN_LOGIN_PATH, request.url);
    if (pathname !== "/admin") url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (session && isLogin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
