-- ============================================================================
--  JayLu · datos de demostración
-- ============================================================================
--
--  Generado con `npx tsx scripts/generate-seed-sql.ts` a partir de
--  `src/lib/db/seed.ts`, la misma fuente que usa el backend local. Si cambias
--  el seed, vuelve a correr el script: no editar este archivo a mano.
--
--  Cómo se usa
--  -----------
--  1. Ejecuta antes `supabase/schema.sql` (este archivo necesita las tablas).
--  2. Pega este contenido en el editor SQL de Supabase y ejecútalo.
--  3. Arranca la app. La tienda debe verse con el catálogo de JayLu.
--
--  Es idempotente: todas las sentencias terminan en `on conflict do nothing`, así
--  que se puede volver a cargar sin duplicar nada ni pisar lo que ya se editó
--  desde el panel. Para empezar de cero, borra las filas antes.
--
--  Aviso: las fotos de la demostración son dibujos SVG generados por
--  `scripts/generate-demo-assets.mjs`, no photographs. Reemplázalas al subir
--  las reales a los buckets `product-images` y `design-360`.
-- ============================================================================

begin;

-- Por si el proyecto se acaba de crear y se quiere empezar de verdad vacío:
-- descomenta lo de abajo para dejar solo el catálogo, sin pedidos ni clientes.
--
-- truncate table public.activity_log, public.reviews, public.order_items,
--   public.orders, public.custom_designs, public.material_movements,
--   public.stock_movements, public.leads, public.crm_activities,
--   public.customers, public.raw_materials, public.variants, public.coupons,
--   public.promotions, public.product_spin360, public.product_images,
--   public.product_collections, public.products, public.collections,
--   public.categories
-- restart identity cascade;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- profiles: sin filas en la demostración, se empieza vacío.

-- ---------------------------------------------------------------------------
-- settings · 2 filas
-- ---------------------------------------------------------------------------
-- Ajustes de la tienda (clave `store`) y caché de la tasa del BCV (clave `bcv`).
insert into public.settings (key, value, updated_at) values
  ('store', '{"store_name":"JayLu","tagline":"Franelas con alma. Estampados que cuentan algo.","description":"Tienda de franelas y prendas con estampados personalizados. Diseños de anime, fantasía y cultura pop, más uniformes para estudiantes, grupos y eventos.","email":"hola@jaylu.ve","phone":"+58 412 000 0000","whatsapp":"584120000000","instagram":"jaylu.ve","tiktok":"jaylu.ve","address":"Maracay, estado Aragua, Venezuela","currency_symbol":"Bs.","shipping_flat_ves":5,"free_shipping_over_ves":30,"bcv_eur_manual_rate":0,"bcv_rate":36.5,"bcv_updated_at":"2026-01-06T09:00:00.000Z","bcv_source":"BCV (demostración)","bcv_stale":false,"online_payments_enabled":false,"stripe_price_id_mode":"usd","bank_name":"Banco de Venezuela","bank_account_type":"Ahorro","bank_account_number":"0102 0123 45 6789012345","bank_account_name":"JayLu Store C.A.","pago_movil_phone":"0412 000 0000","zelle_name":"JayLu Store","zelle_phone":"+58 412 000 0000","binance_email":"jaylu.ve@binance.com","binance_pay_id":"38210455","order_notes_template":"Enviar a esperar en la sucursal. Si es uniforme, indicar talla y color de cada unidad."}'::jsonb, '2026-01-06T09:00:00.000Z'::timestamptz),
  ('bcv', '{"rate":36.5,"source":"BCV (demostración)","updated_at":"2026-01-06T09:00:00.000Z","stale":false}'::jsonb, '2026-01-06T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- categories · 6 filas
-- ---------------------------------------------------------------------------
-- Franelas, remeras, hoodies, uniformes, etc.
insert into public.categories (id, slug, name, description, hero_url, sort_order, is_active, created_at) values
  ('cat_franelas', 'franelas', 'Franelas', 'El corazón de JayLu. Algodón, estampado de alta definición.', '/demo/categories/franelas.svg', 1, true, '2025-06-20T09:00:00.000Z'::timestamptz),
  ('cat_remeras', 'remeras', 'Remeras', 'Modelos manga larga, oversize y baseball.', '/demo/categories/remeras.svg', 2, true, '2025-06-20T09:00:00.000Z'::timestamptz),
  ('cat_hoodies', 'hoodies', 'Hoodies y suéteres', 'Abrigado para climas frescos, estampado en pecho y espalda.', '/demo/categories/hoodies.svg', 3, true, '2025-07-10T09:00:00.000Z'::timestamptz),
  ('cat_uniformes', 'uniformes', 'Uniformes', 'Uniformes escolares y corporativos por pedido, con sublimación o DTF textil.', '/demo/categories/uniformes.svg', 4, true, '2025-08-09T09:00:00.000Z'::timestamptz),
  ('cat_accesorios', 'accesorios', 'Accesorios', 'Gorras, tote bags y stickers.', '/demo/categories/accesorios.svg', 5, true, '2025-09-08T09:00:00.000Z'::timestamptz),
  ('cat_medida', 'a-medida', 'Diseño a medida', 'Tu idea, nuestra mano. Sin mínimo de unidades.', '/demo/categories/a-medida.svg', 6, true, '2025-10-08T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- collections · 8 filas
-- ---------------------------------------------------------------------------
-- Colecciones publicadas: drops, colaboraciones y uniformes.
insert into public.collections (id, slug, name, tagline, description, theme, banner_url, status, starts_at, ends_at, sort_order, seo_title, seo_description, created_at, updated_at) values
  ('col_anime', 'anime-legends', 'Anime Legends', 'Los personajes que marcaron generaciones', 'Franelas con estampado de alta definición de los personajes y escenarios que definieron tu infancia. Tela peinada, tinta eco y un lavado que no se destiñe.', 'anime', '/demo/collections/anime-legends.svg', 'published', null, null, 1, null, null, '2025-09-08T09:00:00.000Z'::timestamptz, '2026-01-02T09:00:00.000Z'::timestamptz),
  ('col_mythos', 'neo-mythos', 'Neo Mythos', 'Mitología, dragones y magia oscura', 'Diseños inspirados en la fantasía épica: dragones, runas y Dual grip. Arte original para quienes quieren algo que no exista en ninguna otra parte.', 'fantasia', '/demo/collections/neo-mythos.svg', 'published', null, null, 2, null, null, '2025-09-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('col_pixel', 'pixel-arena', 'Pixel Arena', 'Retro 8 y 16 bits, nuevo precio', 'Pixel art reescalada, escudos, barras de vida y hechizos. Si viviste con una consola de 8 bits, esta colección es para ti.', 'videojuegos', '/demo/collections/pixel-arena.svg', 'published', null, null, 3, null, null, '2025-09-28T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('col_mono', 'mono-essential', 'Mono Essential', 'Negro, blanco, cero ruido', 'La base de tu gaveta. Franelas lisas, heavyweight, con un logo estampado mínimo. Combina con todo.', 'minimal', '/demo/collections/mono-essential.svg', 'published', null, null, 4, null, null, '2025-10-08T09:00:00.000Z'::timestamptz, '2025-12-31T09:00:00.000Z'::timestamptz),
  ('col_uni', 'uniformes-escolares', 'Uniformes Escolares', 'Instituciones, grupos y eventos', 'Uniformes completos para cohesión total: camisa, short, suéter y delantal. Tu logo y el de tu institución, estampados con sublimación o DTF textil. Pedidos desde 10 unidades.', 'uniformes', '/demo/collections/uniformes-escolares.svg', 'published', null, null, 5, null, null, '2025-10-13T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('col_invierno', 'drop-invierno-26', 'Drop Invierno 26', 'Edición limitada, solo por semanas', 'La colección de temporada: hoodies heavyweight y ropa de frío. Edición corta: cuando se agote el stock, no se repone.', 'temporada', '/demo/collections/drop-invierno-26.svg', 'published', null, null, 0, 'Drop Invierno 26 — JayLu', 'Edición limitada de franelas JayLu. Precios solo durante el drop.', '2025-12-07T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('col_uni26', 'uniformes-2026', 'Uniformes Corporativos 2026', 'Estampado DTF en polos y chamarras — en preparación', 'Línea corporativa: polos, chamarras y batas con tu logo en DTF textil, que entra en la fibra y resiste el lavado industrial. Próximamente.', 'uniformes', null, 'draft', null, null, 6, null, null, '2025-12-17T09:00:00.000Z'::timestamptz, '2025-12-17T09:00:00.000Z'::timestamptz),
  ('col_colab', 'colab-mtz', 'Colab: Módulos MTZ', 'Edición conjunta con el colectivo', 'Diseños hechos con el colectivo Módulos: DTF textil sobre franela cruda, con los trazos del dibujo a mano tal cual.', 'colaboracion', '/demo/collections/colab-mtz.svg', 'published', null, null, 7, null, null, '2025-11-22T09:00:00.000Z'::timestamptz, '2025-12-28T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- products · 12 filas
-- ---------------------------------------------------------------------------
-- Catálogo. `colors` es jsonb con [{ name, hex }] y `bulk_prices` la lista de precios por volumen.
insert into public.products (id, slug, sku, name, subtitle, description, category_id, base_price_ves, compare_at_ves, cost_ves, garment_type, material, print_technique, fit, care_instructions, sizes, colors, is_active, is_featured, is_custom_only, min_order_qty, bulk_prices, lead_time_days, weight_grams, tags, seo_title, seo_description, created_at, updated_at) values
  ('prd_samurai_zen', 'samurai-zen', 'JLY-FR-001', 'Samurai Zen', 'Franela · Estampado frontal y trasero', 'El samurái sentado bajo un luna llena que usamos como ícono de la marca. Sublimación a todo color sobre franela peinada de 180 g/m². No se agrieta ni se cuartea, aunque la laves cien veces.', 'cat_franelas', 24, null, 7.8, 'franela', 'Algodón peinado 180 g/m²', 'sublimacion', 'Regular', 'Lavar a máquina con agua fría del revés. No usar suavizante. Secar al aire. No plancha sobre el estampado.', array['S', 'M', 'L', 'XL'], '[{"name":"Negro","hex":"#000000"},{"name":"Blanco","hex":"#FFFFFF"},{"name":"Arena","hex":"#D8CFC0"}]'::jsonb, true, true, false, 1, '[]'::jsonb, 4, 180, array['anime', 'fantasia', 'geisha', 'samurai'], null, null, '2025-10-08T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('prd_neon_shinigami', 'neon-shinigami', 'JLY-FR-002', 'Neon Shinigami', 'Franela oversize', 'Espada energética en degradado neón, impresa con sublimación de alta temperatura: el color entra en la fibra, no flota encima. Sube 4 °C de lavado y sigue igual.', 'cat_franelas', 29, null, 9.4, 'franela', 'Algodón peinado 180 g/m²', 'sublimacion', 'Regular', 'Lavar a máquina con agua fría del revés. No usar suavizante. Secar al aire. No plancha sobre el estampado.', array['M', 'L', 'XL'], '[{"name":"Negro","hex":"#000000"},{"name":"Verde ácido","hex":"#9EF01A"}]'::jsonb, true, true, false, 1, '[]'::jsonb, 4, 180, array['anime', 'bleach', 'neon', 'oversize'], null, null, '2025-10-13T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('prd_dragon_ashes', 'dragon-ashes', 'JLY-FR-003', 'Dragon Ashes', 'Franela heavyweight', '240 g/m², corte boxy y unstructured. DTF textil con base blanca y detail line negro para que el dragón destaque sobre cualquier color de fondo.', 'cat_franelas', 32, null, 11.2, 'franela', 'Algodón peinado 180 g/m²', 'dtf-textil', 'Regular', 'Lavar a máquina con agua fría del revés. No usar suavizante. Secar al aire. No plancha sobre el estampado.', array['S', 'M', 'L', 'XL', 'XXL'], '[{"name":"Negro","hex":"#000000"},{"name":"Gris jaspeado","hex":"#4A4A4A"},{"name":"Sangre","hex":"#8A1111"}]'::jsonb, true, true, false, 1, '[]'::jsonb, 4, 180, array['fantasia', 'dragon', 'heavyweight'], null, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('prd_sakura_8bit', 'sakura-8bit', 'JLY-FR-004', 'Sakura 8-Bit', 'Franela · pixel art', 'Flores de cerezo pixeladas, como un sprite NES que quedó atrapado en un jardín. DTF textil de un solo color: barato para la tienda, nervioso para el cliente.', 'cat_franelas', 21, null, 6.1, 'franela', 'Algodón peinado 180 g/m²', 'dtf-textil', 'Regular', 'Lavar a máquina con agua fría del revés. No usar suavizante. Secar al aire. No plancha sobre el estampado.', array['S', 'M', 'L', 'XL'], '[{"name":"Blanco","hex":"#FFFFFF"},{"name":"Rosa","hex":"#F2C6D0"},{"name":"Negro","hex":"#000000"}]'::jsonb, true, false, false, 1, '[]'::jsonb, 4, 180, array['anime', 'pixel', 'videojuegos', 'sakura'], null, null, '2025-10-23T09:00:00.000Z'::timestamptz, '2026-01-02T09:00:00.000Z'::timestamptz),
  ('prd_mago_rpg', 'mago-rpg', 'JLY-FR-005', 'Mago RPG', 'Franela · panel frontal completo', 'Ranura de estadísticas, barra de maná y hechizo en release. Inspirado en los wizards de los 90, ejecutado con cinco tintas y DTF textil. Para los fans con demasiado tiempo libre.', 'cat_franelas', 27, null, 8.9, 'franela', 'Algodón peinado 180 g/m²', 'dtf-textil', 'Regular', 'Lavar a máquina con agua fría del revés. No usar suavizante. Secar al aire. No plancha sobre el estampado.', array['M', 'L', 'XL'], '[{"name":"Negro","hex":"#000000"},{"name":"Azul tinta","hex":"#14213D"}]'::jsonb, true, false, false, 1, '[]'::jsonb, 4, 180, array['rpg', 'videojuegos', 'fantasia', 'wizard'], null, null, '2025-10-28T09:00:00.000Z'::timestamptz, '2026-01-01T09:00:00.000Z'::timestamptz),
  ('prd_uniforme_escolar', 'uniforme-escolar-jb', 'JLY-UN-001', 'Uniforme Escolar Juan Pablo', 'Conjunto · escudo en DTF textil', 'Conjunto completo de primaria: camisa manga corta con el escudo en DTF textil, short, suéter de piqué y delantal. Tela resistente para uso diario escolar, con el estampado integrado en la fibra (no se agrieta ni se despega al lavar). Precio por grupo desde 10 unidades.', 'cat_uniformes', 48, null, 21.5, 'uniforme', 'Polo 65% algodón / 35% poliéster', 'dtf-textil', 'Ajuste school', 'Lavar a máquina con agua fría del revés. No usar suavizante. Secar al aire. No plancha sobre el estampado.', array['6', '8', '10', '12', '14', '16', 'S', 'M', 'L'], '[{"name":"Blanco","hex":"#FFFFFF"},{"name":"Azul marino","hex":"#1B2A4A"},{"name":"Gris","hex":"#5A5A5A"}]'::jsonb, true, false, false, 10, '[{"min_qty":10,"unit_price_ves":44},{"min_qty":30,"unit_price_ves":39},{"min_qty":60,"unit_price_ves":35}]'::jsonb, 12, 210, array['uniformes', 'escolar', 'dtf', 'instituciones'], null, null, '2025-11-02T09:00:00.000Z'::timestamptz, '2025-12-31T09:00:00.000Z'::timestamptz),
  ('prd_polo_corporativo', 'polo-corporativo-liso', 'JLY-UN-002', 'Polo Corporativo Liso', 'Polo · logo del cliente en DTF textil', 'Polo piqué 210 g/m² con puño y refuerzo en hombros. Estampamos tu logo a todo color en pecho, manga o espalda. Se cotiza por taller, no por unidad.', 'cat_uniformes', 42, null, 19, 'polo', 'Piqué Algodón/Poliéster', 'dtf-textil', 'Ajuste school', 'Lavar a máquina con agua fría del revés. No usar suavizante. Secar al aire. No plancha sobre el estampado.', array['S', 'M', 'L', 'XL', 'XXL'], '[{"name":"Negro","hex":"#000000"},{"name":"Blanco","hex":"#FFFFFF"},{"name":"Azul corporativo","hex":"#123A6B"},{"name":"Rojo","hex":"#B91C1C"}]'::jsonb, true, false, false, 15, '[{"min_qty":15,"unit_price_ves":38},{"min_qty":40,"unit_price_ves":33},{"min_qty":100,"unit_price_ves":28}]'::jsonb, 12, 210, array['uniformes', 'corporativo', 'empresas', 'eventos'], null, null, '2025-11-07T09:00:00.000Z'::timestamptz, '2025-12-30T09:00:00.000Z'::timestamptz),
  ('prd_hoodie_ronin', 'hoodie-ronin', 'JLY-HD-001', 'Hoodie Ronin', 'Hoodie 320 g/m² · capucha forrada', 'Molleton interior cepillado, capucha doble capa, puños y ribete en canalé. Sublimación en la espalda: el color entra en la fibra y sobrevive a la máquina de lavar industrial.', 'cat_hoodies', 65, null, 28.5, 'hoodie', 'Algodón peinado 180 g/m²', 'sublimacion', 'Ajuste school', 'Lavar a máquina con agua fría del revés. No usar suavizante. Secar al aire. No plancha sobre el estampado.', array['S', 'M', 'L', 'XL', 'XXL'], '[{"name":"Negro","hex":"#000000"},{"name":"Gris perla","hex":"#C9C9C9"}]'::jsonb, true, true, false, 1, '[]'::jsonb, 4, 320, array['fantasia', 'molleton', 'invierno'], null, null, '2025-11-12T09:00:00.000Z'::timestamptz, '2025-12-29T09:00:00.000Z'::timestamptz),
  ('prd_mono_logo', 'mono-logo', 'JLY-MN-001', 'Mono Logo', 'Franela heavyweight · logo estampado', 'La franela que no falla. 200 g/m², costuras reforzadas, logo en DTF textil de 2,5 cm al pecho. Es la que te pones cuando no quieres pensar qué ponerte.', 'cat_franelas', 19, 24, 6.8, 'franela', 'Algodón peinado 180 g/m²', 'dtf-textil', 'Regular', 'Lavar a máquina con agua fría del revés. No usar suavizante. Secar al aire. No plancha sobre el estampado.', array['S', 'M', 'L', 'XL', 'XXL'], '[{"name":"Negro","hex":"#000000"},{"name":"Blanco","hex":"#FFFFFF"},{"name":"Gris","hex":"#4A4A4A"}]'::jsonb, true, false, false, 1, '[]'::jsonb, 4, 180, array['basico', 'minimal', 'dtf'], null, null, '2025-11-17T09:00:00.000Z'::timestamptz, '2025-12-28T09:00:00.000Z'::timestamptz),
  ('prd_gorra_kuchisake', 'gorra-kuchisake', 'JLY-AC-001', 'Gorra Kuchisake', 'Gorra trucker · frente en DTF textil', 'Visera curva, frente estampado a todo color, malla trasera transpirable. Ajuste con broche metálico.', 'cat_accesorios', 22, null, 9.2, 'gorra', 'Algodón peinado 180 g/m²', 'dtf-textil', 'Ajuste school', 'Lavar a máquina con agua fría del revés. No usar suavizante. Secar al aire. No plancha sobre el estampado.', array['Única'], '[{"name":"Negro","hex":"#000000"},{"name":"Blanco","hex":"#FFFFFF"}]'::jsonb, true, false, false, 1, '[]'::jsonb, 4, 180, array['accesorios', 'fantasia'], null, null, '2025-11-22T09:00:00.000Z'::timestamptz, '2025-12-27T09:00:00.000Z'::timestamptz),
  ('prd_tote_studio', 'tote-studio', 'JLY-AC-002', 'Tote Studio', 'Tote de algodón crudo', 'Bolso de lona 12 oz con fuelle interior, asas reforzadas y bolsillo con cierre. Capacidad para una laptop de 15".', 'cat_accesorios', 16, null, 5.4, 'tote', 'Algodón peinado 180 g/m²', 'dtf-textil', 'Ajuste school', 'Lavar a máquina con agua fría del revés. No usar suavizante. Secar al aire. No plancha sobre el estampado.', array['Única'], '[{"name":"Crudo","hex":"#EFE7D8"},{"name":"Negro","hex":"#000000"}]'::jsonb, true, false, false, 1, '[]'::jsonb, 4, 180, array['accesorios', 'tote'], null, null, '2025-11-27T09:00:00.000Z'::timestamptz, '2025-12-26T09:00:00.000Z'::timestamptz),
  ('prd_pedido_grupos', 'pack-grupos-eventos', 'JLY-UN-003', 'Pack Grupos y Eventos', 'Personalización total desde 10 unidades', 'Para grupos de estudio, equipos y eventos. Elige prenda, técnica de impresión y cantidad; nosotros gestionamos el arte. Puedes mandar una foto de referencia y te cotizamos sin compromiso.', 'cat_medida', 20, null, 7, 'franela', 'Algodón peinado 180 g/m²', 'dtf-textil', 'Ajuste school', 'Lavar a máquina con agua fría del revés. No usar suavizante. Secar al aire. No plancha sobre el estampado.', array['S', 'M', 'L', 'XL', 'XXL'], '[{"name":"A definir","hex":"#FFFFFF"}]'::jsonb, true, false, true, 10, '[]'::jsonb, 10, 180, array['a-medida', 'grupos', 'eventos', 'estudiantes'], null, null, '2025-12-02T09:00:00.000Z'::timestamptz, '2025-12-25T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- product_collections · 18 filas
-- ---------------------------------------------------------------------------
-- Un producto puede estar en varias colecciones; el orden lo fija `sort_order`.
insert into public.product_collections (product_id, collection_id, sort_order) values
  ('prd_samurai_zen', 'col_mythos', 0),
  ('prd_samurai_zen', 'col_invierno', 1),
  ('prd_neon_shinigami', 'col_anime', 0),
  ('prd_neon_shinigami', 'col_invierno', 1),
  ('prd_dragon_ashes', 'col_mythos', 0),
  ('prd_sakura_8bit', 'col_anime', 0),
  ('prd_sakura_8bit', 'col_pixel', 1),
  ('prd_mago_rpg', 'col_pixel', 0),
  ('prd_mago_rpg', 'col_mythos', 1),
  ('prd_uniforme_escolar', 'col_uni', 0),
  ('prd_polo_corporativo', 'col_uni', 0),
  ('prd_hoodie_ronin', 'col_mythos', 0),
  ('prd_hoodie_ronin', 'col_invierno', 1),
  ('prd_mono_logo', 'col_mono', 0),
  ('prd_gorra_kuchisake', 'col_mythos', 0),
  ('prd_tote_studio', 'col_mono', 0),
  ('prd_tote_studio', 'col_colab', 1),
  ('prd_pedido_grupos', 'col_uni', 0)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- product_images · 36 filas
-- ---------------------------------------------------------------------------
-- Fotos de producto. `kind` distingue la principal, la galería y los pósters del 360.
insert into public.product_images (id, product_id, url, alt, kind, sort_order) values
  ('img_prd_samurai_zen_0', 'prd_samurai_zen', '/demo/products/samurai-zen-1.svg', 'Samurai Zen — vista 1', 'main', 0),
  ('img_prd_samurai_zen_1', 'prd_samurai_zen', '/demo/products/samurai-zen-2.svg', 'Samurai Zen — vista 2', 'main', 1),
  ('img_prd_samurai_zen_2', 'prd_samurai_zen', '/demo/products/samurai-zen-3.svg', 'Samurai Zen — vista 3', 'main', 2),
  ('img_prd_neon_shinigami_0', 'prd_neon_shinigami', '/demo/products/neon-shinigami-1.svg', 'Neon Shinigami — vista 1', 'main', 0),
  ('img_prd_neon_shinigami_1', 'prd_neon_shinigami', '/demo/products/neon-shinigami-2.svg', 'Neon Shinigami — vista 2', 'main', 1),
  ('img_prd_neon_shinigami_2', 'prd_neon_shinigami', '/demo/products/neon-shinigami-3.svg', 'Neon Shinigami — vista 3', 'main', 2),
  ('img_prd_dragon_ashes_0', 'prd_dragon_ashes', '/demo/products/dragon-ashes-1.svg', 'Dragon Ashes — vista 1', 'main', 0),
  ('img_prd_dragon_ashes_1', 'prd_dragon_ashes', '/demo/products/dragon-ashes-2.svg', 'Dragon Ashes — vista 2', 'main', 1),
  ('img_prd_dragon_ashes_2', 'prd_dragon_ashes', '/demo/products/dragon-ashes-3.svg', 'Dragon Ashes — vista 3', 'main', 2),
  ('img_prd_sakura_8bit_0', 'prd_sakura_8bit', '/demo/products/sakura-8bit-1.svg', 'Sakura 8-Bit — vista 1', 'main', 0),
  ('img_prd_sakura_8bit_1', 'prd_sakura_8bit', '/demo/products/sakura-8bit-2.svg', 'Sakura 8-Bit — vista 2', 'main', 1),
  ('img_prd_sakura_8bit_2', 'prd_sakura_8bit', '/demo/products/sakura-8bit-3.svg', 'Sakura 8-Bit — vista 3', 'main', 2),
  ('img_prd_mago_rpg_0', 'prd_mago_rpg', '/demo/products/mago-rpg-1.svg', 'Mago RPG — vista 1', 'main', 0),
  ('img_prd_mago_rpg_1', 'prd_mago_rpg', '/demo/products/mago-rpg-2.svg', 'Mago RPG — vista 2', 'main', 1),
  ('img_prd_mago_rpg_2', 'prd_mago_rpg', '/demo/products/mago-rpg-3.svg', 'Mago RPG — vista 3', 'main', 2),
  ('img_prd_uniforme_escolar_0', 'prd_uniforme_escolar', '/demo/products/uniforme-escolar-jb-1.svg', 'Uniforme Escolar Juan Pablo — vista 1', 'main', 0),
  ('img_prd_uniforme_escolar_1', 'prd_uniforme_escolar', '/demo/products/uniforme-escolar-jb-2.svg', 'Uniforme Escolar Juan Pablo — vista 2', 'main', 1),
  ('img_prd_uniforme_escolar_2', 'prd_uniforme_escolar', '/demo/products/uniforme-escolar-jb-3.svg', 'Uniforme Escolar Juan Pablo — vista 3', 'main', 2),
  ('img_prd_polo_corporativo_0', 'prd_polo_corporativo', '/demo/products/polo-corporativo-liso-1.svg', 'Polo Corporativo Liso — vista 1', 'main', 0),
  ('img_prd_polo_corporativo_1', 'prd_polo_corporativo', '/demo/products/polo-corporativo-liso-2.svg', 'Polo Corporativo Liso — vista 2', 'main', 1),
  ('img_prd_polo_corporativo_2', 'prd_polo_corporativo', '/demo/products/polo-corporativo-liso-3.svg', 'Polo Corporativo Liso — vista 3', 'main', 2),
  ('img_prd_hoodie_ronin_0', 'prd_hoodie_ronin', '/demo/products/hoodie-ronin-1.svg', 'Hoodie Ronin — vista 1', 'main', 0),
  ('img_prd_hoodie_ronin_1', 'prd_hoodie_ronin', '/demo/products/hoodie-ronin-2.svg', 'Hoodie Ronin — vista 2', 'main', 1),
  ('img_prd_hoodie_ronin_2', 'prd_hoodie_ronin', '/demo/products/hoodie-ronin-3.svg', 'Hoodie Ronin — vista 3', 'main', 2),
  ('img_prd_mono_logo_0', 'prd_mono_logo', '/demo/products/mono-logo-1.svg', 'Mono Logo — vista 1', 'main', 0),
  ('img_prd_mono_logo_1', 'prd_mono_logo', '/demo/products/mono-logo-2.svg', 'Mono Logo — vista 2', 'main', 1),
  ('img_prd_mono_logo_2', 'prd_mono_logo', '/demo/products/mono-logo-3.svg', 'Mono Logo — vista 3', 'main', 2),
  ('img_prd_gorra_kuchisake_0', 'prd_gorra_kuchisake', '/demo/products/gorra-kuchisake-1.svg', 'Gorra Kuchisake — vista 1', 'main', 0),
  ('img_prd_gorra_kuchisake_1', 'prd_gorra_kuchisake', '/demo/products/gorra-kuchisake-2.svg', 'Gorra Kuchisake — vista 2', 'main', 1),
  ('img_prd_gorra_kuchisake_2', 'prd_gorra_kuchisake', '/demo/products/gorra-kuchisake-3.svg', 'Gorra Kuchisake — vista 3', 'main', 2),
  ('img_prd_tote_studio_0', 'prd_tote_studio', '/demo/products/tote-studio-1.svg', 'Tote Studio — vista 1', 'main', 0),
  ('img_prd_tote_studio_1', 'prd_tote_studio', '/demo/products/tote-studio-2.svg', 'Tote Studio — vista 2', 'main', 1),
  ('img_prd_tote_studio_2', 'prd_tote_studio', '/demo/products/tote-studio-3.svg', 'Tote Studio — vista 3', 'main', 2),
  ('img_prd_pedido_grupos_0', 'prd_pedido_grupos', '/demo/products/pack-grupos-eventos-1.svg', 'Pack Grupos y Eventos — vista 1', 'main', 0),
  ('img_prd_pedido_grupos_1', 'prd_pedido_grupos', '/demo/products/pack-grupos-eventos-2.svg', 'Pack Grupos y Eventos — vista 2', 'main', 1),
  ('img_prd_pedido_grupos_2', 'prd_pedido_grupos', '/demo/products/pack-grupos-eventos-3.svg', 'Pack Grupos y Eventos — vista 3', 'main', 2)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- product_spin360 · 11 filas
-- ---------------------------------------------------------------------------
-- Visor 360°: una fila por producto con los fotogramas en orden.
insert into public.product_spin360 (product_id, frames, frame_count, poster_url, updated_at) values
  ('prd_samurai_zen', array['/demo/spin/samurai-zen/00.svg', '/demo/spin/samurai-zen/01.svg', '/demo/spin/samurai-zen/02.svg', '/demo/spin/samurai-zen/03.svg', '/demo/spin/samurai-zen/04.svg', '/demo/spin/samurai-zen/05.svg', '/demo/spin/samurai-zen/06.svg', '/demo/spin/samurai-zen/07.svg', '/demo/spin/samurai-zen/08.svg', '/demo/spin/samurai-zen/09.svg', '/demo/spin/samurai-zen/10.svg', '/demo/spin/samurai-zen/11.svg', '/demo/spin/samurai-zen/12.svg', '/demo/spin/samurai-zen/13.svg', '/demo/spin/samurai-zen/14.svg', '/demo/spin/samurai-zen/15.svg', '/demo/spin/samurai-zen/16.svg', '/demo/spin/samurai-zen/17.svg', '/demo/spin/samurai-zen/18.svg', '/demo/spin/samurai-zen/19.svg', '/demo/spin/samurai-zen/20.svg', '/demo/spin/samurai-zen/21.svg', '/demo/spin/samurai-zen/22.svg', '/demo/spin/samurai-zen/23.svg', '/demo/spin/samurai-zen/24.svg', '/demo/spin/samurai-zen/25.svg', '/demo/spin/samurai-zen/26.svg', '/demo/spin/samurai-zen/27.svg', '/demo/spin/samurai-zen/28.svg', '/demo/spin/samurai-zen/29.svg', '/demo/spin/samurai-zen/30.svg', '/demo/spin/samurai-zen/31.svg', '/demo/spin/samurai-zen/32.svg', '/demo/spin/samurai-zen/33.svg', '/demo/spin/samurai-zen/34.svg', '/demo/spin/samurai-zen/35.svg'], 36, '/demo/spin/samurai-zen/00.svg', '2026-01-03T09:00:00.000Z'::timestamptz),
  ('prd_neon_shinigami', array['/demo/spin/neon-shinigami/00.svg', '/demo/spin/neon-shinigami/01.svg', '/demo/spin/neon-shinigami/02.svg', '/demo/spin/neon-shinigami/03.svg', '/demo/spin/neon-shinigami/04.svg', '/demo/spin/neon-shinigami/05.svg', '/demo/spin/neon-shinigami/06.svg', '/demo/spin/neon-shinigami/07.svg', '/demo/spin/neon-shinigami/08.svg', '/demo/spin/neon-shinigami/09.svg', '/demo/spin/neon-shinigami/10.svg', '/demo/spin/neon-shinigami/11.svg', '/demo/spin/neon-shinigami/12.svg', '/demo/spin/neon-shinigami/13.svg', '/demo/spin/neon-shinigami/14.svg', '/demo/spin/neon-shinigami/15.svg', '/demo/spin/neon-shinigami/16.svg', '/demo/spin/neon-shinigami/17.svg', '/demo/spin/neon-shinigami/18.svg', '/demo/spin/neon-shinigami/19.svg', '/demo/spin/neon-shinigami/20.svg', '/demo/spin/neon-shinigami/21.svg', '/demo/spin/neon-shinigami/22.svg', '/demo/spin/neon-shinigami/23.svg', '/demo/spin/neon-shinigami/24.svg', '/demo/spin/neon-shinigami/25.svg', '/demo/spin/neon-shinigami/26.svg', '/demo/spin/neon-shinigami/27.svg', '/demo/spin/neon-shinigami/28.svg', '/demo/spin/neon-shinigami/29.svg', '/demo/spin/neon-shinigami/30.svg', '/demo/spin/neon-shinigami/31.svg', '/demo/spin/neon-shinigami/32.svg', '/demo/spin/neon-shinigami/33.svg', '/demo/spin/neon-shinigami/34.svg', '/demo/spin/neon-shinigami/35.svg'], 36, '/demo/spin/neon-shinigami/00.svg', '2026-01-03T09:00:00.000Z'::timestamptz),
  ('prd_dragon_ashes', array['/demo/spin/dragon-ashes/00.svg', '/demo/spin/dragon-ashes/01.svg', '/demo/spin/dragon-ashes/02.svg', '/demo/spin/dragon-ashes/03.svg', '/demo/spin/dragon-ashes/04.svg', '/demo/spin/dragon-ashes/05.svg', '/demo/spin/dragon-ashes/06.svg', '/demo/spin/dragon-ashes/07.svg', '/demo/spin/dragon-ashes/08.svg', '/demo/spin/dragon-ashes/09.svg', '/demo/spin/dragon-ashes/10.svg', '/demo/spin/dragon-ashes/11.svg', '/demo/spin/dragon-ashes/12.svg', '/demo/spin/dragon-ashes/13.svg', '/demo/spin/dragon-ashes/14.svg', '/demo/spin/dragon-ashes/15.svg', '/demo/spin/dragon-ashes/16.svg', '/demo/spin/dragon-ashes/17.svg', '/demo/spin/dragon-ashes/18.svg', '/demo/spin/dragon-ashes/19.svg', '/demo/spin/dragon-ashes/20.svg', '/demo/spin/dragon-ashes/21.svg', '/demo/spin/dragon-ashes/22.svg', '/demo/spin/dragon-ashes/23.svg', '/demo/spin/dragon-ashes/24.svg', '/demo/spin/dragon-ashes/25.svg', '/demo/spin/dragon-ashes/26.svg', '/demo/spin/dragon-ashes/27.svg', '/demo/spin/dragon-ashes/28.svg', '/demo/spin/dragon-ashes/29.svg', '/demo/spin/dragon-ashes/30.svg', '/demo/spin/dragon-ashes/31.svg', '/demo/spin/dragon-ashes/32.svg', '/demo/spin/dragon-ashes/33.svg', '/demo/spin/dragon-ashes/34.svg', '/demo/spin/dragon-ashes/35.svg'], 36, '/demo/spin/dragon-ashes/00.svg', '2026-01-03T09:00:00.000Z'::timestamptz),
  ('prd_sakura_8bit', array['/demo/spin/sakura-8bit/00.svg', '/demo/spin/sakura-8bit/01.svg', '/demo/spin/sakura-8bit/02.svg', '/demo/spin/sakura-8bit/03.svg', '/demo/spin/sakura-8bit/04.svg', '/demo/spin/sakura-8bit/05.svg', '/demo/spin/sakura-8bit/06.svg', '/demo/spin/sakura-8bit/07.svg', '/demo/spin/sakura-8bit/08.svg', '/demo/spin/sakura-8bit/09.svg', '/demo/spin/sakura-8bit/10.svg', '/demo/spin/sakura-8bit/11.svg', '/demo/spin/sakura-8bit/12.svg', '/demo/spin/sakura-8bit/13.svg', '/demo/spin/sakura-8bit/14.svg', '/demo/spin/sakura-8bit/15.svg', '/demo/spin/sakura-8bit/16.svg', '/demo/spin/sakura-8bit/17.svg', '/demo/spin/sakura-8bit/18.svg', '/demo/spin/sakura-8bit/19.svg', '/demo/spin/sakura-8bit/20.svg', '/demo/spin/sakura-8bit/21.svg', '/demo/spin/sakura-8bit/22.svg', '/demo/spin/sakura-8bit/23.svg', '/demo/spin/sakura-8bit/24.svg', '/demo/spin/sakura-8bit/25.svg', '/demo/spin/sakura-8bit/26.svg', '/demo/spin/sakura-8bit/27.svg', '/demo/spin/sakura-8bit/28.svg', '/demo/spin/sakura-8bit/29.svg', '/demo/spin/sakura-8bit/30.svg', '/demo/spin/sakura-8bit/31.svg', '/demo/spin/sakura-8bit/32.svg', '/demo/spin/sakura-8bit/33.svg', '/demo/spin/sakura-8bit/34.svg', '/demo/spin/sakura-8bit/35.svg'], 36, '/demo/spin/sakura-8bit/00.svg', '2026-01-03T09:00:00.000Z'::timestamptz),
  ('prd_mago_rpg', array['/demo/spin/mago-rpg/00.svg', '/demo/spin/mago-rpg/01.svg', '/demo/spin/mago-rpg/02.svg', '/demo/spin/mago-rpg/03.svg', '/demo/spin/mago-rpg/04.svg', '/demo/spin/mago-rpg/05.svg', '/demo/spin/mago-rpg/06.svg', '/demo/spin/mago-rpg/07.svg', '/demo/spin/mago-rpg/08.svg', '/demo/spin/mago-rpg/09.svg', '/demo/spin/mago-rpg/10.svg', '/demo/spin/mago-rpg/11.svg', '/demo/spin/mago-rpg/12.svg', '/demo/spin/mago-rpg/13.svg', '/demo/spin/mago-rpg/14.svg', '/demo/spin/mago-rpg/15.svg', '/demo/spin/mago-rpg/16.svg', '/demo/spin/mago-rpg/17.svg', '/demo/spin/mago-rpg/18.svg', '/demo/spin/mago-rpg/19.svg', '/demo/spin/mago-rpg/20.svg', '/demo/spin/mago-rpg/21.svg', '/demo/spin/mago-rpg/22.svg', '/demo/spin/mago-rpg/23.svg', '/demo/spin/mago-rpg/24.svg', '/demo/spin/mago-rpg/25.svg', '/demo/spin/mago-rpg/26.svg', '/demo/spin/mago-rpg/27.svg', '/demo/spin/mago-rpg/28.svg', '/demo/spin/mago-rpg/29.svg', '/demo/spin/mago-rpg/30.svg', '/demo/spin/mago-rpg/31.svg', '/demo/spin/mago-rpg/32.svg', '/demo/spin/mago-rpg/33.svg', '/demo/spin/mago-rpg/34.svg', '/demo/spin/mago-rpg/35.svg'], 36, '/demo/spin/mago-rpg/00.svg', '2026-01-03T09:00:00.000Z'::timestamptz),
  ('prd_uniforme_escolar', array['/demo/spin/uniforme-escolar-jb/00.svg', '/demo/spin/uniforme-escolar-jb/01.svg', '/demo/spin/uniforme-escolar-jb/02.svg', '/demo/spin/uniforme-escolar-jb/03.svg', '/demo/spin/uniforme-escolar-jb/04.svg', '/demo/spin/uniforme-escolar-jb/05.svg', '/demo/spin/uniforme-escolar-jb/06.svg', '/demo/spin/uniforme-escolar-jb/07.svg', '/demo/spin/uniforme-escolar-jb/08.svg', '/demo/spin/uniforme-escolar-jb/09.svg', '/demo/spin/uniforme-escolar-jb/10.svg', '/demo/spin/uniforme-escolar-jb/11.svg', '/demo/spin/uniforme-escolar-jb/12.svg', '/demo/spin/uniforme-escolar-jb/13.svg', '/demo/spin/uniforme-escolar-jb/14.svg', '/demo/spin/uniforme-escolar-jb/15.svg', '/demo/spin/uniforme-escolar-jb/16.svg', '/demo/spin/uniforme-escolar-jb/17.svg', '/demo/spin/uniforme-escolar-jb/18.svg', '/demo/spin/uniforme-escolar-jb/19.svg', '/demo/spin/uniforme-escolar-jb/20.svg', '/demo/spin/uniforme-escolar-jb/21.svg', '/demo/spin/uniforme-escolar-jb/22.svg', '/demo/spin/uniforme-escolar-jb/23.svg', '/demo/spin/uniforme-escolar-jb/24.svg', '/demo/spin/uniforme-escolar-jb/25.svg', '/demo/spin/uniforme-escolar-jb/26.svg', '/demo/spin/uniforme-escolar-jb/27.svg', '/demo/spin/uniforme-escolar-jb/28.svg', '/demo/spin/uniforme-escolar-jb/29.svg', '/demo/spin/uniforme-escolar-jb/30.svg', '/demo/spin/uniforme-escolar-jb/31.svg', '/demo/spin/uniforme-escolar-jb/32.svg', '/demo/spin/uniforme-escolar-jb/33.svg', '/demo/spin/uniforme-escolar-jb/34.svg', '/demo/spin/uniforme-escolar-jb/35.svg'], 36, '/demo/spin/uniforme-escolar-jb/00.svg', '2026-01-03T09:00:00.000Z'::timestamptz),
  ('prd_polo_corporativo', array['/demo/spin/polo-corporativo-liso/00.svg', '/demo/spin/polo-corporativo-liso/01.svg', '/demo/spin/polo-corporativo-liso/02.svg', '/demo/spin/polo-corporativo-liso/03.svg', '/demo/spin/polo-corporativo-liso/04.svg', '/demo/spin/polo-corporativo-liso/05.svg', '/demo/spin/polo-corporativo-liso/06.svg', '/demo/spin/polo-corporativo-liso/07.svg', '/demo/spin/polo-corporativo-liso/08.svg', '/demo/spin/polo-corporativo-liso/09.svg', '/demo/spin/polo-corporativo-liso/10.svg', '/demo/spin/polo-corporativo-liso/11.svg', '/demo/spin/polo-corporativo-liso/12.svg', '/demo/spin/polo-corporativo-liso/13.svg', '/demo/spin/polo-corporativo-liso/14.svg', '/demo/spin/polo-corporativo-liso/15.svg', '/demo/spin/polo-corporativo-liso/16.svg', '/demo/spin/polo-corporativo-liso/17.svg', '/demo/spin/polo-corporativo-liso/18.svg', '/demo/spin/polo-corporativo-liso/19.svg', '/demo/spin/polo-corporativo-liso/20.svg', '/demo/spin/polo-corporativo-liso/21.svg', '/demo/spin/polo-corporativo-liso/22.svg', '/demo/spin/polo-corporativo-liso/23.svg', '/demo/spin/polo-corporativo-liso/24.svg', '/demo/spin/polo-corporativo-liso/25.svg', '/demo/spin/polo-corporativo-liso/26.svg', '/demo/spin/polo-corporativo-liso/27.svg', '/demo/spin/polo-corporativo-liso/28.svg', '/demo/spin/polo-corporativo-liso/29.svg', '/demo/spin/polo-corporativo-liso/30.svg', '/demo/spin/polo-corporativo-liso/31.svg', '/demo/spin/polo-corporativo-liso/32.svg', '/demo/spin/polo-corporativo-liso/33.svg', '/demo/spin/polo-corporativo-liso/34.svg', '/demo/spin/polo-corporativo-liso/35.svg'], 36, '/demo/spin/polo-corporativo-liso/00.svg', '2026-01-03T09:00:00.000Z'::timestamptz),
  ('prd_hoodie_ronin', array['/demo/spin/hoodie-ronin/00.svg', '/demo/spin/hoodie-ronin/01.svg', '/demo/spin/hoodie-ronin/02.svg', '/demo/spin/hoodie-ronin/03.svg', '/demo/spin/hoodie-ronin/04.svg', '/demo/spin/hoodie-ronin/05.svg', '/demo/spin/hoodie-ronin/06.svg', '/demo/spin/hoodie-ronin/07.svg', '/demo/spin/hoodie-ronin/08.svg', '/demo/spin/hoodie-ronin/09.svg', '/demo/spin/hoodie-ronin/10.svg', '/demo/spin/hoodie-ronin/11.svg', '/demo/spin/hoodie-ronin/12.svg', '/demo/spin/hoodie-ronin/13.svg', '/demo/spin/hoodie-ronin/14.svg', '/demo/spin/hoodie-ronin/15.svg', '/demo/spin/hoodie-ronin/16.svg', '/demo/spin/hoodie-ronin/17.svg', '/demo/spin/hoodie-ronin/18.svg', '/demo/spin/hoodie-ronin/19.svg', '/demo/spin/hoodie-ronin/20.svg', '/demo/spin/hoodie-ronin/21.svg', '/demo/spin/hoodie-ronin/22.svg', '/demo/spin/hoodie-ronin/23.svg', '/demo/spin/hoodie-ronin/24.svg', '/demo/spin/hoodie-ronin/25.svg', '/demo/spin/hoodie-ronin/26.svg', '/demo/spin/hoodie-ronin/27.svg', '/demo/spin/hoodie-ronin/28.svg', '/demo/spin/hoodie-ronin/29.svg', '/demo/spin/hoodie-ronin/30.svg', '/demo/spin/hoodie-ronin/31.svg', '/demo/spin/hoodie-ronin/32.svg', '/demo/spin/hoodie-ronin/33.svg', '/demo/spin/hoodie-ronin/34.svg', '/demo/spin/hoodie-ronin/35.svg'], 36, '/demo/spin/hoodie-ronin/00.svg', '2026-01-03T09:00:00.000Z'::timestamptz),
  ('prd_mono_logo', array['/demo/spin/mono-logo/00.svg', '/demo/spin/mono-logo/01.svg', '/demo/spin/mono-logo/02.svg', '/demo/spin/mono-logo/03.svg', '/demo/spin/mono-logo/04.svg', '/demo/spin/mono-logo/05.svg', '/demo/spin/mono-logo/06.svg', '/demo/spin/mono-logo/07.svg', '/demo/spin/mono-logo/08.svg', '/demo/spin/mono-logo/09.svg', '/demo/spin/mono-logo/10.svg', '/demo/spin/mono-logo/11.svg', '/demo/spin/mono-logo/12.svg', '/demo/spin/mono-logo/13.svg', '/demo/spin/mono-logo/14.svg', '/demo/spin/mono-logo/15.svg', '/demo/spin/mono-logo/16.svg', '/demo/spin/mono-logo/17.svg', '/demo/spin/mono-logo/18.svg', '/demo/spin/mono-logo/19.svg', '/demo/spin/mono-logo/20.svg', '/demo/spin/mono-logo/21.svg', '/demo/spin/mono-logo/22.svg', '/demo/spin/mono-logo/23.svg', '/demo/spin/mono-logo/24.svg', '/demo/spin/mono-logo/25.svg', '/demo/spin/mono-logo/26.svg', '/demo/spin/mono-logo/27.svg', '/demo/spin/mono-logo/28.svg', '/demo/spin/mono-logo/29.svg', '/demo/spin/mono-logo/30.svg', '/demo/spin/mono-logo/31.svg', '/demo/spin/mono-logo/32.svg', '/demo/spin/mono-logo/33.svg', '/demo/spin/mono-logo/34.svg', '/demo/spin/mono-logo/35.svg'], 36, '/demo/spin/mono-logo/00.svg', '2026-01-03T09:00:00.000Z'::timestamptz),
  ('prd_gorra_kuchisake', array['/demo/spin/gorra-kuchisake/00.svg', '/demo/spin/gorra-kuchisake/01.svg', '/demo/spin/gorra-kuchisake/02.svg', '/demo/spin/gorra-kuchisake/03.svg', '/demo/spin/gorra-kuchisake/04.svg', '/demo/spin/gorra-kuchisake/05.svg', '/demo/spin/gorra-kuchisake/06.svg', '/demo/spin/gorra-kuchisake/07.svg', '/demo/spin/gorra-kuchisake/08.svg', '/demo/spin/gorra-kuchisake/09.svg', '/demo/spin/gorra-kuchisake/10.svg', '/demo/spin/gorra-kuchisake/11.svg', '/demo/spin/gorra-kuchisake/12.svg', '/demo/spin/gorra-kuchisake/13.svg', '/demo/spin/gorra-kuchisake/14.svg', '/demo/spin/gorra-kuchisake/15.svg', '/demo/spin/gorra-kuchisake/16.svg', '/demo/spin/gorra-kuchisake/17.svg', '/demo/spin/gorra-kuchisake/18.svg', '/demo/spin/gorra-kuchisake/19.svg', '/demo/spin/gorra-kuchisake/20.svg', '/demo/spin/gorra-kuchisake/21.svg', '/demo/spin/gorra-kuchisake/22.svg', '/demo/spin/gorra-kuchisake/23.svg', '/demo/spin/gorra-kuchisake/24.svg', '/demo/spin/gorra-kuchisake/25.svg', '/demo/spin/gorra-kuchisake/26.svg', '/demo/spin/gorra-kuchisake/27.svg', '/demo/spin/gorra-kuchisake/28.svg', '/demo/spin/gorra-kuchisake/29.svg', '/demo/spin/gorra-kuchisake/30.svg', '/demo/spin/gorra-kuchisake/31.svg', '/demo/spin/gorra-kuchisake/32.svg', '/demo/spin/gorra-kuchisake/33.svg', '/demo/spin/gorra-kuchisake/34.svg', '/demo/spin/gorra-kuchisake/35.svg'], 36, '/demo/spin/gorra-kuchisake/00.svg', '2026-01-03T09:00:00.000Z'::timestamptz),
  ('prd_tote_studio', array['/demo/spin/tote-studio/00.svg', '/demo/spin/tote-studio/01.svg', '/demo/spin/tote-studio/02.svg', '/demo/spin/tote-studio/03.svg', '/demo/spin/tote-studio/04.svg', '/demo/spin/tote-studio/05.svg', '/demo/spin/tote-studio/06.svg', '/demo/spin/tote-studio/07.svg', '/demo/spin/tote-studio/08.svg', '/demo/spin/tote-studio/09.svg', '/demo/spin/tote-studio/10.svg', '/demo/spin/tote-studio/11.svg', '/demo/spin/tote-studio/12.svg', '/demo/spin/tote-studio/13.svg', '/demo/spin/tote-studio/14.svg', '/demo/spin/tote-studio/15.svg', '/demo/spin/tote-studio/16.svg', '/demo/spin/tote-studio/17.svg', '/demo/spin/tote-studio/18.svg', '/demo/spin/tote-studio/19.svg', '/demo/spin/tote-studio/20.svg', '/demo/spin/tote-studio/21.svg', '/demo/spin/tote-studio/22.svg', '/demo/spin/tote-studio/23.svg', '/demo/spin/tote-studio/24.svg', '/demo/spin/tote-studio/25.svg', '/demo/spin/tote-studio/26.svg', '/demo/spin/tote-studio/27.svg', '/demo/spin/tote-studio/28.svg', '/demo/spin/tote-studio/29.svg', '/demo/spin/tote-studio/30.svg', '/demo/spin/tote-studio/31.svg', '/demo/spin/tote-studio/32.svg', '/demo/spin/tote-studio/33.svg', '/demo/spin/tote-studio/34.svg', '/demo/spin/tote-studio/35.svg'], 36, '/demo/spin/tote-studio/00.svg', '2026-01-03T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- promotions · 6 filas
-- ---------------------------------------------------------------------------
-- Descuentos por producto o por colección, en porcentaje o monto fijo.
insert into public.promotions (id, name, scope, product_id, collection_id, kind, value, starts_at, ends_at, is_active, priority, created_at) values
  ('promo_invierno', 'Invierno 26 — 20% en toda la colección', 'collection', null, 'col_invierno', 'percent', 20, null, '2026-02-05T09:00:00.000Z'::timestamptz, true, 10, '2025-12-07T09:00:00.000Z'::timestamptz),
  ('promo_mono', 'Mono a precio de introduction', 'collection', null, 'col_mono', 'fixed', 3, null, null, true, 5, '2025-10-18T09:00:00.000Z'::timestamptz),
  ('promo_neon', '2x1 en Neon Shinigami (precio fijo)', 'product', 'prd_neon_shinigami', null, 'fixed', 3, null, null, true, 1, '2025-12-12T09:00:00.000Z'::timestamptz),
  ('promo_anime', 'Anime Legends — 10%', 'collection', null, 'col_anime', 'percent', 10, null, null, true, 5, '2025-11-07T09:00:00.000Z'::timestamptz),
  ('promo_vencido', 'Aniversario (finalizado)', 'collection', null, 'col_pixel', 'percent', 15, null, '2025-12-17T09:00:00.000Z'::timestamptz, true, 1, '2025-09-08T09:00:00.000Z'::timestamptz),
  ('promo_uni', 'Uniformes 2026 — 12%', 'collection', null, 'col_uni', 'percent', 12, null, '2026-03-07T09:00:00.000Z'::timestamptz, true, 3, '2025-11-17T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- coupons · 4 filas
-- ---------------------------------------------------------------------------
-- Códigos de descuento para el checkout.
insert into public.coupons (id, code, kind, value, min_subtotal_ves, max_uses, used_count, starts_at, ends_at, is_active, description, created_at) values
  ('coup_bienvenida', 'BIENVENIDA10', 'percent', 10, 0, null, 23, null, null, true, '10% para la primera compra (tope 5 Bs)', '2025-09-08T09:00:00.000Z'::timestamptz),
  ('coup_estudiantes', 'ESTUDIANTES', 'percent', 15, 40, 200, 61, null, null, true, '15% para compras de grupos y estudiantes', '2025-10-08T09:00:00.000Z'::timestamptz),
  ('coup_envio', 'ENVIOGRATIS', 'fixed', 0, 30, null, 12, null, null, true, 'Envío gratis en compras desde 30 Bs', '2025-10-28T09:00:00.000Z'::timestamptz),
  ('coup_viejo', 'NAVIDAD25', 'percent', 25, 0, null, 88, null, '2025-12-22T09:00:00.000Z'::timestamptz, false, 'Campaña de diciembre (cerrada)', '2025-06-20T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- variants · 128 filas
-- ---------------------------------------------------------------------------
-- Talla × color con su stock. Una fila por combinación.
insert into public.variants (id, product_id, sku, size, color, color_hex, stock, reserved_stock, min_stock, cost_ves, price_delta_ves, is_active, barcode, created_at, updated_at) values
  ('var_prd_samurai_zen_0_0', 'prd_samurai_zen', 'JLY-FR-001-AS', 'S', 'Negro', '#000000', 22, 0, 4, 7.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_samurai_zen_0_1', 'prd_samurai_zen', 'JLY-FR-001-BS', 'S', 'Blanco', '#FFFFFF', 8, 0, 4, 7.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_samurai_zen_0_2', 'prd_samurai_zen', 'JLY-FR-001-CS', 'S', 'Arena', '#D8CFC0', 7, 0, 4, 7.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_samurai_zen_1_0', 'prd_samurai_zen', 'JLY-FR-001-AM', 'M', 'Negro', '#000000', 31, 0, 4, 7.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_samurai_zen_1_1', 'prd_samurai_zen', 'JLY-FR-001-BM', 'M', 'Blanco', '#FFFFFF', 11, 0, 4, 7.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_samurai_zen_1_2', 'prd_samurai_zen', 'JLY-FR-001-CM', 'M', 'Arena', '#D8CFC0', 10, 0, 4, 7.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_samurai_zen_2_0', 'prd_samurai_zen', 'JLY-FR-001-AL', 'L', 'Negro', '#000000', 18, 0, 4, 7.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_samurai_zen_2_1', 'prd_samurai_zen', 'JLY-FR-001-BL', 'L', 'Blanco', '#FFFFFF', 6, 0, 4, 7.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_samurai_zen_2_2', 'prd_samurai_zen', 'JLY-FR-001-CL', 'L', 'Arena', '#D8CFC0', 5, 0, 4, 7.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_samurai_zen_3_0', 'prd_samurai_zen', 'JLY-FR-001-AXL', 'XL', 'Negro', '#000000', 9, 0, 4, 7.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_samurai_zen_3_1', 'prd_samurai_zen', 'JLY-FR-001-BXL', 'XL', 'Blanco', '#FFFFFF', 3, 0, 4, 7.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_samurai_zen_3_2', 'prd_samurai_zen', 'JLY-FR-001-CXL', 'XL', 'Arena', '#D8CFC0', 2, 0, 4, 7.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_neon_shinigami_0_0', 'prd_neon_shinigami', 'JLY-FR-002-AM', 'M', 'Negro', '#000000', 11, 0, 4, 9.4, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_neon_shinigami_0_1', 'prd_neon_shinigami', 'JLY-FR-002-BM', 'M', 'Verde ácido', '#9EF01A', 3, 0, 4, 9.4, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_neon_shinigami_1_0', 'prd_neon_shinigami', 'JLY-FR-002-AL', 'L', 'Negro', '#000000', 14, 0, 4, 9.4, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_neon_shinigami_1_1', 'prd_neon_shinigami', 'JLY-FR-002-BL', 'L', 'Verde ácido', '#9EF01A', 5, 0, 4, 9.4, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_neon_shinigami_2_0', 'prd_neon_shinigami', 'JLY-FR-002-AXL', 'XL', 'Negro', '#000000', 6, 0, 4, 9.4, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_neon_shinigami_2_1', 'prd_neon_shinigami', 'JLY-FR-002-BXL', 'XL', 'Verde ácido', '#9EF01A', 1, 0, 4, 9.4, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_dragon_ashes_0_0', 'prd_dragon_ashes', 'JLY-FR-003-AS', 'S', 'Negro', '#000000', 12, 0, 4, 11.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_dragon_ashes_0_1', 'prd_dragon_ashes', 'JLY-FR-003-BS', 'S', 'Gris jaspeado', '#4A4A4A', 4, 0, 4, 11.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_dragon_ashes_0_2', 'prd_dragon_ashes', 'JLY-FR-003-CS', 'S', 'Sangre', '#8A1111', 3, 0, 4, 11.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_dragon_ashes_1_0', 'prd_dragon_ashes', 'JLY-FR-003-AM', 'M', 'Negro', '#000000', 20, 0, 4, 11.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_dragon_ashes_1_1', 'prd_dragon_ashes', 'JLY-FR-003-BM', 'M', 'Gris jaspeado', '#4A4A4A', 7, 0, 4, 11.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_dragon_ashes_1_2', 'prd_dragon_ashes', 'JLY-FR-003-CM', 'M', 'Sangre', '#8A1111', 6, 0, 4, 11.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_dragon_ashes_2_0', 'prd_dragon_ashes', 'JLY-FR-003-AL', 'L', 'Negro', '#000000', 15, 0, 4, 11.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_dragon_ashes_2_1', 'prd_dragon_ashes', 'JLY-FR-003-BL', 'L', 'Gris jaspeado', '#4A4A4A', 5, 0, 4, 11.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_dragon_ashes_2_2', 'prd_dragon_ashes', 'JLY-FR-003-CL', 'L', 'Sangre', '#8A1111', 4, 0, 4, 11.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_dragon_ashes_3_0', 'prd_dragon_ashes', 'JLY-FR-003-AXL', 'XL', 'Negro', '#000000', 5, 0, 4, 11.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_dragon_ashes_3_1', 'prd_dragon_ashes', 'JLY-FR-003-BXL', 'XL', 'Gris jaspeado', '#4A4A4A', 1, 0, 4, 11.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_dragon_ashes_3_2', 'prd_dragon_ashes', 'JLY-FR-003-CXL', 'XL', 'Sangre', '#8A1111', 0, 0, 4, 11.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_dragon_ashes_4_0', 'prd_dragon_ashes', 'JLY-FR-003-AXXL', 'XXL', 'Negro', '#000000', 3, 0, 4, 11.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_dragon_ashes_4_1', 'prd_dragon_ashes', 'JLY-FR-003-BXXL', 'XXL', 'Gris jaspeado', '#4A4A4A', 0, 0, 4, 11.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_dragon_ashes_4_2', 'prd_dragon_ashes', 'JLY-FR-003-CXXL', 'XXL', 'Sangre', '#8A1111', 0, 0, 4, 11.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_sakura_8bit_0_0', 'prd_sakura_8bit', 'JLY-FR-004-AS', 'S', 'Blanco', '#FFFFFF', 16, 0, 4, 6.1, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_sakura_8bit_0_1', 'prd_sakura_8bit', 'JLY-FR-004-BS', 'S', 'Rosa', '#F2C6D0', 5, 0, 4, 6.1, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_sakura_8bit_0_2', 'prd_sakura_8bit', 'JLY-FR-004-CS', 'S', 'Negro', '#000000', 4, 0, 4, 6.1, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_sakura_8bit_1_0', 'prd_sakura_8bit', 'JLY-FR-004-AM', 'M', 'Blanco', '#FFFFFF', 27, 0, 4, 6.1, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_sakura_8bit_1_1', 'prd_sakura_8bit', 'JLY-FR-004-BM', 'M', 'Rosa', '#F2C6D0', 10, 0, 4, 6.1, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_sakura_8bit_1_2', 'prd_sakura_8bit', 'JLY-FR-004-CM', 'M', 'Negro', '#000000', 9, 0, 4, 6.1, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_sakura_8bit_2_0', 'prd_sakura_8bit', 'JLY-FR-004-AL', 'L', 'Blanco', '#FFFFFF', 22, 0, 4, 6.1, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_sakura_8bit_2_1', 'prd_sakura_8bit', 'JLY-FR-004-BL', 'L', 'Rosa', '#F2C6D0', 8, 0, 4, 6.1, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_sakura_8bit_2_2', 'prd_sakura_8bit', 'JLY-FR-004-CL', 'L', 'Negro', '#000000', 7, 0, 4, 6.1, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_sakura_8bit_3_0', 'prd_sakura_8bit', 'JLY-FR-004-AXL', 'XL', 'Blanco', '#FFFFFF', 8, 0, 4, 6.1, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_sakura_8bit_3_1', 'prd_sakura_8bit', 'JLY-FR-004-BXL', 'XL', 'Rosa', '#F2C6D0', 2, 0, 4, 6.1, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_sakura_8bit_3_2', 'prd_sakura_8bit', 'JLY-FR-004-CXL', 'XL', 'Negro', '#000000', 1, 0, 4, 6.1, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_mago_rpg_0_0', 'prd_mago_rpg', 'JLY-FR-005-AM', 'M', 'Negro', '#000000', 9, 0, 4, 8.9, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_mago_rpg_0_1', 'prd_mago_rpg', 'JLY-FR-005-BM', 'M', 'Azul tinta', '#14213D', 3, 0, 4, 8.9, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_mago_rpg_1_0', 'prd_mago_rpg', 'JLY-FR-005-AL', 'L', 'Negro', '#000000', 13, 0, 4, 8.9, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_mago_rpg_1_1', 'prd_mago_rpg', 'JLY-FR-005-BL', 'L', 'Azul tinta', '#14213D', 4, 0, 4, 8.9, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_mago_rpg_2_0', 'prd_mago_rpg', 'JLY-FR-005-AXL', 'XL', 'Negro', '#000000', 8, 0, 4, 8.9, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_mago_rpg_2_1', 'prd_mago_rpg', 'JLY-FR-005-BXL', 'XL', 'Azul tinta', '#14213D', 2, 0, 4, 8.9, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_0_0', 'prd_uniforme_escolar', 'JLY-UN-001-A6', '6', 'Blanco', '#FFFFFF', 40, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_0_1', 'prd_uniforme_escolar', 'JLY-UN-001-B6', '6', 'Azul marino', '#1B2A4A', 15, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_0_2', 'prd_uniforme_escolar', 'JLY-UN-001-C6', '6', 'Gris', '#5A5A5A', 14, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_1_0', 'prd_uniforme_escolar', 'JLY-UN-001-A8', '8', 'Blanco', '#FFFFFF', 45, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_1_1', 'prd_uniforme_escolar', 'JLY-UN-001-B8', '8', 'Azul marino', '#1B2A4A', 17, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_1_2', 'prd_uniforme_escolar', 'JLY-UN-001-C8', '8', 'Gris', '#5A5A5A', 16, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_2_0', 'prd_uniforme_escolar', 'JLY-UN-001-A10', '10', 'Blanco', '#FFFFFF', 50, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_2_1', 'prd_uniforme_escolar', 'JLY-UN-001-B10', '10', 'Azul marino', '#1B2A4A', 19, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_2_2', 'prd_uniforme_escolar', 'JLY-UN-001-C10', '10', 'Gris', '#5A5A5A', 18, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_3_0', 'prd_uniforme_escolar', 'JLY-UN-001-A12', '12', 'Blanco', '#FFFFFF', 40, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_3_1', 'prd_uniforme_escolar', 'JLY-UN-001-B12', '12', 'Azul marino', '#1B2A4A', 15, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_3_2', 'prd_uniforme_escolar', 'JLY-UN-001-C12', '12', 'Gris', '#5A5A5A', 14, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_4_0', 'prd_uniforme_escolar', 'JLY-UN-001-A14', '14', 'Blanco', '#FFFFFF', 25, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_4_1', 'prd_uniforme_escolar', 'JLY-UN-001-B14', '14', 'Azul marino', '#1B2A4A', 9, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_4_2', 'prd_uniforme_escolar', 'JLY-UN-001-C14', '14', 'Gris', '#5A5A5A', 8, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_5_0', 'prd_uniforme_escolar', 'JLY-UN-001-A16', '16', 'Blanco', '#FFFFFF', 20, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_5_1', 'prd_uniforme_escolar', 'JLY-UN-001-B16', '16', 'Azul marino', '#1B2A4A', 7, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_5_2', 'prd_uniforme_escolar', 'JLY-UN-001-C16', '16', 'Gris', '#5A5A5A', 6, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_6_0', 'prd_uniforme_escolar', 'JLY-UN-001-AS', 'S', 'Blanco', '#FFFFFF', 18, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_6_1', 'prd_uniforme_escolar', 'JLY-UN-001-BS', 'S', 'Azul marino', '#1B2A4A', 6, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_6_2', 'prd_uniforme_escolar', 'JLY-UN-001-CS', 'S', 'Gris', '#5A5A5A', 5, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_7_0', 'prd_uniforme_escolar', 'JLY-UN-001-AM', 'M', 'Blanco', '#FFFFFF', 12, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_7_1', 'prd_uniforme_escolar', 'JLY-UN-001-BM', 'M', 'Azul marino', '#1B2A4A', 4, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_7_2', 'prd_uniforme_escolar', 'JLY-UN-001-CM', 'M', 'Gris', '#5A5A5A', 3, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_8_0', 'prd_uniforme_escolar', 'JLY-UN-001-AL', 'L', 'Blanco', '#FFFFFF', 9, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_8_1', 'prd_uniforme_escolar', 'JLY-UN-001-BL', 'L', 'Azul marino', '#1B2A4A', 3, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_uniforme_escolar_8_2', 'prd_uniforme_escolar', 'JLY-UN-001-CL', 'L', 'Gris', '#5A5A5A', 2, 0, 4, 21.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_0_0', 'prd_polo_corporativo', 'JLY-UN-002-AS', 'S', 'Negro', '#000000', 50, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_0_1', 'prd_polo_corporativo', 'JLY-UN-002-BS', 'S', 'Blanco', '#FFFFFF', 19, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_0_2', 'prd_polo_corporativo', 'JLY-UN-002-CS', 'S', 'Azul corporativo', '#123A6B', 18, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_0_3', 'prd_polo_corporativo', 'JLY-UN-002-DS', 'S', 'Rojo', '#B91C1C', 17, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-02T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_1_0', 'prd_polo_corporativo', 'JLY-UN-002-AM', 'M', 'Negro', '#000000', 60, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_1_1', 'prd_polo_corporativo', 'JLY-UN-002-BM', 'M', 'Blanco', '#FFFFFF', 23, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_1_2', 'prd_polo_corporativo', 'JLY-UN-002-CM', 'M', 'Azul corporativo', '#123A6B', 22, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_1_3', 'prd_polo_corporativo', 'JLY-UN-002-DM', 'M', 'Rojo', '#B91C1C', 21, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-02T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_2_0', 'prd_polo_corporativo', 'JLY-UN-002-AL', 'L', 'Negro', '#000000', 55, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_2_1', 'prd_polo_corporativo', 'JLY-UN-002-BL', 'L', 'Blanco', '#FFFFFF', 21, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_2_2', 'prd_polo_corporativo', 'JLY-UN-002-CL', 'L', 'Azul corporativo', '#123A6B', 20, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_2_3', 'prd_polo_corporativo', 'JLY-UN-002-DL', 'L', 'Rojo', '#B91C1C', 19, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-02T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_3_0', 'prd_polo_corporativo', 'JLY-UN-002-AXL', 'XL', 'Negro', '#000000', 40, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_3_1', 'prd_polo_corporativo', 'JLY-UN-002-BXL', 'XL', 'Blanco', '#FFFFFF', 15, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_3_2', 'prd_polo_corporativo', 'JLY-UN-002-CXL', 'XL', 'Azul corporativo', '#123A6B', 14, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_3_3', 'prd_polo_corporativo', 'JLY-UN-002-DXL', 'XL', 'Rojo', '#B91C1C', 13, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-02T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_4_0', 'prd_polo_corporativo', 'JLY-UN-002-AXXL', 'XXL', 'Negro', '#000000', 25, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_4_1', 'prd_polo_corporativo', 'JLY-UN-002-BXXL', 'XXL', 'Blanco', '#FFFFFF', 9, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_4_2', 'prd_polo_corporativo', 'JLY-UN-002-CXXL', 'XXL', 'Azul corporativo', '#123A6B', 8, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_polo_corporativo_4_3', 'prd_polo_corporativo', 'JLY-UN-002-DXXL', 'XXL', 'Rojo', '#B91C1C', 7, 0, 4, 19, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-02T09:00:00.000Z'::timestamptz),
  ('var_prd_hoodie_ronin_0_0', 'prd_hoodie_ronin', 'JLY-HD-001-AS', 'S', 'Negro', '#000000', 8, 0, 4, 28.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_hoodie_ronin_0_1', 'prd_hoodie_ronin', 'JLY-HD-001-BS', 'S', 'Gris perla', '#C9C9C9', 2, 0, 4, 28.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_hoodie_ronin_1_0', 'prd_hoodie_ronin', 'JLY-HD-001-AM', 'M', 'Negro', '#000000', 12, 0, 4, 28.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_hoodie_ronin_1_1', 'prd_hoodie_ronin', 'JLY-HD-001-BM', 'M', 'Gris perla', '#C9C9C9', 4, 0, 4, 28.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_hoodie_ronin_2_0', 'prd_hoodie_ronin', 'JLY-HD-001-AL', 'L', 'Negro', '#000000', 10, 0, 4, 28.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_hoodie_ronin_2_1', 'prd_hoodie_ronin', 'JLY-HD-001-BL', 'L', 'Gris perla', '#C9C9C9', 3, 0, 4, 28.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_hoodie_ronin_3_0', 'prd_hoodie_ronin', 'JLY-HD-001-AXL', 'XL', 'Negro', '#000000', 6, 0, 4, 28.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_hoodie_ronin_3_1', 'prd_hoodie_ronin', 'JLY-HD-001-BXL', 'XL', 'Gris perla', '#C9C9C9', 1, 0, 4, 28.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_hoodie_ronin_4_0', 'prd_hoodie_ronin', 'JLY-HD-001-AXXL', 'XXL', 'Negro', '#000000', 4, 0, 4, 28.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_hoodie_ronin_4_1', 'prd_hoodie_ronin', 'JLY-HD-001-BXXL', 'XXL', 'Gris perla', '#C9C9C9', 1, 0, 4, 28.5, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_mono_logo_0_0', 'prd_mono_logo', 'JLY-MN-001-AS', 'S', 'Negro', '#000000', 30, 0, 4, 6.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_mono_logo_0_1', 'prd_mono_logo', 'JLY-MN-001-BS', 'S', 'Blanco', '#FFFFFF', 11, 0, 4, 6.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_mono_logo_0_2', 'prd_mono_logo', 'JLY-MN-001-CS', 'S', 'Gris', '#4A4A4A', 10, 0, 4, 6.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_mono_logo_1_0', 'prd_mono_logo', 'JLY-MN-001-AM', 'M', 'Negro', '#000000', 45, 0, 4, 6.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_mono_logo_1_1', 'prd_mono_logo', 'JLY-MN-001-BM', 'M', 'Blanco', '#FFFFFF', 17, 0, 4, 6.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_mono_logo_1_2', 'prd_mono_logo', 'JLY-MN-001-CM', 'M', 'Gris', '#4A4A4A', 16, 0, 4, 6.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_mono_logo_2_0', 'prd_mono_logo', 'JLY-MN-001-AL', 'L', 'Negro', '#000000', 40, 0, 4, 6.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_mono_logo_2_1', 'prd_mono_logo', 'JLY-MN-001-BL', 'L', 'Blanco', '#FFFFFF', 15, 0, 4, 6.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_mono_logo_2_2', 'prd_mono_logo', 'JLY-MN-001-CL', 'L', 'Gris', '#4A4A4A', 14, 0, 4, 6.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_mono_logo_3_0', 'prd_mono_logo', 'JLY-MN-001-AXL', 'XL', 'Negro', '#000000', 22, 0, 4, 6.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_mono_logo_3_1', 'prd_mono_logo', 'JLY-MN-001-BXL', 'XL', 'Blanco', '#FFFFFF', 8, 0, 4, 6.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_mono_logo_3_2', 'prd_mono_logo', 'JLY-MN-001-CXL', 'XL', 'Gris', '#4A4A4A', 7, 0, 4, 6.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_mono_logo_4_0', 'prd_mono_logo', 'JLY-MN-001-AXXL', 'XXL', 'Negro', '#000000', 14, 0, 4, 6.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_mono_logo_4_1', 'prd_mono_logo', 'JLY-MN-001-BXXL', 'XXL', 'Blanco', '#FFFFFF', 5, 0, 4, 6.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_mono_logo_4_2', 'prd_mono_logo', 'JLY-MN-001-CXXL', 'XXL', 'Gris', '#4A4A4A', 4, 0, 4, 6.8, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('var_prd_gorra_kuchisake_0_0', 'prd_gorra_kuchisake', 'JLY-AC-001-AÚnica', 'Única', 'Negro', '#000000', 22, 0, 4, 9.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_gorra_kuchisake_0_1', 'prd_gorra_kuchisake', 'JLY-AC-001-BÚnica', 'Única', 'Blanco', '#FFFFFF', 8, 0, 4, 9.2, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_tote_studio_0_0', 'prd_tote_studio', 'JLY-AC-002-AÚnica', 'Única', 'Crudo', '#EFE7D8', 28, 0, 4, 5.4, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('var_prd_tote_studio_0_1', 'prd_tote_studio', 'JLY-AC-002-BÚnica', 'Única', 'Negro', '#000000', 10, 0, 4, 5.4, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('var_prd_pedido_grupos_0_0', 'prd_pedido_grupos', 'JLY-UN-003-AS', 'S', 'A definir', '#FFFFFF', 0, 0, 4, 7, 0, true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- stock_movements · 8 filas
-- ---------------------------------------------------------------------------
-- Libro de movimientos de producto terminado: entra, sale, reserva y ajuste.
insert into public.stock_movements (id, variant_id, type, quantity, reason, order_id, user_id, note, created_at) values
  ('sm_01', 'var_prd_samurai_zen_1_0', 'out', -2, 'Pedido JLY-260118', 'ord_JLY-260118', null, null, '2025-12-31T09:00:00.000Z'::timestamptz),
  ('sm_02', 'var_prd_neon_shinigami_1_0', 'out', -3, 'Pedido JLY-260118', 'ord_JLY-260118', null, null, '2025-12-31T09:00:00.000Z'::timestamptz),
  ('sm_03', 'var_prd_neon_shinigami_1_0', 'in', 20, 'Producción interna', null, null, 'Lote 02', '2025-12-17T09:00:00.000Z'::timestamptz),
  ('sm_04', 'var_prd_sakura_8bit_1_1', 'out', -2, 'Pedido JLY-260116', 'ord_JLY-260116', null, null, '2025-12-19T09:00:00.000Z'::timestamptz),
  ('sm_05', 'var_prd_dragon_ashes_1_2', 'out', -1, 'Pedido JLY-260114', 'ord_JLY-260114', null, null, '2025-12-23T09:00:00.000Z'::timestamptz),
  ('sm_06', 'var_prd_hoodie_ronin_1_0', 'out', -1, 'Pedido JLY-260110', 'ord_JLY-260110', null, null, '2025-12-03T09:00:00.000Z'::timestamptz),
  ('sm_07', 'var_prd_mono_logo_1_0', 'out', -1, 'Pedido JLY-260112', 'ord_JLY-260112', null, null, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('sm_08', 'var_prd_polo_corporativo_0_0', 'adjust', -2, 'Ajuste de conteo físico', null, null, 'Dos unidades menos de las esperadas', '2025-12-27T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- raw_materials · 14 filas
-- ---------------------------------------------------------------------------
-- Materia prima: tela, tintas, papel de sublimación, film DTF y empaque.
insert into public.raw_materials (id, sku, name, description, category, unit, stock, min_stock, cost_ves, supplier, location, is_active, notes, created_at, updated_at) values
  ('mat_01', 'TEL-FRA-180-N', 'Franela peinada 180 g/m² — Negro', '100% algodón peinado, ancho 1.60 m. Tela base de la mayoría de franelas.', 'tela', 'metro', 142, 60, 4.2, 'Textiles del Norte', 'Estante A-1', true, 'Tolerancia de tono entre lotes: ±8 g/m².', '2025-08-09T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('mat_02', 'TEL-FRA-180-BL', 'Franela peinada 180 g/m² — Blanco', 'Base para estampados de una tinta y para sublimación con papel blanco.', 'tela', 'metro', 88, 60, 4.4, 'Textiles del Norte', 'Estante A-1', true, null, '2025-08-09T09:00:00.000Z'::timestamptz, '2026-01-02T09:00:00.000Z'::timestamptz),
  ('mat_03', 'TEL-JER-220', 'Jersey 220 g/m² — Oversize', 'Punto jersey peinado para modelos holgados de la línea oversize.', 'tela', 'metro', 64, 40, 6.9, 'Textiles del Norte', 'Estante A-2', true, null, '2025-08-19T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('mat_04', 'TEL-MOL-320', 'Molleton cepillado 320 g/m²', 'Interior cepillado para hoodies. Ancho 1.80 m.', 'tela', 'metro', 31, 25, 12.5, 'Moltex', 'Estante A-3', true, 'Stock bajo: llega el viernes.', '2025-08-29T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('mat_05', 'TEL-POLO-210', 'Polo piqué 210 g/m²', 'Mezcla algodón/poliéster para uniformes y polos corporativos.', 'tela', 'metro', 95, 50, 5.6, 'Textiles del Norte', 'Estante B-1', true, null, '2025-09-08T09:00:00.000Z'::timestamptz, '2026-01-01T09:00:00.000Z'::timestamptz),
  ('mat_06', 'TIN-SUB-NEG', 'Tinta de sublimación — Kit 4 tintas', 'Set de tintas Eco de base agua para transfer en polyester. Rendimiento ~200 CBT.', 'tinta', 'paquete', 4, 2, 58, 'PrintPro', 'Químico, repisa 1', true, 'Rendidor. Reponer antes de 3 unidades de stock.', '2025-09-18T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('mat_07', 'FIL-DTF-33', 'Film DTF textil — bobina 33 cm', 'Bobina de film de poliéster 33 cm × 500 m. Base del DTF: se imprime, se espolvorea con blanco y se prensa.', 'consumible', 'rollo', 12, 6, 22, 'PrintPro', 'Estante C-2', true, null, '2025-09-28T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('mat_08', 'PAP-SUB-330', 'Papel sublimación 330 g/m²', 'Rollo de 0.61 m × 100 m. Alto rendimiento para estampados grandes.', 'papel', 'rollo', 2, 1, 41, 'PrintPro', 'Estante C-3', true, 'Crítico para fechas de entrega.', '2025-10-03T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('mat_09', 'HIL-POL-1000', 'Hilo de poli-industrial 1000', 'Cono de 5000 m para unión de costuras y remates de prendas.', 'hilo', 'unidad', 26, 10, 3.4, 'Costuras CA', 'Estante D-1', true, null, '2025-10-08T09:00:00.000Z'::timestamptz, '2025-12-31T09:00:00.000Z'::timestamptz),
  ('mat_10', 'EMP-BOL-50', 'Bolsa kraftautoadherible 32×40', 'Bolsa para pedidos individuales, una por unidad.', 'empaque', 'paquete', 9, 5, 7.8, 'Empaques VZ', 'Bodega', true, null, '2025-10-18T09:00:00.000Z'::timestamptz, '2026-01-02T09:00:00.000Z'::timestamptz),
  ('mat_11', 'MAQ-PRN-A3', 'Prensa térmica 40×60', 'Prensa de platina para transfer. Estado: funcional, requiere mantenimiento anual.', 'maquina', 'unidad', 1, 1, 0, null, 'Taller', true, 'Mantenimiento realizado en noviembre.', '2025-03-12T09:00:00.000Z'::timestamptz, '2025-12-07T09:00:00.000Z'::timestamptz),
  ('mat_12', 'PEL-TEF-33', 'Cinta de teflón para prensa', 'Rollo protector de la platina al prensar DTF y sublimación. Se cambia cuando ennegrece.', 'consumible', 'rollo', 3, 3, 9.5, 'PrintPro', 'Estante D-2', true, 'Reponer esta semana.', '2025-10-28T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('mat_13', 'TEL-ECO-HOOD', 'Molleton 3moji gris perla', 'Color pedido especialmente para el stock de hoodie.', 'tela', 'metro', 18, 15, 12.9, 'Moltex', 'Estante A-3', true, null, '2025-11-07T09:00:00.000Z'::timestamptz, '2026-01-01T09:00:00.000Z'::timestamptz),
  ('mat_14', 'TIN-DTF-SET', 'Tintas DTF — kit de 5 tintas', 'Blanco de tapado más CMYK de base agua. Van sobre el film DTF antes de espolvorear.', 'tinta', 'paquete', 2, 3, 68, 'PrintPro', 'Químico, repisa 2', true, 'Bajo el mínimo.', '2025-11-07T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- material_movements · 7 filas
-- ---------------------------------------------------------------------------
-- Libro de movimientos de materia prima.
insert into public.material_movements (id, material_id, type, quantity, reason, order_id, user_id, note, created_at) values
  ('mm_01', 'mat_01', 'out', 45, 'Producción pedido JLY-260104', null, null, 'Franelas Samurai Zen y Sakura', '2025-12-31T09:00:00.000Z'::timestamptz),
  ('mm_02', 'mat_06', 'out', 1, 'Uso en producción', null, null, null, '2025-12-28T09:00:00.000Z'::timestamptz),
  ('mm_03', 'mat_12', 'in', 2, 'Compra a proveedor', null, null, 'Factura 8821', '2025-12-23T09:00:00.000Z'::timestamptz),
  ('mm_04', 'mat_04', 'adjust', 2, 'Conteo físico', null, null, 'Merma por corte', '2025-12-26T09:00:00.000Z'::timestamptz),
  ('mm_05', 'mat_09', 'out', 3, 'Uso en producción', null, null, null, '2026-01-02T09:00:00.000Z'::timestamptz),
  ('mm_06', 'mat_02', 'in', 60, 'Compra a proveedor', null, null, 'Factura 8790', '2025-12-17T09:00:00.000Z'::timestamptz),
  ('mm_07', 'mat_08', 'waste', 1, 'Papel usado en producción', null, null, 'Quedó un cuarto de rollo, se descartó', '2025-12-21T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- customers · 7 filas
-- ---------------------------------------------------------------------------
-- Fichas de cliente con su historial de pedidos en el panel.
insert into public.customers (id, full_name, email, phone, whatsapp, document_id, city, state, address, tags, marketing_opt_in, notes, created_at, updated_at) values
  ('cus_01', 'Daniela R.', 'dani.r@example.com', '0412-5550134', '04125550134', 'V-28456123', 'Caracas', 'Distrito Capital', 'Av. Libertador, Los Palos Grandes, casa 12', array['universitaria', 'anime', 'vip'], true, 'Pide para eventos de su facultad. Siempre pregunta por tiempos de entrega.', '2025-09-08T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz),
  ('cus_02', 'Colegio Bilingüe Los Robles', 'compras@losrobles.edu.ve', '0212-5550199', '04145550199', 'J-40122345', 'Caracas', 'Distrito Capital', 'Urb. Los Robles, Av. Principal, Edo. Miranda', array['institucion', 'uniformes', 'facturacion'], true, 'Contrato anual de uniformes. Facturación a nombre de la institución. Pedido cada semestre.', '2025-06-20T09:00:00.000Z'::timestamptz, '2025-12-30T09:00:00.000Z'::timestamptz),
  ('cus_03', 'Mateo S.', 'mateo.s@example.com', '0424-5550177', '04245550177', 'V-31098765', 'Maracay', 'Aragua', 'C/ 5 entre Av. Universidad y Las Delicias', array['videojuegos'], true, null, '2025-10-23T09:00:00.000Z'::timestamptz, '2025-12-17T09:00:00.000Z'::timestamptz),
  ('cus_04', 'Grupo StudyVerse', 'studyverse.ueb@example.com', '0416-5550122', '04165550122', 'J-41200555', 'Valencia', 'Carabobo', 'Av. Bolívar, Torre 3, piso 4', array['grupo', 'estudiantes', 'wholesale'], true, 'Coordinan 3 eventos al año. Pagan 50% al pedido y 50% contra entrega.', '2025-10-08T09:00:00.000Z'::timestamptz, '2025-12-27T09:00:00.000Z'::timestamptz),
  ('cus_05', 'Valentina P.', 'vale.p@example.com', '0414-5550190', '04145550190', 'V-29773412', 'Barquisimeto', 'Lara', 'C/ 40 con Av. Lara', array['fantasia'], false, null, '2025-11-27T09:00:00.000Z'::timestamptz, '2025-11-27T09:00:00.000Z'::timestamptz),
  ('cus_06', 'Andrés M.', 'andres.m@example.com', '0412-5550165', '04125550165', 'V-30112233', 'Valencia', 'Carabobo', 'Urb. La Sabina, casa 45', array['a-medida'], true, 'Mandó arte propio para una colección de 4 piezas.', '2025-11-12T09:00:00.000Z'::timestamptz, '2025-12-25T09:00:00.000Z'::timestamptz),
  ('cus_07', 'Carla M.', 'carla.m@example.com', '0412-5550110', '04125550110', 'V-31559900', 'Caracas', 'Distrito Capital', 'Chuao, calle 3, casa 8', array['minimal'], true, 'Le gusta todo negro. Sugerir lanzamientos.', '2025-12-07T09:00:00.000Z'::timestamptz, '2025-12-22T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- crm_activities · 6 filas
-- ---------------------------------------------------------------------------
-- Notas, llamadas y tareas de seguimiento por cliente.
insert into public.crm_activities (id, customer_id, user_id, kind, title, body, due_at, is_done, created_at) values
  ('crm_01', 'cus_01', null, 'whatsapp', 'Confirmó Tamanños del pedido de Anime Legends', 'Envió la lista de tallas para 8 personas del evento. Pedido mínimo 10 unidades.', null, true, '2026-01-02T09:00:00.000Z'::timestamptz),
  ('crm_02', 'cus_01', null, 'task', 'Llamar para revisar advances del encargo', 'Revisar si ya entregó las referencias para el segundo diseño.', '2026-01-08T09:00:00.000Z'::timestamptz, false, '2026-01-01T09:00:00.000Z'::timestamptz),
  ('crm_03', 'cus_02', null, 'meeting', 'Reunión de contrato semestral', 'Confirmar tallas del nuevo semestre y plazo de entrega.', '2026-01-13T09:00:00.000Z'::timestamptz, false, '2025-12-29T09:00:00.000Z'::timestamptz),
  ('crm_04', 'cus_04', null, 'note', 'Prefieren el color azul marino', 'Para el uniforme del evento siempre piden azul marino con escudo blanco.', null, true, '2025-12-26T09:00:00.000Z'::timestamptz),
  ('crm_05', 'cus_06', null, 'call', 'Presupuesto arte propio', 'Mandó 4 diseños originales, le cotizamos 18 Bs la unidad.', '2026-01-07T09:00:00.000Z'::timestamptz, false, '2025-12-25T09:00:00.000Z'::timestamptz),
  ('crm_06', 'cus_07', null, 'note', 'Suspende el newsletter por 3 meses', 'Se enfada con los correos; prefiere que la avisemos solo por Instagram.', null, true, '2025-12-19T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- leads · 5 filas
-- ---------------------------------------------------------------------------
-- Contactos que preguntaron pero todavía no compraron.
insert into public.leads (id, name, email, phone, message, source, status, notes, created_at) values
  ('lead_01', 'Joselyn Caro', 'joselyn.caro@example.com', '0412-5550118', 'Vi la página por Instagram. ¿Hacen franelas para un evento de graduación de mi hermana? Somos 25 personas.', 'Instagram', 'quoted', 'Cotizado 22 Bs c/u, mínimo 20. Esperando confirmación.', '2026-01-03T09:00:00.000Z'::timestamptz),
  ('lead_02', 'Universidad Central de Venezuela — FAV', 'deportes.fav@ucv.ve', '0212-5550100', 'Somos la directiva de deportes de la facultad. Queremos shirts para el torneo interno (60 unidades) con el escudo institucional.', 'Formulario web', 'new', null, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('lead_03', 'Iván Pimentel', 'ivan.p@example.com', '0424-5550144', 'Quiero una franela con el logo de mi estudio de tatuajes, solo 3 unidades.', 'WhatsApp', 'contacted', 'Pendiente de que envíe el vector.', '2025-12-31T09:00:00.000Z'::timestamptz),
  ('lead_04', 'Mafe Salas', 'mafe.s@example.com', '0412-5550177', '¿Tienen algo de Jujutsu Kaisen? Vi que no me apareció en el catálogo.', 'Instagram', 'won', 'Compró Neon Shinigami y pidió notificarle el próximo drop.', '2025-12-15T09:00:00.000Z'::timestamptz),
  ('lead_05', 'Complejo Deportivo La Copa', 'admin@lacopa.com.ve', '0212-5550130', 'Necesitamos 15 uniformes para el equipo de voleibol, con el logo al frente.', 'Formulario web', 'lost', 'Se fue con un proveedor más barato.', '2025-11-22T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- orders · 9 filas
-- ---------------------------------------------------------------------------
-- Pedidos. `total_eur` y `bcv_rate` quedan congelados al confirmar, como la factura.
insert into public.orders (id, order_number, customer_id, customer_name, customer_email, customer_phone, kind, status, payment_method, payment_status, payment_ref, online_payment_id, items_subtotal_ves, discount_ves, shipping_ves, total_ves, total_eur, bcv_rate, coupon_code, shipping_address, notes, internal_notes, created_at, updated_at, paid_at, shipped_at, delivered_at) values
  ('ord_JLY-260118', 'JLY-260118', 'cus_01', 'Daniela R.', 'dani.r@example.com', '0412-5550134', 'product', 'in_production', 'pago_movil', 'paid', 'PM-884120', null, 135, 0, 0, 135, 3.7, 36.5, null, '{"address":"Dirección de prueba","city":"Caracas","state":"Distrito Capital"}'::jsonb, null, null, '2025-12-31T09:00:00.000Z'::timestamptz, '2025-12-31T09:00:00.000Z'::timestamptz, '2025-12-31T09:00:00.000Z'::timestamptz, null, null),
  ('ord_JLY-260117', 'JLY-260117', 'cus_02', 'Colegio Bilingüe Los Robles', 'compras@losrobles.edu.ve', '0212-5550199', 'wholesale', 'ready', 'transferencia', 'paid', null, null, 2330, 60, 0, 2270, 62.19, 36.5, null, '{"address":"Dirección de prueba","city":"Caracas","state":"Distrito Capital"}'::jsonb, 'Entregar en la portería de la academia. Coordinar con secretaria.', null, '2025-12-28T09:00:00.000Z'::timestamptz, '2025-12-28T09:00:00.000Z'::timestamptz, '2025-12-28T09:00:00.000Z'::timestamptz, null, null),
  ('ord_JLY-260116', 'JLY-260116', 'cus_03', 'Mateo S.', 'mateo.s@example.com', '0424-5550177', 'product', 'delivered', 'zelle', 'paid', 'ZL-3391', null, 42, 0, 0, 42, 1.15, 36.5, null, '{"address":"Dirección de prueba","city":"Caracas","state":"Distrito Capital"}'::jsonb, null, null, '2025-12-19T09:00:00.000Z'::timestamptz, '2025-12-19T09:00:00.000Z'::timestamptz, '2025-12-19T09:00:00.000Z'::timestamptz, '2025-12-22T09:00:00.000Z'::timestamptz, '2025-12-20T09:00:00.000Z'::timestamptz),
  ('ord_JLY-260115', 'JLY-260115', 'cus_04', 'Grupo StudyVerse', 'studyverse.ueb@example.com', '0416-5550122', 'wholesale', 'pending_payment', 'pago_movil', 'pending', null, null, 450, 0, 0, 450, 12.33, 36.5, null, '{"address":"Dirección de prueba","city":"Caracas","state":"Distrito Capital"}'::jsonb, '50% adelantado por transferencia. Esperando el segundo pago.', null, '2026-01-04T09:00:00.000Z'::timestamptz, '2026-01-04T09:00:00.000Z'::timestamptz, null, null, null),
  ('ord_JLY-260114', 'JLY-260114', 'cus_05', 'Valentina P.', 'vale.p@example.com', '0414-5550190', 'custom', 'paid', 'binance', 'paid', null, null, 32, 0, 0, 32, 0.88, 36.5, null, '{"address":"Dirección de prueba","city":"Caracas","state":"Distrito Capital"}'::jsonb, 'Diseño propio: dragona de la colección Neo Mythos.', null, '2025-12-23T09:00:00.000Z'::timestamptz, '2025-12-23T09:00:00.000Z'::timestamptz, '2025-12-23T09:00:00.000Z'::timestamptz, null, null),
  ('ord_JLY-260113', 'JLY-260113', 'cus_06', 'Andrés M.', 'andres.m@example.com', '0412-5550165', 'custom', 'in_production', 'zelle', 'paid', 'ZL-3402', null, 54, 0, 0, 54, 1.48, 36.5, null, '{"address":"Dirección de prueba","city":"Caracas","state":"Distrito Capital"}'::jsonb, null, null, '2025-12-30T09:00:00.000Z'::timestamptz, '2025-12-30T09:00:00.000Z'::timestamptz, '2025-12-30T09:00:00.000Z'::timestamptz, null, null),
  ('ord_JLY-260112', 'JLY-260112', 'cus_07', 'Carla M.', 'carla.m@example.com', '0412-5550110', 'product', 'shipped', 'tarjeta', 'paid', 'pi_3PxDemo', 'pi_3PxDemo', 41, 0, 0, 41, 1.12, 36.5, null, '{"address":"Dirección de prueba","city":"Caracas","state":"Distrito Capital"}'::jsonb, null, null, '2026-01-03T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz, '2026-01-03T09:00:00.000Z'::timestamptz, '2026-01-06T09:00:00.000Z'::timestamptz, null),
  ('ord_JLY-260111', 'JLY-260111', null, 'Cliente mostrador', null, null, 'product', 'cancelled', 'efectivo', 'pending', null, null, 16, 0, 5, 21, 0.58, 36.5, null, '{"address":"Dirección de prueba","city":"Caracas","state":"Distrito Capital"}'::jsonb, 'Se cayó: no recogió en 48 h.', null, '2025-12-25T09:00:00.000Z'::timestamptz, '2025-12-25T09:00:00.000Z'::timestamptz, null, null, null),
  ('ord_JLY-260110', 'JLY-260110', 'cus_01', 'Daniela R.', 'dani.r@example.com', '0412-5550134', 'product', 'delivered', 'pago_movil', 'paid', 'PM-881905', null, 65, 0, 0, 65, 1.78, 36.5, null, '{"address":"Dirección de prueba","city":"Caracas","state":"Distrito Capital"}'::jsonb, null, null, '2025-12-03T09:00:00.000Z'::timestamptz, '2025-12-03T09:00:00.000Z'::timestamptz, '2025-12-03T09:00:00.000Z'::timestamptz, '2025-12-06T09:00:00.000Z'::timestamptz, '2025-12-04T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- order_items · 12 filas
-- ---------------------------------------------------------------------------
-- Líneas del pedido, con nombre y precio ya resueltos.
insert into public.order_items (id, order_id, product_id, variant_id, name, sku, variant_label, unit_price_ves, quantity, discount_ves, subtotal_ves, options, custom_design_id) values
  ('oi_ord_JLY-260118_0', 'ord_JLY-260118', 'prd_samurai_zen', 'var_prd_samurai_zen_1_0', 'Samurai Zen', 'JLY-FR-001', 'M / Negro', 24, 2, 0, 48, null, null),
  ('oi_ord_JLY-260118_1', 'ord_JLY-260118', 'prd_neon_shinigami', 'var_prd_neon_shinigami_1_0', 'Neon Shinigami', 'JLY-FR-002', 'L / Negro', 29, 3, 0, 87, null, null),
  ('oi_ord_JLY-260117_0', 'ord_JLY-260117', 'prd_uniforme_escolar', 'var_prd_uniforme_escolar_3_0', 'Uniforme Escolar Juan Pablo', 'JLY-UN-001', '8 / Blanco', 44, 40, 0, 1760, null, null),
  ('oi_ord_JLY-260117_1', 'ord_JLY-260117', 'prd_polo_corporativo', 'var_prd_polo_corporativo_1_0', 'Polo Corporativo Liso', 'JLY-UN-002', 'M / Negro', 38, 15, 0, 570, null, null),
  ('oi_ord_JLY-260116_0', 'ord_JLY-260116', 'prd_sakura_8bit', 'var_prd_sakura_8bit_1_1', 'Sakura 8-Bit', 'JLY-FR-004', 'M / Blanco', 21, 2, 0, 42, null, null),
  ('oi_ord_JLY-260115_0', 'ord_JLY-260115', 'prd_pedido_grupos', null, 'Pack Grupos y Eventos', 'JLY-UN-003', 'A definir', 18, 25, 0, 450, '{"nota":"Tamaño se confirma luego"}'::jsonb, null),
  ('oi_ord_JLY-260114_0', 'ord_JLY-260114', 'prd_dragon_ashes', 'var_prd_dragon_ashes_1_2', 'Dragon Ashes', 'JLY-FR-003', 'M / Negro', 32, 1, 0, 32, null, null),
  ('oi_ord_JLY-260113_0', 'ord_JLY-260113', 'prd_mago_rpg', 'var_prd_mago_rpg_1_0', 'Mago RPG', 'JLY-FR-005', 'L / Negro', 27, 2, 0, 54, null, null),
  ('oi_ord_JLY-260112_0', 'ord_JLY-260112', 'prd_mono_logo', 'var_prd_mono_logo_1_0', 'Mono Logo', 'JLY-MN-001', 'M / Negro', 19, 1, 0, 19, null, null),
  ('oi_ord_JLY-260112_1', 'ord_JLY-260112', 'prd_gorra_kuchisake', 'var_prd_gorra_kuchisake_0_0', 'Gorra Kuchisake', 'JLY-AC-001', 'M / Negro', 22, 1, 0, 22, null, null),
  ('oi_ord_JLY-260111_0', 'ord_JLY-260111', 'prd_tote_studio', 'var_prd_tote_studio_0_0', 'Tote Studio', 'JLY-AC-002', 'M / Crudo', 16, 1, 0, 16, null, null),
  ('oi_ord_JLY-260110_0', 'ord_JLY-260110', 'prd_hoodie_ronin', 'var_prd_hoodie_ronin_1_0', 'Hoodie Ronin', 'JLY-HD-001', 'M / Negro', 65, 1, 0, 65, null, null)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- custom_designs · 5 filas
-- ---------------------------------------------------------------------------
-- Solicitudes de diseño a medida. `reference_urls` apunta al bucket privado `design-references`.
insert into public.custom_designs (id, code, customer_id, order_id, name, description, reference_urls, sizes, colors, quantity, garment_type, style_preference, deadline, status, quoted_price_ves, admin_notes, contact_name, contact_email, contact_phone, created_at, updated_at) values
  ('des_01', 'JLY-D-001', 'cus_06', 'ord_JLY-260113', 'Set de mago con runas propias', 'Tengo 4 ilustraciones originales de un mago con runas. Quiero 2 franelas negras con el diseño al centro, silk de una tela blanca muy lisa. Las referencias están subidas.', array['/demo/references/mage-1.svg', '/demo/references/mage-2.svg'], array['M'], array['Negro'], 2, 'franela', 'DTF textil, un color', '2026-01-16T09:00:00.000Z'::timestamptz, 'production', 58, 'Andrés aportó los PNG en alta resolución. Silk listo, cotizó 29 Bs c/u.', 'Andrés M.', 'andres.m@example.com', '0412-5550165', '2025-12-21T09:00:00.000Z'::timestamptz, '2025-12-30T09:00:00.000Z'::timestamptz),
  ('des_02', 'JLY-D-002', null, null, 'Camiseta con un hechizo antiguo', 'Solo quiero que parezca un hechizo antiguo, algo de rosa de los vientos. No tengo foto, lo describo con palabras.', array[], array['L'], array['Blanco'], 1, 'franela', null, null, 'quoting', null, 'Pendiente de cotizar: el arte es a una tinta, va en DTF textil.', 'Julián Zambrano', 'julian.z@example.com', '0414-5550166', '2026-01-03T09:00:00.000Z'::timestamptz, '2026-01-05T09:00:00.000Z'::timestamptz),
  ('des_03', 'JLY-D-003', 'cus_01', null, '8 franelas para evento de facultad', 'Somos 8 del grupo de teatro. Queremos algo con el nombre del grupo y un ícono. Adjunté una foto de referencia.', array['/demo/references/grupo-1.svg'], array['S', 'M', 'L'], array['Negro'], 8, 'franela', 'Sublimación', '2026-01-20T09:00:00.000Z'::timestamptz, 'approved', 20, 'Aprobado por Daniela. Falta confirmar tallas por persona.', 'Daniela R.', 'dani.r@example.com', '0412-5550134', '2025-12-28T09:00:00.000Z'::timestamptz, '2026-01-01T09:00:00.000Z'::timestamptz),
  ('des_04', 'JLY-D-004', 'cus_04', null, 'Uniformes del StudyVerse', 'Pedido del grupo para el evento. 25 unidades, azul marino, escudo al pecho y el nombre del grupo en la manga.', array['/demo/references/uniforme-escudo.svg'], array['S', 'M', 'L', 'XL'], array['Azul marino'], 25, 'polo', 'DTF textil', '2026-01-11T09:00:00.000Z'::timestamptz, 'in_design', 26, 'Vector recibido. Va en DTF: se separa el escudo del nombre de la manga.', 'Grupo StudyVerse', 'studyverse.ueb@example.com', '0416-5550122', '2025-12-17T09:00:00.000Z'::timestamptz, '2025-12-27T09:00:00.000Z'::timestamptz),
  ('des_05', 'JLY-D-005', null, null, null, null, array[], array[], array[], 1, null, null, null, 'new', null, null, 'Visitante sin descripción', null, null, '2026-01-06T09:00:00.000Z'::timestamptz, '2026-01-06T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- reviews · 4 filas
-- ---------------------------------------------------------------------------
-- Reseñas de producto; solo se muestran las aprobadas.
insert into public.reviews (id, product_id, customer_id, order_id, author_name, rating, title, body, is_approved, created_at) values
  ('rev_01', 'prd_samurai_zen', 'cus_01', 'ord_JLY-260110', 'Daniela R.', 5, 'La calidad es otra cosa', 'El estampado es nítido de verdad, no se cuartea. Huele a buena tela. Ya pedí dos iguales para mi hermana.', true, '2025-12-17T09:00:00.000Z'::timestamptz),
  ('rev_02', 'prd_sakura_8bit', 'cus_03', 'ord_JLY-260116', 'Mateo S.', 5, 'Pixel art bien hecha', 'Me gusta el detalle de la grilla. Llegó en 3 días a Maracay.', true, '2025-12-21T09:00:00.000Z'::timestamptz),
  ('rev_03', 'prd_mono_logo', 'cus_07', 'ord_JLY-260112', 'Carla M.', 4, 'Cómoda y bonita', 'Me quedé con una talla menos, pero la tela es muy suave. El estampado del logo se ve prolijo.', true, '2026-01-04T09:00:00.000Z'::timestamptz),
  ('rev_04', 'prd_hoodie_ronin', null, null, 'Visitante', 5, 'Abrigada de verdad', 'El molleton es denso, no es de los delgados.', false, '2026-01-05T09:00:00.000Z'::timestamptz)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- activity_log · 3 filas
-- ---------------------------------------------------------------------------
-- Auditoría de lo que se hizo desde el panel.
insert into public.activity_log (id, user_id, user_email, action, entity, entity_id, summary, meta, created_at) values
  ('log_01', null, 'admin@jaylu.ve', 'create', 'order', 'ord_JLY-260118', 'Pedido JLY-260118 creado desde la web', null, '2025-12-31T09:00:00.000Z'::timestamptz),
  ('log_02', null, 'admin@jaylu.ve', 'update', 'promotion', 'promo_invierno', 'Extensión de promo Invierno 26 al 30 días', null, '2026-01-02T09:00:00.000Z'::timestamptz),
  ('log_03', null, 'admin@jaylu.ve', 'adjust', 'raw_material', 'mat_04', 'Ajuste de molleton por merma de corte (-2 m)', null, '2025-12-26T09:00:00.000Z'::timestamptz)
on conflict do nothing;

commit;

-- ---------------------------------------------------------------------------
--  Verificación
-- ---------------------------------------------------------------------------
--
--  Estas consultas deberían devolver 12 productos, 8 colecciones, 9 pedidos y
--  128 variantes. Si no, algo no se cargó: revisa el mensaje del editor SQL.
--
--   select count(*) from public.products;
--   select count(*) from public.collections;
--   select count(*) from public.orders;
--   select count(*) from public.variants;
--
--  Para arrancar de cero en una instalación de prueba:
--
--   truncate table public.activity_log, public.reviews, public.order_items,
--     public.orders, public.custom_designs, public.material_movements,
--     public.stock_movements, public.leads, public.crm_activities,
--     public.customers, public.raw_materials, public.variants, public.coupons,
--     public.promotions, public.product_spin360, public.product_images,
--     public.product_collections, public.products, public.collections,
--     public.categories
--   restart identity cascade;
