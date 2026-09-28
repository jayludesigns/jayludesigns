-- ============================================================================
--  JayLu · esquema de Postgres (Supabase)
-- ============================================================================
--
--  Cómo se usa
--  -----------
--  1. Crea un proyecto en Supabase.
--  2. En el editor SQL, pega este archivo entero y ejecútalo.
--  3. Luego carga los datos de demostración con `supabase/seed.sql`
--     (opcional: en producción se empieza vacío y se carga el catálogo a mano).
--  4. Pega la URL del proyecto y la clave *service_role* en `.env.local`.
--
--  La app puede correr sin Supabase: si no encuentra variables de entorno usa
--  el backend local (`.data/db.json`). Este archivo solo hace falta cuando se
--  quiere el catálogo en la nube o trabajar desde varios equipos.
--
--  Convenciones
--  ------------
--  · Los identificadores son `text`, no `uuid`: el seed y el panel crean filas
--    con claves legibles (`prd_samurai_zen`, `ord_JLY-260118`) y la API genera
--    UUID v4 (`newId()`) para lo que nace desde la web. Ambas cosas caben en
--    `text` y en un `uuid` no.
--  · Los importes son `numeric(12,2)` en bolívares. Nunca `float`: con el
--    redondeo monetario de Postgres, un total de pedido puede descuadrar.
--  · Las listas (`sizes`, `tags`, `frames`, `reference_urls`) son `text[]`; lo
--    que tiene forma de objeto (`bulk_prices`, `options`, `meta`) es `jsonb`.
--  · `created_at` / `updated_at` son `timestamptz` con valor por defecto, para
--    que el backend no tenga que mandarlos siempre.
--  · Las tablas de unión llevan clave compuesta y no `id`, igual que espera
--    `src/lib/db/schema.ts`.
-- ============================================================================

begin;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

-- Una sola función para marcar "actualizado". Evita repetir el `trigger` veinte
-- veces, y sobre todo evita que se nos olvide en alguna tabla.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Perfiles y ajustes
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id          text primary key,
  email       text        not null,
  full_name   text,
  role        text        not null default 'staff' check (role in ('admin', 'staff')),
  avatar_url  text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.settings (
  key        text primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id          text primary key,
  slug        text        not null unique,
  name        text        not null,
  description text,
  hero_url    text,
  sort_order  integer     not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.collections (
  id              text primary key,
  slug            text        not null unique,
  name            text        not null,
  tagline         text,
  description     text,
  theme           text        not null default 'otro'
                  check (theme in ('anime', 'fantasia', 'videojuegos', 'streetwear',
                                   'minimal', 'uniformes', 'temporada',
                                   'colaboracion', 'otro')),
  banner_url      text,
  status          text        not null default 'draft'
                  check (status in ('draft', 'published', 'archived')),
  starts_at       timestamptz,
  ends_at         timestamptz,
  sort_order      integer     not null default 0,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.products (
  id               text primary key,
  slug             text        not null unique,
  sku              text,
  name             text        not null,
  subtitle         text,
  description      text,
  category_id      text references public.categories (id) on delete set null,
  base_price_ves   numeric(12, 2) not null default 0 check (base_price_ves >= 0),
  compare_at_ves   numeric(12, 2) check (compare_at_ves is null or compare_at_ves >= 0),
  cost_ves         numeric(12, 2) not null default 0 check (cost_ves >= 0),
  garment_type     text        not null default 'Franela',
  material         text,
  -- Valor canónico de PRINT_TECHNIQUES (src/lib/types.ts): 'sublimacion' o
  -- 'dtf-textil'. Se deja como texto y sin check porque la lista crece cuando
  -- el taller sume técnicas (serigrafía, bordado) y no queremos una migración
  -- por cada una. La capa de aplicación es la que valida.
  print_technique  text,
  fit              text,
  care_instructions text,
  sizes            text[]      not null default '{}',
  colors           jsonb       not null default '[]'::jsonb,  -- [{ name, hex }]
  is_active        boolean     not null default false,
  is_featured      boolean     not null default false,
  is_custom_only   boolean     not null default false,
  min_order_qty    integer     not null default 1 check (min_order_qty >= 1),
  bulk_prices      jsonb       not null default '[]'::jsonb,  -- [{ min_qty, unit_price_ves }]
  lead_time_days   integer     not null default 3 check (lead_time_days >= 0),
  weight_grams     integer,
  tags             text[]      not null default '{}',
  seo_title        text,
  seo_description  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_idx   on public.products (is_active, is_featured);
create index if not exists products_tags_idx     on public.products using gin (tags);

-- Un producto puede estar en varias colecciones a la vez, y el orden dentro de
-- cada una lo decide el panel. Clave compuesta, sin `id`.
create table if not exists public.product_collections (
  product_id   text    not null references public.products (id)    on delete cascade,
  collection_id text   not null references public.collections (id) on delete cascade,
  sort_order   integer not null default 0,
  primary key (product_id, collection_id)
);

create index if not exists product_collections_collection_idx
  on public.product_collections (collection_id);

create table if not exists public.product_images (
  id         text primary key,
  product_id text    not null references public.products (id) on delete cascade,
  url        text    not null,
  alt        text,
  kind       text    not null default 'gallery'
             check (kind in ('main', 'gallery', '360')),
  sort_order integer not null default 0
);

create index if not exists product_images_product_idx
  on public.product_images (product_id, kind, sort_order);

-- Visor 360°: una fila por producto, con el listado completo de fotogramas en
-- el orden en que se anima. `frame_count` se guarda aparte para no tener que
-- contar el array en cada lectura.
create table if not exists public.product_spin360 (
  product_id  text primary key references public.products (id) on delete cascade,
  frames      text[]     not null default '{}',
  frame_count integer    not null default 0,
  poster_url  text,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Promociones y cupones
-- ---------------------------------------------------------------------------

create table if not exists public.promotions (
  id            text primary key,
  name          text          not null,
  scope         text          not null check (scope in ('product', 'collection')),
  product_id    text          references public.products (id)    on delete cascade,
  collection_id text          references public.collections (id) on delete cascade,
  kind          text          not null check (kind in ('percent', 'fixed')),
  value         numeric(12, 2) not null check (value >= 0),
  starts_at     timestamptz,
  ends_at       timestamptz,
  is_active     boolean       not null default true,
  priority      integer       not null default 0,
  created_at    timestamptz   not null default now(),
  -- La promoción tiene que apuntar a algo, y a una sola cosa: si el alcance es
  -- un producto, `product_id`; si es una colección, `collection_id`.
  constraint promotions_target_check check (
    (scope = 'product'    and product_id    is not null and collection_id is null) or
    (scope = 'collection' and collection_id is not null and product_id    is null)
  ),
  constraint promotions_window_check check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index if not exists promotions_active_idx
  on public.promotions (is_active, scope, priority desc);

create table if not exists public.coupons (
  id               text primary key,
  code             text          not null unique,
  kind             text          not null check (kind in ('percent', 'fixed')),
  value            numeric(12, 2) not null check (value >= 0),
  min_subtotal_ves numeric(12, 2) not null default 0 check (min_subtotal_ves >= 0),
  max_uses         integer,
  used_count       integer       not null default 0 check (used_count >= 0),
  starts_at        timestamptz,
  ends_at          timestamptz,
  is_active        boolean       not null default true,
  description      text,
  created_at       timestamptz   not null default now(),
  constraint coupons_window_check check (ends_at is null or starts_at is null or ends_at > starts_at)
);

-- ---------------------------------------------------------------------------
-- Inventario: producto terminado
-- ---------------------------------------------------------------------------

create table if not exists public.variants (
  id              text primary key,
  product_id      text           not null references public.products (id) on delete cascade,
  sku             text,
  size            text,
  color           text,
  color_hex       text,
  stock           integer        not null default 0 check (stock >= 0),
  reserved_stock  integer        not null default 0 check (reserved_stock >= 0),
  min_stock       integer        not null default 0,
  cost_ves        numeric(12, 2) not null default 0 check (cost_ves >= 0),
  price_delta_ves numeric(12, 2) not null default 0,
  is_active       boolean        not null default true,
  barcode         text,
  created_at      timestamptz    not null default now(),
  updated_at      timestamptz    not null default now()
);

create index if not exists variants_product_idx on public.variants (product_id, is_active);
create unique index if not exists variants_sku_idx
  on public.variants (sku) where sku is not null;

-- Libro de movimientos: no se edita nunca, solo se inserta. Por eso no lleva
-- `updated_at`.
create table if not exists public.stock_movements (
  id         text primary key,
  variant_id text    not null references public.variants (id) on delete cascade,
  type       text    not null check (type in ('in', 'out', 'reserve', 'release', 'adjust')),
  quantity   integer not null check (quantity <> 0),
  reason     text,
  order_id   text,
  user_id    text,
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_variant_idx
  on public.stock_movements (variant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Inventario: materia prima
-- ---------------------------------------------------------------------------

create table if not exists public.raw_materials (
  id          text primary key,
  sku         text,
  name        text           not null,
  description text,
  category    text           not null default 'otro'
              check (category in ('tela', 'tinta', 'vinilo', 'hilo', 'papel',
                                  'empaque', 'maquina', 'consumible', 'otro')),
  unit        text           not null default 'unidad'
              check (unit in ('unidad', 'metro', 'kg', 'litro', 'rollo',
                              'paquete', 'caja', 'par')),
  stock       numeric(12, 3) not null default 0 check (stock >= 0),
  min_stock   numeric(12, 3) not null default 0,
  cost_ves    numeric(12, 2) not null default 0 check (cost_ves >= 0),
  supplier    text,
  location    text,
  is_active   boolean        not null default true,
  notes       text,
  created_at  timestamptz    not null default now(),
  updated_at  timestamptz    not null default now()
);

create table if not exists public.material_movements (
  id          text primary key,
  material_id text           not null references public.raw_materials (id) on delete cascade,
  type        text           not null check (type in ('in', 'out', 'adjust', 'waste')),
  quantity    numeric(12, 3) not null check (quantity <> 0),
  reason      text,
  order_id    text,
  user_id     text,
  note        text,
  created_at  timestamptz    not null default now()
);

create index if not exists material_movements_material_idx
  on public.material_movements (material_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Clientes y CRM
-- ---------------------------------------------------------------------------

create table if not exists public.customers (
  id               text primary key,
  full_name        text    not null,
  email            text,
  phone            text,
  whatsapp         text,
  document_id      text,
  city             text,
  state            text,
  address          text,
  tags             text[]  not null default '{}',
  marketing_opt_in boolean not null default false,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists customers_name_idx  on public.customers (full_name);
create index if not exists customers_phone_idx on public.customers (phone);
create index if not exists customers_tags_idx  on public.customers using gin (tags);

create table if not exists public.crm_activities (
  id          text primary key,
  customer_id text    not null references public.customers (id) on delete cascade,
  user_id     text,
  kind        text    not null
              check (kind in ('note', 'call', 'meeting', 'task', 'whatsapp')),
  title       text,
  body        text,
  due_at      timestamptz,
  is_done     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists crm_activities_customer_idx
  on public.crm_activities (customer_id, created_at desc);
-- La bandeja de tareas consulta siempre las pendientes, ordenadas por fecha.
create index if not exists crm_activities_pending_idx
  on public.crm_activities (due_at) where is_done = false;

create table if not exists public.leads (
  id         text primary key,
  name       text        not null,
  email      text,
  phone      text,
  message    text,
  source     text,
  status     text        not null default 'new'
             check (status in ('new', 'contacted', 'quoted', 'won', 'lost')),
  notes      text,
  created_at timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id                text primary key,
  order_number      text           not null unique,
  customer_id       text           references public.customers (id) on delete set null,
  customer_name     text           not null,
  customer_email    text,
  customer_phone    text,
  kind              text           not null default 'product'
                    check (kind in ('product', 'custom', 'wholesale')),
  status            text           not null default 'pending_payment'
                    check (status in ('draft', 'pending_payment', 'paid', 'in_production',
                                      'ready', 'shipped', 'delivered', 'cancelled')),
  payment_method    text           check (payment_method is null or payment_method in
                    ('pago_movil', 'zelle', 'transferencia', 'binance', 'efectivo',
                     'tarjeta', 'otro')),
  payment_status    text           not null default 'pending'
                    check (payment_status in ('pending', 'paid', 'refunded', 'failed')),
  payment_ref       text,
  online_payment_id text,
  items_subtotal_ves numeric(12, 2) not null default 0 check (items_subtotal_ves >= 0),
  discount_ves      numeric(12, 2) not null default 0 check (discount_ves >= 0),
  shipping_ves      numeric(12, 2) not null default 0 check (shipping_ves >= 0),
  total_ves         numeric(12, 2) not null default 0 check (total_ves >= 0),
  total_eur         numeric(12, 2) not null default 0,
  bcv_rate          numeric(12, 4) not null default 0,
  coupon_code       text,
  shipping_address  jsonb,
  notes             text,
  internal_notes    text,
  created_at        timestamptz    not null default now(),
  updated_at        timestamptz    not null default now(),
  paid_at           timestamptz,
  shipped_at        timestamptz,
  delivered_at      timestamptz,
  -- El total no puede ser negativo: si el cupón se pasa de la raya, el checkout
  -- ya lo corrige, pero la base de datos no lo deja pasar.
  constraint orders_total_check check (total_ves >= 0)
);

create index if not exists orders_customer_idx on public.orders (customer_id, created_at desc);
create index if not exists orders_status_idx   on public.orders (status, created_at desc);
create index if not exists orders_created_idx  on public.orders (created_at desc);
-- El dashboard consulta lo cobrado del mes; esta índice evita recorrerlo todo.
create index if not exists orders_paid_idx
  on public.orders (created_at desc) where payment_status = 'paid';

create table if not exists public.order_items (
  id             text primary key,
  order_id       text           not null references public.orders (id) on delete cascade,
  -- El producto y la variante pueden haber desaparecido del catálogo después de
  -- la compra: la línea guarda nombre, SKU y precio ya resueltos.
  product_id     text           references public.products (id) on delete set null,
  variant_id     text,
  name           text           not null,
  sku            text,
  variant_label  text,
  unit_price_ves numeric(12, 2) not null default 0 check (unit_price_ves >= 0),
  quantity       integer        not null default 1 check (quantity > 0),
  discount_ves   numeric(12, 2) not null default 0 check (discount_ves >= 0),
  subtotal_ves   numeric(12, 2) not null default 0 check (subtotal_ves >= 0),
  options        jsonb,
  custom_design_id text
);

create index if not exists order_items_order_idx   on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- Diseños a medida
-- ---------------------------------------------------------------------------

create table if not exists public.custom_designs (
  id              text primary key,
  code            text        not null unique,
  customer_id     text        references public.customers (id) on delete set null,
  order_id        text,
  name            text,
  description     text,
  -- Fotos de referencia del cliente. El bucket `design-references` es privado:
  -- estas URL son firmadas por el servidor y nunca públicas.
  reference_urls  text[]      not null default '{}',
  sizes           text[]      not null default '{}',
  colors          text[]      not null default '{}',
  quantity        integer     not null default 1 check (quantity > 0),
  garment_type    text,
  style_preference text,
  deadline        timestamptz,
  status          text        not null default 'new'
                  check (status in ('new', 'quoting', 'approved', 'in_design',
                                    'production', 'ready', 'delivered', 'rejected')),
  quoted_price_ves numeric(12, 2) check (quoted_price_ves is null or quoted_price_ves >= 0),
  admin_notes     text,
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists custom_designs_status_idx
  on public.custom_designs (status, created_at desc);
create index if not exists custom_designs_customer_idx
  on public.custom_designs (customer_id);

-- ---------------------------------------------------------------------------
-- Reseñas y auditoría
-- ---------------------------------------------------------------------------

create table if not exists public.reviews (
  id           text primary key,
  product_id   text    not null references public.products (id) on delete cascade,
  customer_id  text    references public.customers (id) on delete set null,
  order_id     text,
  author_name  text    not null,
  rating       integer not null check (rating between 1 and 5),
  title        text,
  body         text,
  -- Solo se publica lo aprobado desde el panel.
  is_approved  boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists reviews_product_idx
  on public.reviews (product_id, created_at desc) where is_approved = true;

create table if not exists public.activity_log (
  id         text primary key,
  user_id    text,
  user_email text,
  action     text        not null,
  entity     text,
  entity_id  text,
  summary    text,
  meta       jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_created_idx on public.activity_log (created_at desc);
create index if not exists activity_log_entity_idx  on public.activity_log (entity, entity_id);

-- ---------------------------------------------------------------------------
-- Disparadores de `updated_at`
-- ---------------------------------------------------------------------------
--
-- Solo en las tablas que declaran esa columna. La lista sale de
-- `src/lib/db/schema.ts`: tocarla allí sin tocarla aquí deja tablas que se
-- actualizan con una fecha vieja.

do $$
declare
  target text;
begin
  foreach target in array array[
    'profiles', 'collections', 'products', 'variants', 'raw_materials',
    'customers', 'orders', 'custom_designs', 'product_spin360', 'settings'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', target || '_touch', target);
    execute format(
      'create trigger %I before update on public.%I
         for each row execute function public.touch_updated_at()',
      target || '_touch', target
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Notas sobre borrados
-- ---------------------------------------------------------------------------
--
-- Las claves foráneas ya resuelven la mayoría de los casos:
--   · borrar un producto se lleva sus imágenes, variantes, fotos 360, fotos de
--     la galería y sus reseñas (cascade), y desactiva el 360 del resto;
--   · borrar un pedido se lleva sus líneas (cascade) pero deja la ficha del
--     cliente, con la que se puede volver a escribirle;
--   · borrar un cliente deja sus pedidos con `customer_id = null` (set null):
--     el historial económico no debe desaparecer por un error en la ficha.
--
-- `stock_movements.variant_id` y `material_movements.material_id` son cascade a
-- propósito: si desaparece la variante, su historial de stock ya no significa
-- nada. Si se quiere conservarlo, cambiar a `on delete restrict`.

commit;

-- ============================================================================
--  Seguridad de fila (RLS)
-- ============================================================================
--
--  JayLu no expone Supabase al navegador: toda la escritura pasa por el panel
--  autenticado, que usa la clave *service_role* y por lo tanto se salta la RLS
--  de todas formas. La tienda se lee desde el servidor de Next.
--
--  Aun así, si alguien expone la clave *anon* por error, estas políticas
--  mantienen la puerta cerrada: lectura pública solo del catálogo publicado, y
--  todo lo demás (pedidos, clientes, precios de costo, ajustes) completamente
--  cerrado para `anon` y `authenticated`.
--
--  Para subirlos desde el panel con el rol `authenticated` —si algún día se
--  deja de usar la service_role— hay que crear antes una política de escritura
--  por rol. No viene aquí a propósito: el panel actual no lo necesita.

alter table public.profiles          enable row level security;
alter table public.settings          enable row level security;
alter table public.categories        enable row level security;
alter table public.collections       enable row level security;
alter table public.products          enable row level security;
alter table public.product_collections enable row level security;
alter table public.product_images    enable row level security;
alter table public.product_spin360   enable row level security;
alter table public.promotions        enable row level security;
alter table public.coupons           enable row level security;
alter table public.variants          enable row level security;
alter table public.stock_movements   enable row level security;
alter table public.raw_materials     enable row level security;
alter table public.material_movements enable row level security;
alter table public.customers         enable row level security;
alter table public.crm_activities    enable row level security;
alter table public.leads             enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.custom_designs    enable row level security;
alter table public.reviews           enable row level security;
alter table public.activity_log      enable row level security;

-- --- Catálogo visible -------------------------------------------------------
-- Importes y stock: sí. `cost_ves` no, es información interna.

drop policy if exists "catalogo publico: productos" on public.products;
create policy "catalogo publico: productos" on public.products
  for select to anon, authenticated
  using (is_active = true or is_custom_only = true);

drop policy if exists "catalogo publico: categorias" on public.categories;
create policy "catalogo publico: categorias" on public.categories
  for select to anon, authenticated using (is_active = true);

drop policy if exists "catalogo publico: colecciones" on public.collections;
create policy "catalogo publico: colecciones" on public.collections
  for select to anon, authenticated using (status = 'published');

drop policy if exists "catalogo publico: imagenes" on public.product_images;
create policy "catalogo publico: imagenes" on public.product_images
  for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and (p.is_active = true or p.is_custom_only = true)
  ));

drop policy if exists "catalogo publico: 360" on public.product_spin360;
create policy "catalogo publico: 360" on public.product_spin360
  for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_spin360.product_id
      and (p.is_active = true or p.is_custom_only = true)
  ));

drop policy if exists "catalogo publico: membresias" on public.product_collections;
create policy "catalogo publico: membresias" on public.product_collections
  for select to anon, authenticated
  using (exists (
    select 1 from public.collections c
    where c.id = product_collections.collection_id and c.status = 'published'
  ));

-- Notas: los pedidos ya se sirven desde el servidor con la clave de servicio, así
-- que no hace falta abrir nada aquí. Para consultas analíticas se puede crear
-- una vista con solo las columnas públicas en vez de dar acceso a `products`.

-- --- Todo lo demás cerrado --------------------------------------------------
--
-- Con RLS activa y sin políticas, `anon` y `authenticated` no leen ni escriben.
-- Se listan las tablas para que quede explícito que el silencio es intencional.

-- profiles, settings, variants, stock_movements, raw_materials,
-- material_movements, customers, crm_activities, leads, orders, order_items,
-- custom_designs, promotions, coupons, reviews, activity_log
--   → sin políticas de lectura ni de escritura para anon/authenticated.
--
-- Excepción útil al público: los cupones se validan en el checkout, en el
-- servidor. Si algún día el checkout se mueve al cliente, esta es la política
-- que haría falta (solo los activos y dentro de su ventana):

-- drop policy if exists "cupones publicos" on public.coupons;
-- create policy "cupones publicos" on public.coupons
--   for select to anon, authenticated
--   using (is_active = true
--          and (starts_at is null or starts_at <= now())
--          and (ends_at is null or ends_at > now()));

-- ============================================================================
--  Almacenamiento
-- ============================================================================
--
--  Tres buckets. Los nombres son los que espera `src/lib/storage.ts`.
--
--  · product-images   público   Fotos de producto y banners de colección.
--  · design-360       público   Fotogramas del visor 360° (muchos por producto).
--  · design-references PRIVADO  Lo que sube el cliente al pedir un diseño.
--                                    Nunca se sirve por URL directa: el panel
--                                    pide una URL firmada de corta duración.
--
--  Ejecutar esto una vez con la service_role, o desde el panel de Supabase
--  (Storage → New bucket) marcando `design-references` como privado.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images',    'product-images',    true,  10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']),
  ('design-360',        'design-360',        true,  10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']),
  ('design-references', 'design-references', false, 15728640,
   array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Los buckets privados no se sirven solos: se les da una URL firmada de corta
-- duración desde el servidor, y esa URL es la que se guarda en
-- `custom_designs.reference_urls`.
