/**
 * Datos de demostración. Se cargan automáticamente en el backend local la
 * primera vez que se arranca la app, y sirven también como base del catálogo
 * inicial al migrar a Supabase (ver supabase/seed.sql).
 */

import type {
  Category,
  Collection,
  Coupon,
  CustomDesign,
  CrmActivity,
  Customer,
  Lead,
  MaterialMovement,
  Order,
  OrderItem,
  Product,
  ProductImage,
  ProductSpin360,
  Promotion,
  RawMaterial,
  Review,
  StockMovement,
  StoreSettings,
  Variant,
} from "@/lib/types";
import type { PrintTechnique } from "@/lib/types";

const DAY = 86_400_000;
const base = new Date("2026-01-06T09:00:00.000Z").getTime();
const iso = (daysAgo: number) => new Date(base - daysAgo * DAY).toISOString();

const spin = (slug: string, frames = 36): ProductSpin360 => ({
  product_id: `prd_${slug.replace(/-/g, "_")}`,
  frames: Array.from({ length: frames }, (_, i) => `/demo/spin/${slug}/${String(i).padStart(2, "0")}.svg`),
  frame_count: frames,
  poster_url: `/demo/spin/${slug}/00.svg`,
  updated_at: iso(3),
});

/* ------------------------------------------------------------------ */

const categories: Category[] = [
  { id: "cat_franelas", slug: "franelas", name: "Franelas", description: "El corazón de JayLu. Algodón, estampado de alta definición.", hero_url: "/demo/categories/franelas.svg", sort_order: 1, is_active: true, created_at: iso(200) },
  { id: "cat_remeras", slug: "remeras", name: "Remeras", description: "Modelos manga larga, oversize y baseball.", hero_url: "/demo/categories/remeras.svg", sort_order: 2, is_active: true, created_at: iso(200) },
  { id: "cat_hoodies", slug: "hoodies", name: "Hoodies y suéteres", description: "Abrigado para climas frescos, estampado en pecho y espalda.", hero_url: "/demo/categories/hoodies.svg", sort_order: 3, is_active: true, created_at: iso(180) },
  { id: "cat_uniformes", slug: "uniformes", name: "Uniformes", description: "Uniformes escolares y corporativos por pedido, con sublimación o DTF textil.", hero_url: "/demo/categories/uniformes.svg", sort_order: 4, is_active: true, created_at: iso(150) },
  { id: "cat_accesorios", slug: "accesorios", name: "Accesorios", description: "Gorras, tote bags y stickers.", hero_url: "/demo/categories/accesorios.svg", sort_order: 5, is_active: true, created_at: iso(120) },
  { id: "cat_medida", slug: "a-medida", name: "Diseño a medida", description: "Tu idea, nuestra mano. Sin mínimo de unidades.", hero_url: "/demo/categories/a-medida.svg", sort_order: 6, is_active: true, created_at: iso(90) },
];

const collections: Collection[] = [
  {
    id: "col_anime", slug: "anime-legends", name: "Anime Legends",
    tagline: "Los personajes que marcaron generaciones",
    description: "Franelas con estampado de alta definición de los personajes y escenarios que definieron tu infancia. Tela peinada, tinta eco y un lavado que no se destiñe.",
    theme: "anime", banner_url: "/demo/collections/anime-legends.svg", status: "published",
    starts_at: null, ends_at: null, sort_order: 1,
    seo_title: null, seo_description: null, created_at: iso(120), updated_at: iso(4),
  },
  {
    id: "col_mythos", slug: "neo-mythos", name: "Neo Mythos",
    tagline: "Mitología, dragones y magia oscura",
    description: "Diseños inspirados en la fantasía épica: dragones, runas y Dual grip. Arte original para quienes quieren algo que no exista en ninguna otra parte.",
    theme: "fantasia", banner_url: "/demo/collections/neo-mythos.svg", status: "published",
    starts_at: null, ends_at: null, sort_order: 2,
    seo_title: null, seo_description: null, created_at: iso(110), updated_at: iso(2),
  },
  {
    id: "col_pixel", slug: "pixel-arena", name: "Pixel Arena",
    tagline: "Retro 8 y 16 bits, nuevo precio",
    description: "Pixel art reescalada, escudos, barras de vida y hechizos. Si viviste con una consola de 8 bits, esta colección es para ti.",
    theme: "videojuegos", banner_url: "/demo/collections/pixel-arena.svg", status: "published",
    starts_at: null, ends_at: null, sort_order: 3,
    seo_title: null, seo_description: null, created_at: iso(100), updated_at: iso(1),
  },
  {
    id: "col_mono", slug: "mono-essential", name: "Mono Essential",
    tagline: "Negro, blanco, cero ruido",
    description: "La base de tu gaveta. Franelas lisas, heavyweight, con un logo estampado mínimo. Combina con todo.",
    theme: "minimal", banner_url: "/demo/collections/mono-essential.svg", status: "published",
    starts_at: null, ends_at: null, sort_order: 4,
    seo_title: null, seo_description: null, created_at: iso(90), updated_at: iso(6),
  },
  {
    id: "col_uni", slug: "uniformes-escolares", name: "Uniformes Escolares",
    tagline: "Instituciones, grupos y eventos",
    description: "Uniformes completos para cohesión total: camisa, short, suéter y delantal. Tu logo y el de tu institución, estampados con sublimación o DTF textil. Pedidos desde 10 unidades.",
    theme: "uniformes", banner_url: "/demo/collections/uniformes-escolares.svg", status: "published",
    starts_at: null, ends_at: null, sort_order: 5,
    seo_title: null, seo_description: null, created_at: iso(85), updated_at: iso(3),
  },
  {
    id: "col_invierno", slug: "drop-invierno-26", name: "Drop Invierno 26",
    tagline: "Edición limitada, solo por semanas",
    description: "La colección de temporada: hoodies heavyweight y ropa de frío. Edición corta: cuando se agote el stock, no se repone.",
    theme: "temporada", banner_url: "/demo/collections/drop-invierno-26.svg", status: "published",
    starts_at: null, ends_at: null, sort_order: 0,
    seo_title: "Drop Invierno 26 — JayLu", seo_description: "Edición limitada de franelas JayLu. Precios solo durante el drop.",
    created_at: iso(30), updated_at: iso(1),
  },
  {
    id: "col_uni26", slug: "uniformes-2026", name: "Uniformes Corporativos 2026",
    tagline: "Estampado DTF en polos y chamarras — en preparación",
    description: "Línea corporativa: polos, chamarras y batas con tu logo en DTF textil, que entra en la fibra y resiste el lavado industrial. Próximamente.",
    theme: "uniformes", banner_url: null, status: "draft",
    starts_at: null, ends_at: null, sort_order: 6,
    seo_title: null, seo_description: null, created_at: iso(20), updated_at: iso(20),
  },
  {
    id: "col_colab", slug: "colab-mtz", name: "Colab: Módulos MTZ",
    tagline: "Edición conjunta con el colectivo",
    description: "Diseños hechos con el colectivo Módulos: DTF textil sobre franela cruda, con los trazos del dibujo a mano tal cual.",
    theme: "colaboracion", banner_url: "/demo/collections/colab-mtz.svg", status: "published",
    starts_at: null, ends_at: null, sort_order: 7,
    seo_title: null, seo_description: null, created_at: iso(45), updated_at: iso(9),
  },
];

type ProductSeed = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  subtitle: string;
  description: string;
  category: string;
  base: number;
  compare?: number;
  cost: number;
  collections: string[];
  colors: { name: string; hex: string }[];
  sizes: string[];
  featured?: boolean;
  customOnly?: boolean;
  stock: [number, number][];
  art: string;
  tags: string[];
  bulk?: { min_qty: number; unit_price_ves: number }[];
  minOrder?: number;
  /** Valor canónico de PRINT_TECHNIQUES, no el texto de la etiqueta. */
  technique?: PrintTechnique;
  material?: string;
  weight?: number;
};

const productSeeds: ProductSeed[] = [
  {
    id: "prd_samurai_zen", slug: "samurai-zen", sku: "JLY-FR-001",
    name: "Samurai Zen", subtitle: "Franela · Estampado frontal y trasero",
    description: "El samurái sentado bajo un luna llena que usamos como ícono de la marca. Sublimación a todo color sobre franela peinada de 180 g/m². No se agrieta ni se cuartea, aunque la laves cien veces.",
    category: "cat_franelas", base: 24, cost: 7.8,
    collections: ["col_mythos", "col_invierno"], art: "samurai",
    colors: [{ name: "Negro", hex: "#000000" }, { name: "Blanco", hex: "#FFFFFF" }, { name: "Arena", hex: "#D8CFC0" }],
    sizes: ["S", "M", "L", "XL"],
    technique: "sublimacion",
    featured: true, stock: [[14, 22], [26, 31], [19, 18], [8, 9]],
    tags: ["anime", "fantasia", "geisha", "samurai"],
  },
  {
    id: "prd_neon_shinigami", slug: "neon-shinigami", sku: "JLY-FR-002",
    name: "Neon Shinigami", subtitle: "Franela oversize",
    description: "Espada energética en degradado neón, impresa con sublimación de alta temperatura: el color entra en la fibra, no flota encima. Sube 4 °C de lavado y sigue igual.",
    category: "cat_franelas", base: 29, cost: 9.4,
    collections: ["col_anime", "col_invierno"], art: "neon",
    colors: [{ name: "Negro", hex: "#000000" }, { name: "Verde ácido", hex: "#9EF01A" }],
    sizes: ["M", "L", "XL"],
    technique: "sublimacion",
    featured: true, stock: [[0, 11], [12, 14], [5, 6]],
    tags: ["anime", "bleach", "neon", "oversize"],
  },
  {
    id: "prd_dragon_ashes", slug: "dragon-ashes", sku: "JLY-FR-003",
    name: "Dragon Ashes", subtitle: "Franela heavyweight",
    description: "240 g/m², corte boxy y unstructured. DTF textil con base blanca y detail line negro para que el dragón destaque sobre cualquier color de fondo.",
    category: "cat_franelas", base: 32, cost: 11.2,
    collections: ["col_mythos"], art: "dragon",
    colors: [{ name: "Negro", hex: "#000000" }, { name: "Gris jaspeado", hex: "#4A4A4A" }, { name: "Sangre", hex: "#8A1111" }],
    sizes: ["S", "M", "L", "XL", "XXL"],
    featured: true, stock: [[7, 12], [16, 20], [12, 15], [4, 5], [2, 3]],
    tags: ["fantasia", "dragon", "heavyweight"],
  },
  {
    id: "prd_sakura_8bit", slug: "sakura-8bit", sku: "JLY-FR-004",
    name: "Sakura 8-Bit", subtitle: "Franela · pixel art",
    description: "Flores de cerezo pixeladas, como un sprite NES que quedó atrapado en un jardín. DTF textil de un solo color: barato para la tienda, nervioso para el cliente.",
    category: "cat_franelas", base: 21, cost: 6.1,
    collections: ["col_anime", "col_pixel"], art: "sakura",
    colors: [{ name: "Blanco", hex: "#FFFFFF" }, { name: "Rosa", hex: "#F2C6D0" }, { name: "Negro", hex: "#000000" }],
    sizes: ["S", "M", "L", "XL"],
    stock: [[9, 16], [22, 27], [18, 22], [6, 8]],
    tags: ["anime", "pixel", "videojuegos", "sakura"],
  },
  {
    id: "prd_mago_rpg", slug: "mago-rpg", sku: "JLY-FR-005",
    name: "Mago RPG", subtitle: "Franela · panel frontal completo",
    description: "Ranura de estadísticas, barra de maná y hechizo en release. Inspirado en los wizards de los 90, ejecutado con cinco tintas y DTF textil. Para los fans con demasiado tiempo libre.",
    category: "cat_franelas", base: 27, cost: 8.9,
    collections: ["col_pixel", "col_mythos"], art: "wizard",
    colors: [{ name: "Negro", hex: "#000000" }, { name: "Azul tinta", hex: "#14213D" }],
    sizes: ["M", "L", "XL"],
    stock: [[3, 9], [11, 13], [7, 8]],
    tags: ["rpg", "videojuegos", "fantasia", "wizard"],
  },
  {
    id: "prd_uniforme_escolar", slug: "uniforme-escolar-jb", sku: "JLY-UN-001",
    name: "Uniforme Escolar Juan Pablo", subtitle: "Conjunto · escudo en DTF textil",
    description: "Conjunto completo de primaria: camisa manga corta con el escudo en DTF textil, short, suéter de piqué y delantal. Tela resistente para uso diario escolar, con el estampado integrado en la fibra (no se agrieta ni se despega al lavar). Precio por grupo desde 10 unidades.",
    category: "cat_uniformes", base: 48, cost: 21.5,
    collections: ["col_uni"], art: "uniform",
    colors: [{ name: "Blanco", hex: "#FFFFFF" }, { name: "Azul marino", hex: "#1B2A4A" }, { name: "Gris", hex: "#5A5A5A" }],
    sizes: ["6", "8", "10", "12", "14", "16", "S", "M", "L"],
    minOrder: 10, technique: "dtf-textil", material: "Polo 65% algodón / 35% poliéster",
    bulk: [{ min_qty: 10, unit_price_ves: 44 }, { min_qty: 30, unit_price_ves: 39 }, { min_qty: 60, unit_price_ves: 35 }],
    stock: [[0, 40], [30, 45], [20, 50], [14, 40], [8, 25], [0, 20], [6, 18], [4, 12], [0, 9]],
    tags: ["uniformes", "escolar", "dtf", "instituciones"],
  },
  {
    id: "prd_polo_corporativo", slug: "polo-corporativo-liso", sku: "JLY-UN-002",
    name: "Polo Corporativo Liso", subtitle: "Polo · logo del cliente en DTF textil",
    description: "Polo piqué 210 g/m² con puño y refuerzo en hombros. Estampamos tu logo a todo color en pecho, manga o espalda. Se cotiza por taller, no por unidad.",
    category: "cat_uniformes", base: 42, cost: 19,
    collections: ["col_uni"], art: "polo",
    colors: [{ name: "Negro", hex: "#000000" }, { name: "Blanco", hex: "#FFFFFF" }, { name: "Azul corporativo", hex: "#123A6B" }, { name: "Rojo", hex: "#B91C1C" }],
    sizes: ["S", "M", "L", "XL", "XXL"],
    minOrder: 15, technique: "dtf-textil", material: "Piqué Algodón/Poliéster",
    bulk: [{ min_qty: 15, unit_price_ves: 38 }, { min_qty: 40, unit_price_ves: 33 }, { min_qty: 100, unit_price_ves: 28 }],
    stock: [[22, 50], [35, 60], [30, 55], [18, 40], [10, 25]],
    tags: ["uniformes", "corporativo", "empresas", "eventos"],
  },
  {
    id: "prd_hoodie_ronin", slug: "hoodie-ronin", sku: "JLY-HD-001",
    name: "Hoodie Ronin", subtitle: "Hoodie 320 g/m² · capucha forrada",
    description: "Molleton interior cepillado, capucha doble capa, puños y ribete en canalé. Sublimación en la espalda: el color entra en la fibra y sobrevive a la máquina de lavar industrial.",
    category: "cat_hoodies", base: 65, cost: 28.5,
    collections: ["col_mythos", "col_invierno"], art: "hoodie",
    colors: [{ name: "Negro", hex: "#000000" }, { name: "Gris perla", hex: "#C9C9C9" }],
    sizes: ["S", "M", "L", "XL", "XXL"],
    technique: "sublimacion",
    featured: true, stock: [[4, 8], [9, 12], [7, 10], [3, 6], [1, 4]],
    weight: 320, tags: ["fantasia", "molleton", "invierno"],
  },
  {
    id: "prd_mono_logo", slug: "mono-logo", sku: "JLY-MN-001",
    name: "Mono Logo", subtitle: "Franela heavyweight · logo estampado",
    description: "La franela que no falla. 200 g/m², costuras reforzadas, logo en DTF textil de 2,5 cm al pecho. Es la que te pones cuando no quieres pensar qué ponerte.",
    category: "cat_franelas", base: 19, compare: 24, cost: 6.8,
    collections: ["col_mono"], art: "mono",
    colors: [{ name: "Negro", hex: "#000000" }, { name: "Blanco", hex: "#FFFFFF" }, { name: "Gris", hex: "#4A4A4A" }],
    sizes: ["S", "M", "L", "XL", "XXL"],
    stock: [[25, 30], [40, 45], [33, 40], [18, 22], [11, 14]],
    tags: ["basico", "minimal", "dtf"],
  },
  {
    id: "prd_gorra_kuchisake", slug: "gorra-kuchisake", sku: "JLY-AC-001",
    name: "Gorra Kuchisake", subtitle: "Gorra trucker · frente en DTF textil",
    description: "Visera curva, frente estampado a todo color, malla trasera transpirable. Ajuste con broche metálico.",
    category: "cat_accesorios", base: 22, cost: 9.2,
    collections: ["col_mythos"], art: "cap",
    colors: [{ name: "Negro", hex: "#000000" }, { name: "Blanco", hex: "#FFFFFF" }],
    sizes: ["Única"],
    stock: [[17, 22]],
    tags: ["accesorios", "fantasia"],
  },
  {
    id: "prd_tote_studio", slug: "tote-studio", sku: "JLY-AC-002",
    name: "Tote Studio", subtitle: "Tote de algodón crudo",
    description: "Bolso de lona 12 oz con fuelle interior, asas reforzadas y bolsillo con cierre. Capacidad para una laptop de 15\".",
    category: "cat_accesorios", base: 16, cost: 5.4,
    collections: ["col_mono", "col_colab"], art: "tote",
    colors: [{ name: "Crudo", hex: "#EFE7D8" }, { name: "Negro", hex: "#000000" }],
    sizes: ["Única"],
    stock: [[30, 28]],
    tags: ["accesorios", "tote"],
  },
  {
    id: "prd_pedido_grupos", slug: "pack-grupos-eventos", sku: "JLY-UN-003",
    name: "Pack Grupos y Eventos", subtitle: "Personalización total desde 10 unidades",
    description: "Para grupos de estudio, equipos y eventos. Elige prenda, técnica de impresión y cantidad; nosotros gestionamos el arte. Puedes mandar una foto de referencia y te cotizamos sin compromiso.",
    category: "cat_medida", base: 20, cost: 7,
    collections: ["col_uni"], art: "custom",
    colors: [{ name: "A definir", hex: "#FFFFFF" }],
    sizes: ["S", "M", "L", "XL", "XXL"],
    customOnly: true, minOrder: 10, stock: [[0, 0]],
    tags: ["a-medida", "grupos", "eventos", "estudiantes"],
  },
];

const products: Product[] = productSeeds.map((p, i) => ({
  id: p.id, slug: p.slug, sku: p.sku, name: p.name, subtitle: p.subtitle, description: p.description,
  category_id: p.category, base_price_ves: p.base, compare_at_ves: p.compare ?? null, cost_ves: p.cost,
  garment_type: p.category === "cat_uniformes" ? (p.slug.includes("polo") ? "polo" : "uniforme") : p.category === "cat_hoodies" ? "hoodie" : p.category === "cat_accesorios" ? (p.slug.includes("gorra") ? "gorra" : "tote") : "franela",
  material: p.material ?? "Algodón peinado 180 g/m²", print_technique: p.technique ?? "dtf-textil",
  fit: p.category === "cat_franelas" ? "Regular" : "Ajuste school",
  care_instructions: "Lavar a máquina con agua fría del revés. No usar suavizante. Secar al aire. No plancha sobre el estampado.",
  sizes: p.sizes, colors: p.colors, is_active: true, is_featured: p.featured ?? false,
  is_custom_only: p.customOnly ?? false, min_order_qty: p.minOrder ?? 1, bulk_prices: p.bulk ?? [],
  lead_time_days: p.customOnly ? 10 : p.category === "cat_uniformes" ? 12 : 4,
  weight_grams: p.weight ?? (p.category === "cat_hoodies" ? 320 : p.category === "cat_uniformes" ? 210 : 180),
  tags: p.tags, seo_title: null, seo_description: null, created_at: iso(90 - i * 5), updated_at: iso(i + 1),
}));

const product_collections = productSeeds.flatMap((p) =>
  p.collections.map((c, i) => ({ product_id: p.id, collection_id: c, sort_order: i })),
);

const product_images: ProductImage[] = productSeeds.flatMap((p) => {
  const imgs: ProductImage[] = [0, 1, 2].map((n) => ({
    id: `img_${p.id}_${n}`, product_id: p.id, url: `/demo/products/${p.slug}-${n + 1}.svg`,
    alt: `${p.name} — vista ${n + 1}`, kind: "main" as const, sort_order: n,
  }));
  return imgs;
});

const variants: Variant[] = productSeeds.flatMap((p) => {
  const out: Variant[] = [];
  p.stock.forEach(([, stock], i) => {
    const size = p.sizes[i] ?? "Única";
    p.colors.forEach((c, ci) => {
      // El primer color concentra el inventario; los demás tienen menos.
      const quantity = ci === 0 ? stock : Math.max(0, Math.round(stock * 0.4) - ci);
      out.push({
        id: `var_${p.id}_${i}_${ci}`, product_id: p.id,
        sku: `${p.sku}-${String.fromCharCode(65 + ci)}${size}`.replace(/\s/g, ""),
        size, color: c.name, color_hex: c.hex, stock: quantity,
        reserved_stock: 0, min_stock: 4, cost_ves: p.cost,
        price_delta_ves: 0, is_active: true, barcode: null,
        created_at: iso(80), updated_at: iso(ci + 1),
      });
    });
  });
  return out;
});

const product_spin360 = productSeeds
  .filter((p) => !p.customOnly)
  .map((p) => spin(p.slug));

/* ------------------------------------------------------------------ */

const raw_materials: RawMaterial[] = [
  { id: "mat_01", sku: "TEL-FRA-180-N", name: "Franela peinada 180 g/m² — Negro", description: "100% algodón peinado, ancho 1.60 m. Tela base de la mayoría de franelas.", category: "tela", unit: "metro", stock: 142, min_stock: 60, cost_ves: 4.2, supplier: "Textiles del Norte", location: "Estante A-1", is_active: true, notes: "Tolerancia de tono entre lotes: ±8 g/m².", created_at: iso(150), updated_at: iso(2) },
  { id: "mat_02", sku: "TEL-FRA-180-BL", name: "Franela peinada 180 g/m² — Blanco", description: "Base para estampados de una tinta y para sublimación con papel blanco.", category: "tela", unit: "metro", stock: 88, min_stock: 60, cost_ves: 4.4, supplier: "Textiles del Norte", location: "Estante A-1", is_active: true, notes: null, created_at: iso(150), updated_at: iso(4) },
  { id: "mat_03", sku: "TEL-JER-220", name: "Jersey 220 g/m² — Oversize", description: "Punto jersey peinado para modelos holgados de la línea oversize.", category: "tela", unit: "metro", stock: 64, min_stock: 40, cost_ves: 6.9, supplier: "Textiles del Norte", location: "Estante A-2", is_active: true, notes: null, created_at: iso(140), updated_at: iso(1) },
  { id: "mat_04", sku: "TEL-MOL-320", name: "Molleton cepillado 320 g/m²", description: "Interior cepillado para hoodies. Ancho 1.80 m.", category: "tela", unit: "metro", stock: 31, min_stock: 25, cost_ves: 12.5, supplier: "Moltex", location: "Estante A-3", is_active: true, notes: "Stock bajo: llega el viernes.", created_at: iso(130), updated_at: iso(1) },
  { id: "mat_05", sku: "TEL-POLO-210", name: "Polo piqué 210 g/m²", description: "Mezcla algodón/poliéster para uniformes y polos corporativos.", category: "tela", unit: "metro", stock: 95, min_stock: 50, cost_ves: 5.6, supplier: "Textiles del Norte", location: "Estante B-1", is_active: true, notes: null, created_at: iso(120), updated_at: iso(5) },
  { id: "mat_06", sku: "TIN-SUB-NEG", name: "Tinta de sublimación — Kit 4 tintas", description: "Set de tintas Eco de base agua para transfer en polyester. Rendimiento ~200 CBT.", category: "tinta", unit: "paquete", stock: 4, min_stock: 2, cost_ves: 58, supplier: "PrintPro", location: "Químico, repisa 1", is_active: true, notes: "Rendidor. Reponer antes de 3 unidades de stock.", created_at: iso(110), updated_at: iso(2) },
  { id: "mat_07", sku: "FIL-DTF-33", name: "Film DTF textil — bobina 33 cm", description: "Bobina de film de poliéster 33 cm × 500 m. Base del DTF: se imprime, se espolvorea con blanco y se prensa.", category: "consumible", unit: "rollo", stock: 12, min_stock: 6, cost_ves: 22, supplier: "PrintPro", location: "Estante C-2", is_active: true, notes: null, created_at: iso(100), updated_at: iso(3) },
  { id: "mat_08", sku: "PAP-SUB-330", name: "Papel sublimación 330 g/m²", description: "Rollo de 0.61 m × 100 m. Alto rendimiento para estampados grandes.", category: "papel", unit: "rollo", stock: 2, min_stock: 1, cost_ves: 41, supplier: "PrintPro", location: "Estante C-3", is_active: true, notes: "Crítico para fechas de entrega.", created_at: iso(95), updated_at: iso(1) },
  { id: "mat_09", sku: "HIL-POL-1000", name: "Hilo de poli-industrial 1000", description: "Cono de 5000 m para unión de costuras y remates de prendas.", category: "hilo", unit: "unidad", stock: 26, min_stock: 10, cost_ves: 3.4, supplier: "Costuras CA", location: "Estante D-1", is_active: true, notes: null, created_at: iso(90), updated_at: iso(6) },
  { id: "mat_10", sku: "EMP-BOL-50", name: "Bolsa kraftautoadherible 32×40", description: "Bolsa para pedidos individuales, una por unidad.", category: "empaque", unit: "paquete", stock: 9, min_stock: 5, cost_ves: 7.8, supplier: "Empaques VZ", location: "Bodega", is_active: true, notes: null, created_at: iso(80), updated_at: iso(4) },
  { id: "mat_11", sku: "MAQ-PRN-A3", name: "Prensa térmica 40×60", description: "Prensa de platina para transfer. Estado: funcional, requiere mantenimiento anual.", category: "maquina", unit: "unidad", stock: 1, min_stock: 1, cost_ves: 0, supplier: null, location: "Taller", is_active: true, notes: "Mantenimiento realizado en noviembre.", created_at: iso(300), updated_at: iso(30) },
  { id: "mat_12", sku: "PEL-TEF-33", name: "Cinta de teflón para prensa", description: "Rollo protector de la platina al prensar DTF y sublimación. Se cambia cuando ennegrece.", category: "consumible", unit: "rollo", stock: 3, min_stock: 3, cost_ves: 9.5, supplier: "PrintPro", location: "Estante D-2", is_active: true, notes: "Reponer esta semana.", created_at: iso(70), updated_at: iso(2) },
  { id: "mat_13", sku: "TEL-ECO-HOOD", name: "Molleton 3moji gris perla", description: "Color pedido especialmente para el stock de hoodie.", category: "tela", unit: "metro", stock: 18, min_stock: 15, cost_ves: 12.9, supplier: "Moltex", location: "Estante A-3", is_active: true, notes: null, created_at: iso(60), updated_at: iso(5) },
  { id: "mat_14", sku: "TIN-DTF-SET", name: "Tintas DTF — kit de 5 tintas", description: "Blanco de tapado más CMYK de base agua. Van sobre el film DTF antes de espolvorear.", category: "tinta", unit: "paquete", stock: 2, min_stock: 3, cost_ves: 68, supplier: "PrintPro", location: "Químico, repisa 2", is_active: true, notes: "Bajo el mínimo.", created_at: iso(60), updated_at: iso(1) },
];

const material_movements: MaterialMovement[] = [
  { id: "mm_01", material_id: "mat_01", type: "out", quantity: 45, reason: "Producción pedido JLY-260104", order_id: null, user_id: null, note: "Franelas Samurai Zen y Sakura", created_at: iso(6) },
  { id: "mm_02", material_id: "mat_06", type: "out", quantity: 1, reason: "Uso en producción", order_id: null, user_id: null, note: null, created_at: iso(9) },
  { id: "mm_03", material_id: "mat_12", type: "in", quantity: 2, reason: "Compra a proveedor", order_id: null, user_id: null, note: "Factura 8821", created_at: iso(14) },
  { id: "mm_04", material_id: "mat_04", type: "adjust", quantity: 2, reason: "Conteo físico", order_id: null, user_id: null, note: "Merma por corte", created_at: iso(11) },
  { id: "mm_05", material_id: "mat_09", type: "out", quantity: 3, reason: "Uso en producción", order_id: null, user_id: null, note: null, created_at: iso(4) },
  { id: "mm_06", material_id: "mat_02", type: "in", quantity: 60, reason: "Compra a proveedor", order_id: null, user_id: null, note: "Factura 8790", created_at: iso(20) },
  { id: "mm_07", material_id: "mat_08", type: "waste", quantity: 1, reason: "Papel usado en producción", order_id: null, user_id: null, note: "Quedó un cuarto de rollo, se descartó", created_at: iso(16) },
];

const promotions: Promotion[] = [
  { id: "promo_invierno", name: "Invierno 26 — 20% en toda la colección", scope: "collection", product_id: null, collection_id: "col_invierno", kind: "percent", value: 20, starts_at: null, ends_at: iso(-30), is_active: true, priority: 10, created_at: iso(30) },
  { id: "promo_mono", name: "Mono a precio de introduction", scope: "collection", product_id: null, collection_id: "col_mono", kind: "fixed", value: 3, starts_at: null, ends_at: null, is_active: true, priority: 5, created_at: iso(80) },
  { id: "promo_neon", name: "2x1 en Neon Shinigami (precio fijo)", scope: "product", product_id: "prd_neon_shinigami", collection_id: null, kind: "fixed", value: 3, starts_at: null, ends_at: null, is_active: true, priority: 1, created_at: iso(25) },
  { id: "promo_anime", name: "Anime Legends — 10%", scope: "collection", product_id: null, collection_id: "col_anime", kind: "percent", value: 10, starts_at: null, ends_at: null, is_active: true, priority: 5, created_at: iso(60) },
  { id: "promo_vencido", name: "Aniversario (finalizado)", scope: "collection", product_id: null, collection_id: "col_pixel", kind: "percent", value: 15, starts_at: null, ends_at: iso(20), is_active: true, priority: 1, created_at: iso(120) },
  { id: "promo_uni", name: "Uniformes 2026 — 12%", scope: "collection", product_id: null, collection_id: "col_uni", kind: "percent", value: 12, starts_at: null, ends_at: iso(-60), is_active: true, priority: 3, created_at: iso(50) },
];

const coupons: Coupon[] = [
  { id: "coup_bienvenida", code: "BIENVENIDA10", kind: "percent", value: 10, min_subtotal_ves: 0, max_uses: null, used_count: 23, starts_at: null, ends_at: null, is_active: true, description: "10% para la primera compra (tope 5 Bs)", created_at: iso(120) },
  { id: "coup_estudiantes", code: "ESTUDIANTES", kind: "percent", value: 15, min_subtotal_ves: 40, max_uses: 200, used_count: 61, starts_at: null, ends_at: null, is_active: true, description: "15% para compras de grupos y estudiantes", created_at: iso(90) },
  { id: "coup_envio", code: "ENVIOGRATIS", kind: "fixed", value: 0, min_subtotal_ves: 30, max_uses: null, used_count: 12, starts_at: null, ends_at: null, is_active: true, description: "Envío gratis en compras desde 30 Bs", created_at: iso(70) },
  { id: "coup_viejo", code: "NAVIDAD25", kind: "percent", value: 25, min_subtotal_ves: 0, max_uses: null, used_count: 88, starts_at: null, ends_at: iso(15), is_active: false, description: "Campaña de diciembre (cerrada)", created_at: iso(200) },
];

/* ------------------------------------------------------------------ */

const customers: Customer[] = [
  { id: "cus_01", full_name: "Daniela R.", email: "dani.r@example.com", phone: "0412-5550134", whatsapp: "04125550134", document_id: "V-28456123", city: "Caracas", state: "Distrito Capital", address: "Av. Libertador, Los Palos Grandes, casa 12", tags: ["universitaria", "anime", "vip"], marketing_opt_in: true, notes: "Pide para eventos de su facultad. Siempre pregunta por tiempos de entrega.", created_at: iso(120), updated_at: iso(3) },
  { id: "cus_02", full_name: "Colegio Bilingüe Los Robles", email: "compras@losrobles.edu.ve", phone: "0212-5550199", whatsapp: "04145550199", document_id: "J-40122345", city: "Caracas", state: "Distrito Capital", address: "Urb. Los Robles, Av. Principal, Edo. Miranda", tags: ["institucion", "uniformes", "facturacion"], marketing_opt_in: true, notes: "Contrato anual de uniformes. Facturación a nombre de la institución. Pedido cada semestre.", created_at: iso(200), updated_at: iso(7) },
  { id: "cus_03", full_name: "Mateo S.", email: "mateo.s@example.com", phone: "0424-5550177", whatsapp: "04245550177", document_id: "V-31098765", city: "Maracay", state: "Aragua", address: "C/ 5 entre Av. Universidad y Las Delicias", tags: ["videojuegos"], marketing_opt_in: true, notes: null, created_at: iso(75), updated_at: iso(20) },
  { id: "cus_04", full_name: "Grupo StudyVerse", email: "studyverse.ueb@example.com", phone: "0416-5550122", whatsapp: "04165550122", document_id: "J-41200555", city: "Valencia", state: "Carabobo", address: "Av. Bolívar, Torre 3, piso 4", tags: ["grupo", "estudiantes", "wholesale"], marketing_opt_in: true, notes: "Coordinan 3 eventos al año. Pagan 50% al pedido y 50% contra entrega.", created_at: iso(90), updated_at: iso(10) },
  { id: "cus_05", full_name: "Valentina P.", email: "vale.p@example.com", phone: "0414-5550190", whatsapp: "04145550190", document_id: "V-29773412", city: "Barquisimeto", state: "Lara", address: "C/ 40 con Av. Lara", tags: ["fantasia"], marketing_opt_in: false, notes: null, created_at: iso(40), updated_at: iso(40) },
  { id: "cus_06", full_name: "Andrés M.", email: "andres.m@example.com", phone: "0412-5550165", whatsapp: "04125550165", document_id: "V-30112233", city: "Valencia", state: "Carabobo", address: "Urb. La Sabina, casa 45", tags: ["a-medida"], marketing_opt_in: true, notes: "Mandó arte propio para una colección de 4 piezas.", created_at: iso(55), updated_at: iso(12) },
  { id: "cus_07", full_name: "Carla M.", email: "carla.m@example.com", phone: "0412-5550110", whatsapp: "04125550110", document_id: "V-31559900", city: "Caracas", state: "Distrito Capital", address: "Chuao, calle 3, casa 8", tags: ["minimal"], marketing_opt_in: true, notes: "Le gusta todo negro. Sugerir lanzamientos.", created_at: iso(30), updated_at: iso(15) },
];

const crm_activities: CrmActivity[] = [
  { id: "crm_01", customer_id: "cus_01", user_id: null, kind: "whatsapp", title: "Confirmó Tamanños del pedido de Anime Legends", body: "Envió la lista de tallas para 8 personas del evento. Pedido mínimo 10 unidades.", due_at: null, is_done: true, created_at: iso(4) },
  { id: "crm_02", customer_id: "cus_01", user_id: null, kind: "task", title: "Llamar para revisar advances del encargo", body: "Revisar si ya entregó las referencias para el segundo diseño.", due_at: iso(-2), is_done: false, created_at: iso(5) },
  { id: "crm_03", customer_id: "cus_02", user_id: null, kind: "meeting", title: "Reunión de contrato semestral", body: "Confirmar tallas del nuevo semestre y plazo de entrega.", due_at: iso(-7), is_done: false, created_at: iso(8) },
  { id: "crm_04", customer_id: "cus_04", user_id: null, kind: "note", title: "Prefieren el color azul marino", body: "Para el uniforme del evento siempre piden azul marino con escudo blanco.", due_at: null, is_done: true, created_at: iso(11) },
  { id: "crm_05", customer_id: "cus_06", user_id: null, kind: "call", title: "Presupuesto arte propio", body: "Mandó 4 diseños originales, le cotizamos 18 Bs la unidad.", due_at: iso(-1), is_done: false, created_at: iso(12) },
  { id: "crm_06", customer_id: "cus_07", user_id: null, kind: "note", title: "Suspende el newsletter por 3 meses", body: "Se enfada con los correos; prefiere que la avisemos solo por Instagram.", due_at: null, is_done: true, created_at: iso(18) },
];

const leads: Lead[] = [
  { id: "lead_01", name: "Joselyn Caro", email: "joselyn.caro@example.com", phone: "0412-5550118", message: "Vi la página por Instagram. ¿Hacen franelas para un evento de graduación de mi hermana? Somos 25 personas.", source: "Instagram", status: "quoted", notes: "Cotizado 22 Bs c/u, mínimo 20. Esperando confirmación.", created_at: iso(3) },
  { id: "lead_02", name: "Universidad Central de Venezuela — FAV", email: "deportes.fav@ucv.ve", phone: "0212-5550100", message: "Somos la directiva de deportes de la facultad. Queremos shirts para el torneo interno (60 unidades) con el escudo institucional.", source: "Formulario web", status: "new", notes: null, created_at: iso(1) },
  { id: "lead_03", name: "Iván Pimentel", email: "ivan.p@example.com", phone: "0424-5550144", message: "Quiero una franela con el logo de mi estudio de tatuajes, solo 3 unidades.", source: "WhatsApp", status: "contacted", notes: "Pendiente de que envíe el vector.", created_at: iso(6) },
  { id: "lead_04", name: "Mafe Salas", email: "mafe.s@example.com", phone: "0412-5550177", message: "¿Tienen algo de Jujutsu Kaisen? Vi que no me apareció en el catálogo.", source: "Instagram", status: "won", notes: "Compró Neon Shinigami y pidió notificarle el próximo drop.", created_at: iso(22) },
  { id: "lead_05", name: "Complejo Deportivo La Copa", email: "admin@lacopa.com.ve", phone: "0212-5550130", message: "Necesitamos 15 uniformes para el equipo de voleibol, con el logo al frente.", source: "Formulario web", status: "lost", notes: "Se fue con un proveedor más barato.", created_at: iso(45) },
];

/* ------------------------------------------------------------------ */

const B = 36.5; // tasa BCV usada en los datos de ejemplo

const orderSeeds: Array<{
  n: string; cus: string | null; name: string; email: string | null; phone: string | null;
  kind: Order["kind"]; status: Order["status"]; pay: Order["payment_status"];
  method: Order["payment_method"]; items: [string, string | null, number, number][];
  daysAgo: number; discount?: number; shipping?: number; notes?: string; ref?: string;
}> = [
  { n: "JLY-260118", cus: "cus_01", name: "Daniela R.", email: "dani.r@example.com", phone: "0412-5550134", kind: "product", status: "in_production", pay: "paid", method: "pago_movil", items: [["prd_samurai_zen", "var_prd_samurai_zen_1_0", 2, 24], ["prd_neon_shinigami", "var_prd_neon_shinigami_1_0", 3, 29]], daysAgo: 6, ref: "PM-884120" },
  { n: "JLY-260117", cus: "cus_02", name: "Colegio Bilingüe Los Robles", email: "compras@losrobles.edu.ve", phone: "0212-5550199", kind: "wholesale", status: "ready", pay: "paid", method: "transferencia", items: [["prd_uniforme_escolar", "var_prd_uniforme_escolar_3_0", 40, 44], ["prd_polo_corporativo", "var_prd_polo_corporativo_1_0", 15, 38]], daysAgo: 9, discount: 60, notes: "Entregar en la portería de la academia. Coordinar con secretaria." },
  { n: "JLY-260116", cus: "cus_03", name: "Mateo S.", email: "mateo.s@example.com", phone: "0424-5550177", kind: "product", status: "delivered", pay: "paid", method: "zelle", items: [["prd_sakura_8bit", "var_prd_sakura_8bit_1_1", 2, 21]], daysAgo: 18, ref: "ZL-3391" },
  { n: "JLY-260115", cus: "cus_04", name: "Grupo StudyVerse", email: "studyverse.ueb@example.com", phone: "0416-5550122", kind: "wholesale", status: "pending_payment", pay: "pending", method: "pago_movil", items: [["prd_pedido_grupos", null, 25, 18]], daysAgo: 2, notes: "50% adelantado por transferencia. Esperando el segundo pago." },
  { n: "JLY-260114", cus: "cus_05", name: "Valentina P.", email: "vale.p@example.com", phone: "0414-5550190", kind: "custom", status: "paid", pay: "paid", method: "binance", items: [["prd_dragon_ashes", "var_prd_dragon_ashes_1_2", 1, 32]], daysAgo: 14, notes: "Diseño propio: dragona de la colección Neo Mythos." },
  { n: "JLY-260113", cus: "cus_06", name: "Andrés M.", email: "andres.m@example.com", phone: "0412-5550165", kind: "custom", status: "in_production", pay: "paid", method: "zelle", items: [["prd_mago_rpg", "var_prd_mago_rpg_1_0", 2, 27]], daysAgo: 7, ref: "ZL-3402" },
  { n: "JLY-260112", cus: "cus_07", name: "Carla M.", email: "carla.m@example.com", phone: "0412-5550110", kind: "product", status: "shipped", pay: "paid", method: "tarjeta", items: [["prd_mono_logo", "var_prd_mono_logo_1_0", 1, 19], ["prd_gorra_kuchisake", "var_prd_gorra_kuchisake_0_0", 1, 22]], daysAgo: 3, shipping: 0, ref: "pi_3PxDemo" },
  { n: "JLY-260111", cus: null, name: "Cliente mostrador", email: null, phone: null, kind: "product", status: "cancelled", pay: "pending", method: "efectivo", items: [["prd_tote_studio", "var_prd_tote_studio_0_0", 1, 16]], daysAgo: 12, notes: "Se cayó: no recogió en 48 h." },
  { n: "JLY-260110", cus: "cus_01", name: "Daniela R.", email: "dani.r@example.com", phone: "0412-5550134", kind: "product", status: "delivered", pay: "paid", method: "pago_movil", items: [["prd_hoodie_ronin", "var_prd_hoodie_ronin_1_0", 1, 65]], daysAgo: 34, ref: "PM-881905" },
];

const orders: Order[] = orderSeeds.map((o) => {
  const subtotal = o.items.reduce((acc, [, , qty, price]) => acc + qty * price, 0);
  const discount = o.discount ?? 0;
  const shipping = o.shipping ?? (subtotal - discount >= 30 ? 0 : 5);
  const total = subtotal - discount + shipping;
  const createdAt = iso(o.daysAgo);
  return {
    id: `ord_${o.n}`, order_number: o.n, customer_id: o.cus, customer_name: o.name,
    customer_email: o.email, customer_phone: o.phone, kind: o.kind, status: o.status,
    payment_method: o.method, payment_status: o.pay, payment_ref: o.ref ?? null,
    online_payment_id: o.method === "tarjeta" ? (o.ref ?? null) : null,
    items_subtotal_ves: subtotal, discount_ves: discount, shipping_ves: shipping,
    total_ves: total, total_eur: Math.round((total / B) * 100) / 100, bcv_rate: B,
    coupon_code: null,
    shipping_address: { address: "Dirección de prueba", city: "Caracas", state: "Distrito Capital" },
    notes: o.notes ?? null, internal_notes: null,
    created_at: createdAt, updated_at: createdAt,
    paid_at: o.pay === "paid" ? createdAt : null,
    shipped_at: o.status === "shipped" || o.status === "delivered" ? iso(Math.max(0, o.daysAgo - 3)) : null,
    delivered_at: o.status === "delivered" ? iso(Math.max(0, o.daysAgo - 1)) : null,
  };
});

const order_items: OrderItem[] = orders.flatMap((order, oi) => {
  const seed = orderSeeds[oi];
  return seed.items.map(([product_id, variant_id, quantity, price], i) => {
    const p = productSeeds.find((x) => x.id === product_id);
    return {
      id: `oi_${order.id}_${i}`, order_id: order.id, product_id, variant_id,
      name: p?.name ?? "Diseño a medida", sku: p?.sku ?? null,
      variant_label: variant_id ? (p?.colors.length ? `${p.sizes[1] ?? "M"} / ${p.colors[0].name}` : "Única") : "A definir",
      unit_price_ves: price, quantity, discount_ves: 0, subtotal_ves: price * quantity,
      options: product_id === "prd_pedido_grupos" ? { nota: "Tamaño se confirma luego" } : null,
      custom_design_id: null,
    };
  });
});

const stock_movements: StockMovement[] = [
  { id: "sm_01", variant_id: "var_prd_samurai_zen_1_0", type: "out", quantity: -2, reason: "Pedido JLY-260118", order_id: "ord_JLY-260118", user_id: null, note: null, created_at: iso(6) },
  { id: "sm_02", variant_id: "var_prd_neon_shinigami_1_0", type: "out", quantity: -3, reason: "Pedido JLY-260118", order_id: "ord_JLY-260118", user_id: null, note: null, created_at: iso(6) },
  { id: "sm_03", variant_id: "var_prd_neon_shinigami_1_0", type: "in", quantity: 20, reason: "Producción interna", order_id: null, user_id: null, note: "Lote 02", created_at: iso(20) },
  { id: "sm_04", variant_id: "var_prd_sakura_8bit_1_1", type: "out", quantity: -2, reason: "Pedido JLY-260116", order_id: "ord_JLY-260116", user_id: null, note: null, created_at: iso(18) },
  { id: "sm_05", variant_id: "var_prd_dragon_ashes_1_2", type: "out", quantity: -1, reason: "Pedido JLY-260114", order_id: "ord_JLY-260114", user_id: null, note: null, created_at: iso(14) },
  { id: "sm_06", variant_id: "var_prd_hoodie_ronin_1_0", type: "out", quantity: -1, reason: "Pedido JLY-260110", order_id: "ord_JLY-260110", user_id: null, note: null, created_at: iso(34) },
  { id: "sm_07", variant_id: "var_prd_mono_logo_1_0", type: "out", quantity: -1, reason: "Pedido JLY-260112", order_id: "ord_JLY-260112", user_id: null, note: null, created_at: iso(3) },
  { id: "sm_08", variant_id: "var_prd_pedido_grupos_0_0", type: "adjust", quantity: 0, reason: "Ajuste de conteo físico", order_id: null, user_id: null, note: null, created_at: iso(10) },
];

const custom_designs: CustomDesign[] = [
  {
    id: "des_01", code: "JLY-D-001", customer_id: "cus_06", order_id: "ord_JLY-260113",
    name: "Set de mago con runas propias", description: "Tengo 4 ilustraciones originales de un mago con runas. Quiero 2 franelas negras con el diseño al centro, silk de una tela blanca muy lisa. Las referencias están subidas.",
    reference_urls: ["/demo/references/mage-1.svg", "/demo/references/mage-2.svg"],
    sizes: ["M"], colors: ["Negro"], quantity: 2, garment_type: "franela",
    style_preference: "DTF textil, un color", deadline: iso(-10), status: "production",
    quoted_price_ves: 58, admin_notes: "Andrés aportó los PNG en alta resolución. Silk listo, cotizó 29 Bs c/u.",
    contact_name: "Andrés M.", contact_email: "andres.m@example.com", contact_phone: "0412-5550165",
    created_at: iso(16), updated_at: iso(7),
  },
  {
    id: "des_02", code: "JLY-D-002", customer_id: null, order_id: null,
    name: "Camiseta con un hechizo antiguo", description: "Solo quiero que parezca un hechizo antiguo, algo de rosa de los vientos. No tengo foto, lo describo con palabras.",
    reference_urls: [], sizes: ["L"], colors: ["Blanco"], quantity: 1, garment_type: "franela",
    style_preference: null, deadline: null, status: "quoting",
    quoted_price_ves: null, admin_notes: "Pendiente de cotizar: el arte es a una tinta, va en DTF textil.",
    contact_name: "Julián Zambrano", contact_email: "julian.z@example.com", contact_phone: "0414-5550166",
    created_at: iso(3), updated_at: iso(1),
  },
  {
    id: "des_03", code: "JLY-D-003", customer_id: "cus_01", order_id: null,
    name: "8 franelas para evento de facultad", description: "Somos 8 del grupo de teatro. Queremos algo con el nombre del grupo y un ícono. Adjunté una foto de referencia.",
    reference_urls: ["/demo/references/grupo-1.svg"], sizes: ["S", "M", "L"], colors: ["Negro"],
    quantity: 8, garment_type: "franela", style_preference: "Sublimación", deadline: iso(-14),
    status: "approved", quoted_price_ves: 20, admin_notes: "Aprobado por Daniela. Falta confirmar tallas por persona.",
    contact_name: "Daniela R.", contact_email: "dani.r@example.com", contact_phone: "0412-5550134",
    created_at: iso(9), updated_at: iso(5),
  },
  {
    id: "des_04", code: "JLY-D-004", customer_id: "cus_04", order_id: null,
    name: "Uniformes del StudyVerse", description: "Pedido del grupo para el evento. 25 unidades, azul marino, escudo al pecho y el nombre del grupo en la manga.",
    reference_urls: ["/demo/references/uniforme-escudo.svg"], sizes: ["S", "M", "L", "XL"], colors: ["Azul marino"],
    quantity: 25, garment_type: "polo", style_preference: "DTF textil", deadline: iso(-5),
    status: "in_design", quoted_price_ves: 26, admin_notes: "Vector recibido. Va en DTF: se separa el escudo del nombre de la manga.",
    contact_name: "Grupo StudyVerse", contact_email: "studyverse.ueb@example.com", contact_phone: "0416-5550122",
    created_at: iso(20), updated_at: iso(10),
  },
  {
    id: "des_05", code: "JLY-D-005", customer_id: null, order_id: null,
    name: null, description: null, reference_urls: [], sizes: [], colors: [], quantity: 1,
    garment_type: null, style_preference: null, deadline: null, status: "new",
    quoted_price_ves: null, admin_notes: null,
    contact_name: "Visitante sin descripción", contact_email: null, contact_phone: null,
    created_at: iso(0), updated_at: iso(0),
  },
];

const reviews: Review[] = [
  { id: "rev_01", product_id: "prd_samurai_zen", customer_id: "cus_01", order_id: "ord_JLY-260110", author_name: "Daniela R.", rating: 5, title: "La calidad es otra cosa", body: "El estampado es nítido de verdad, no se cuartea. Huele a buena tela. Ya pedí dos iguales para mi hermana.", is_approved: true, created_at: iso(20) },
  { id: "rev_02", product_id: "prd_sakura_8bit", customer_id: "cus_03", order_id: "ord_JLY-260116", author_name: "Mateo S.", rating: 5, title: "Pixel art bien hecha", body: "Me gusta el detalle de la grilla. Llegó en 3 días a Maracay.", is_approved: true, created_at: iso(16) },
  { id: "rev_03", product_id: "prd_mono_logo", customer_id: "cus_07", order_id: "ord_JLY-260112", author_name: "Carla M.", rating: 4, title: "Cómoda y bonita", body: "Me quedé con una talla menos, pero la tela es muy suave. El estampado del logo se ve prolijo.", is_approved: true, created_at: iso(2) },
  { id: "rev_04", product_id: "prd_hoodie_ronin", customer_id: null, order_id: null, author_name: "Visitante", rating: 5, title: "Abrigada de verdad", body: "El molleton es denso, no es de los delgados.", is_approved: false, created_at: iso(1) },
];

/* ------------------------------------------------------------------ */

const default_settings: StoreSettings = {
  store_name: "JayLu",
  tagline: "Franelas con alma. Estampados que cuentan algo.",
  description: "Tienda de franelas y prendas con estampados personalizados. Diseños de anime, fantasía y cultura pop, más uniformes para estudiantes, grupos y eventos.",
  email: "hola@jaylu.ve",
  phone: "+58 412 000 0000",
  whatsapp: "584120000000",
  instagram: "jaylu.ve",
  tiktok: "jaylu.ve",
  address: "Caracas, Venezuela",
  currency_symbol: "Bs.",
  shipping_flat_ves: 5,
  free_shipping_over_ves: 30,
  bcv_eur_manual_rate: 0,
  bcv_rate: B,
  bcv_updated_at: iso(0),
  bcv_source: "BCV (demostración)",
  bcv_stale: false,
  online_payments_enabled: false,
  stripe_price_id_mode: "usd",
  // Datos de cobro de ejemplo. En una instalación real se rellenan desde
  // /admin/ajustes; aquí sirven para que el checkout se vea completo.
  bank_name: "Banco de Venezuela",
  bank_account_type: "Ahorro",
  bank_account_number: "0102 0123 45 6789012345",
  bank_account_name: "JayLu Store C.A.",
  pago_movil_phone: "0412 000 0000",
  zelle_name: "JayLu Store",
  zelle_phone: "+58 412 000 0000",
  binance_email: "jaylu.ve@binance.com",
  binance_pay_id: "38210455",
  order_notes_template: "Enviar a esperar en la sucursal. Si es uniforme, indicar talla y color de cada unidad.",
};

export function buildSeedData(): Record<string, unknown[]> {
  return {
    profiles: [],
    settings: [
      { key: "store", value: default_settings, updated_at: iso(0) },
      { key: "bcv", value: { rate: B, source: "BCV (demostración)", updated_at: iso(0), stale: false }, updated_at: iso(0) },
    ],
    categories,
    collections,
    products,
    product_collections,
    product_images,
    product_spin360,
    promotions,
    coupons,
    variants,
    stock_movements,
    raw_materials,
    material_movements,
    customers,
    crm_activities,
    leads,
    orders,
    order_items,
    custom_designs,
    reviews,
    activity_log: [
      { id: "log_01", user_id: null, user_email: "admin@jaylu.ve", action: "create", entity: "order", entity_id: "ord_JLY-260118", summary: "Pedido JLY-260118 creado desde la web", meta: null, created_at: iso(6) },
      { id: "log_02", user_id: null, user_email: "admin@jaylu.ve", action: "update", entity: "promotion", entity_id: "promo_invierno", summary: "Extensión de promo Invierno 26 al 30 días", meta: null, created_at: iso(4) },
      { id: "log_03", user_id: null, user_email: "admin@jaylu.ve", action: "adjust", entity: "raw_material", entity_id: "mat_04", summary: "Ajuste de molleton por merma de corte (-2 m)", meta: null, created_at: iso(11) },
    ],
  };
}
