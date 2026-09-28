# JayLu

Tienda y panel de administración para una marca de franelas y prendas estampadas
en Venezuela. Next.js full-stack, catálogo con colecciones y promociones, visor
360° de producto, solicitudes de diseño a medida, y un panel completo para
gestionar catálogo, inventario, pedidos, clientes y finanzas.

Los colores son solo blanco y negro. Sin excepción, también en el panel.

---

## Arrancar en 30 segundos

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>. No hace falta configurar nada: la app detecta que
no hay Supabase, usa un backend local basado en un archivo JSON (`.data/db.json`)
y lo rellena en el primer arranque con el catálogo de demostración: 12 productos,
8 colecciones, 9 pedidos y 128 variantes de ejemplo. Si borras ese archivo,
vuelve a construirse igual.

**Panel:** <http://localhost:3000/admin> — usuario `admin@jaylu.ve`, contraseña
`jaylu2026`. En desarrollo, si no hay variables de entorno, la propia página de
ajustes muestra las credenciales en pantalla.

### Otros puertos

```bash
npm run dev -- -p 3210
```

La URL pública se deduce sola de la cabecera `Host`, así que el sitemap, el
`robots.txt` y los enlaces para compartir funcionan en cualquier puerto. En
producción hay que fijar `NEXT_PUBLIC_SITE_URL`.

---

## Qué hay dentro

### Técnicas de estampado

El taller ofrece hoy **sublimación** y **DTF textil**, nada más. La lista vive
en un solo sitio, `PRINT_TECHNIQUES` en `src/lib/types.ts`, y alimenta tanto el
selector del panel como el desplegable de "Tu diseño" de la web. Añadir
serigrafía o bordado más adelante es agregar una entrada ahí: el resto de la
app ya lee de esa constante.

### Tienda (`/`)

| Ruta | Qué hace |
| --- | --- |
| `/` | Portada: destacados, colecciones y catálogo reciente |
| `/catalogo` | Todos los productos, con filtros por categoría, colección, talla, color, precio y orden |
| `/colecciones` · `/colecciones/[slug]` | Colecciones publicadas, con su cuenta de productos |
| `/producto/[slug]` | Ficha con galería, selector de talla/color, visor 360° y reseñas |
| `/carrito` | Carrito en `localStorage`, sin servidor |
| `/checkout` | Checkout en tres pasos, con recálculo de precios en el servidor |
| `/pedido/[orderNumber]?t=…` | Seguimiento del pedido con enlace privado firmado |
| `/pedido/buscar` | Rastrear un pedido con número y correo |
| `/diseno-a-medida` | Solicitud de diseño: foto de referencia y/o descripción, al menos una |
| `/nosotros` · `/contacto` | Institucional y formulario de contacto |
| `/offline` | Pantalla de la PWA cuando no hay red |

Instala como aplicación, funciona sin conexión con la última visita cacheada y
tiene icono propio (`public/icons/`).

### Panel (`/admin`)

| Sección | Qué hace |
| --- | --- |
| **Resumen** | Ventas de hoy y del mes, pedidos abiertos, stock bajo, tareas de CRM pendientes |
| **Productos** | Alta y edición, galería, colores, precios por volumen, variantes, SEO, peso de envío, fotos 360° |
| **Colecciones** | Colecciones con banner, tema, ventana de publicación y orden de productos |
| **Promociones** | Descuentos por producto o por colección, en porcentaje o monto fijo, con fecha y prioridad |
| **Inventario** | Stock por talla × color, con libro de movimientos. **Materia prima**: tela, tintas, papel de sublimación, film DTF y empaque, con entradas, salidas y merma |
| **Pedidos** | Todos los pedidos, y alta manual para ventas que no pasaron por la web. Ficha completa con estados, pago, notas y comprobante |
| **Diseños** | Solicitudes a medida: estado, precio cotizado, plazo y datos de contacto |
| **Clientes** | Fichas con todo su historial de pedidos y unidades compradas |
| **CRM** | Leads, notas, llamadas y tareas de seguimiento |
| **Finanzas** | Ingresos, pendiente, ticket promedio, costo de mercancía, margen y series por día |
| **Ajustes** | Datos de la tienda, reglas de envío, cuentas de cobro, tasa del BCV y URL pública |

### Detalles que importan

- **Precios en bs y euros.** La tasa del euro se lee del BCV y se cachea 6
  horas. Si la fuente falla, la tienda sigue mostrando la última tasa conocida
  con un aviso discreto, y el administrador puede fijar una tasa manual desde
  Ajustes (o con `BCV_EUR_MANUAL_RATE` en el entorno). El precio en euros queda
  congelado en cada pedido, igual que en una factura.
- **El servidor manda en los precios.** El checkout recalcula todo desde la base
  de datos: si alguien manipula el total en el navegador, no importa.
- **Visor 360°.** Se arrastra con el dedo o el mouse; también con las flechas del
  teclado. Los fotogramas se cargan uno a uno para no gastar datos.
- **Sesión del panel.** Cookie firmada con HMAC-SHA256, con caducidad de 7 días.
  El proxy (`src/proxy.ts`) filtra las rutas y, además, cada server action vuelve
  a comprobar la sesión: una acción llega por POST a la ruta donde se declaró y
  no siempre pasa por el proxy.

---

## Dónde están las cosas

```
src/
  app/
    (site)/          Tienda. El layout de aquí trae cabecera y pie.
    admin/
      (panel)/       Panel, ya dentro del grupo con sesión obligatoria
      login/         Login, fuera del grupo
      actions.ts     Todas las server actions del panel, en un solo archivo
    api/pedidos/     Rastreo de pedido por POST
  components/
    admin/           ActionForm, campos, tarjetas, gráficos, editor de producto
    shop/            Tarjeta, filtros, visor 360, selector de talla y color
    cart/            Contexto del carrito
    checkout/        Checkout en pasos
    currency/        Contexto de moneda y componente de precio
    site/            Cabecera, pie, logo, migas de pan
  lib/
    types.ts         El modelo de dominio: 20 tablas y sus etiquetas
    db/              Backend local y de Supabase, esquema, seed
    data/            Consultas: catálogo, pedidos, inventario, clientes, finanzas
    auth.ts          Sesión del panel
    bcv.ts           Tasa del euro
    actions/store.ts Server actions de la tienda
  proxy.ts           Guardia de rutas del panel
supabase/            schema.sql y seed.sql
scripts/             Generación de imágenes de demo, iconos y seed SQL
public/
  brand/             Logo
  demo/              Fotos de demostración (SVG generadas)
  icons/             Iconos de la PWA
  sw.js              Service worker
```

### Los dos backends

`src/lib/db/backend.ts` define una interfaz y hay dos implementaciones:

- **`local.ts`** — lee y escribe `.data/db.json`. Para desarrollo, para probar
  el panel sin conexión y para una instalación de un solo puesto.
- **`supabase.ts`** — Postgres vía PostgREST. Se activa sola al definir
  `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.

La elección ocurre en `getBackend()` (`src/lib/db/index.ts`) y todo lo demás
—las páginas, las acciones, el panel— habla con la interfaz y no se entera de
cuál está detrás.

Dos detalles que conviene no romper: `src/lib/db/schema.ts` es la lista blanca
de tablas y columnas que ambas implementaciones respetan, y declara qué columnas
forman la clave primaria de cada tabla. Ahí está el motivo de que
`product_spin360` se borre por `product_id` y no por `id`.

---

## Poner Supabase

1. Crea un proyecto en <https://supabase.com>.
2. En el editor SQL, pega `supabase/schema.sql` y ejecútalo. Crea las 20 tablas,
   los índices, los disparadores de `updated_at`, las políticas de RLS y los
   buckets de Storage.
3. Opcionalmente pega `supabase/seed.sql` para tener el catálogo de demostración.
   Es idempotente: se puede recargar sin duplicar nada.
4. Copia `.env.example` a `.env.local` y rellena:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://tudominio.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

5. `npm run dev`. El panel muestra el backend activo en Ajustes.

Sobre el bucket `design-references` (las fotos que sube el cliente al pedir un
diseño): es privado a propósito. Nunca se sirve por URL directa; el panel pide
una URL firmada de corta duración. En el seed de demostración esas referencias
son rutas locales de ejemplo.

**Sobre la RLS:** la app nunca expone Supabase al navegador, escribe con la clave
de servicio y por eso se salta la RLS. Las políticas de `schema.sql` están para
que, si alguien expone la clave `anon` por accidente, no quede nada abierto:
el público solo puede leer el catálogo publicado, y pedidos, clientes, costos y
ajustes quedan completamente cerrados.

---

## Variables de entorno

Todas son opcionales; `.env.example` explica cada una. Las que importan:

| Variable | Para qué |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL pública. Sin ella se deduce de `Host`, lo cual falla detrás de un proxy |
| `ADMIN_EMAIL` · `ADMIN_PASSWORD` | Credenciales del panel. Por defecto `admin@jaylu.ve` / `jaylu2026` |
| `ADMIN_SESSION_SECRET` | Clave de firma de la sesión. Si no se pone, se deriva de la contraseña |
| `NEXT_PUBLIC_SUPABASE_URL` · `SUPABASE_SERVICE_ROLE_KEY` | Activan Postgres |
| `BCV_EUR_MANUAL_RATE` | Tasa fija del euro; tiene prioridad sobre la automática |

**Antes de publicar**, cambia `ADMIN_PASSWORD` y define `ADMIN_SESSION_SECRET`
con una cadena larga y aleatoria:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

---

## Pagos

Ahora mismo el cobro es **manual**, y es lo que hace falta para empezar:
pago móvil, transferencia, Zelle y Binance. Tras confirmar el pedido, el cliente
ve los datos de la cuenta, hace la transferencia y manda la captura por
WhatsApp. El administrador confirma el pago desde la ficha del pedido.

Hay un interruptor de pasarela en línea en Ajustes, y el checkout ya sabe
enseñarla, pero **el flujo de cobro no está conectado**: si se activa, la orden
se crea igual y queda en "pendiente de pago" para confirmarla a mano. No hay
que tocar ese interruptor hasta que se implemente el cobro con tarjeta.

---

## Comandos

```bash
npm run dev            # servidor de desarrollo
npm run build          # compilar para producción
npm start              # servir la compilación
npm run lint           # ESLint
npm run typecheck      # TypeScript sin emitir
npm run check          # typecheck + revisión de codificación

npm run assets:demo    # regenerar las fotos SVG de demostración
npm run assets:icons   # regenerar los iconos de la PWA
npm run assets:verify  # comprobar que no falte ninguna imagen
npm run db:seed-sql    # regenerar supabase/seed.sql desde src/lib/db/seed.ts

npm run check:encoding # busca mojibake y caracteres fuera de la lista
```

Sobre `check:encoding`: algunos editores en Windows guardan UTF-8 con los
caracteres mal decodificados, y eso se cuela en los textos en castellano hasta
que ya está publicado. El script avisa antes de que llegue ahí.

---

## Despliegue

Next.js funciona en Vercel, en un contenedor o en cualquier Node 18+:

```bash
npm run build
npm start
```

Si usas el backend local, `.data/` tiene que estar en un disco persistente: ahí
vive el catálogo. Si prefieres que el catálogo sobreviva a los despliegues, usa
Supabase —es lo recomendado para producción— y el archivo local solo como
respaldo de desarrollo.

---

## Antes de abrir al público

- [ ] Cambiar `ADMIN_PASSWORD` y fijar `ADMIN_SESSION_SECRET`.
- [ ] Poner `NEXT_PUBLIC_SITE_URL` con el dominio final.
- [ ] Subir las fotos reales a `product-images` y `design-360`, y borrar las de
      demostración.
- [ ] Rellenar en Ajustes los datos reales de cobro, envío, redes y dirección.
- [ ] Revisar la tasa del BCV: si lleva días marcada como vencida, la fuente
      pública cambió y hay que tocar `src/lib/bcv.ts`.
- [ ] Configurar el dominio en Search Console y enviar `sitemap.xml`.
