export type ProductFormat = "cut" | "bouquet" | "loose";

export type ProductFamily =
  | "dendrobium"
  | "mokara-aranda"
  | "vanda"
  | "oncidium"
  | "dyed";

/** @deprecated Use ProductFormat */
export type ProductFilter = ProductFormat;

export type ProductImage = {
  src: string;
  alt: string;
  /** Packing / box photos when available */
  kind?: "product" | "packing";
};

export type ProductPacking = {
  /** Stems (or blooms) per bunch — only when known */
  perBunch?: string;
  /** Units per pack — only when known */
  perPack?: string;
  /** Units / packs / bunches per box — only when known */
  perBox?: string;
};

export type ProductPackOption = {
  id: string;
  label: string;
};

/** Stem size / length row for Fresh Cut Orchids (only when product defines sizes). */
export type ProductStemSize = {
  id: string;
  label: string;
  /** Omit when stem length is not confirmed — never invent lengths from another genus. */
  lengthRange?: string;
};

export type ProductOrderOptions = {
  /** Clear order unit from known product data (e.g. stems, blooms) */
  unit: string;
  /**
   * Stem size table for Fresh Cut Orchids.
   * Only include when this variety offers these sizes; omit for Loose Blooms.
   */
  stemSizes?: ProductStemSize[];
  /** Loose bloom pack choices — only include when known */
  packOptions?: ProductPackOption[];
};

/**
 * Shared Loose Blooms pack sizes (packs × blooms).
 * Used by both Sonia and Big White detail / inquiry — do not invent cartons or weights.
 */
export const LOOSE_BLOOM_PACK_OPTIONS: ProductPackOption[] = [
  { id: "100", label: "100 Blooms" },
  { id: "500", label: "500 Blooms" },
  { id: "1000", label: "1,000 Blooms" },
  { id: "5000", label: "5,000 Blooms / Master" },
];

/** Blooms represented by one pack of each Loose Bloom pack option. */
export const LOOSE_BLOOM_PACK_BLOOMS: Record<string, number> = {
  "100": 100,
  "500": 500,
  "1000": 1000,
  "5000": 5000,
};

export type LooseBloomPackingRow = {
  packSize: string;
  innerPack: string;
  exportPacking: string;
};

export const LOOSE_BLOOM_PACKING_ROWS: LooseBloomPackingRow[] = [
  {
    packSize: "100 Blooms",
    innerPack: "1 × 100-bloom pack",
    exportPacking: "Consolidated",
  },
  {
    packSize: "500 Blooms",
    innerPack: "1 × 500-bloom pack",
    exportPacking: "Consolidated",
  },
  {
    packSize: "1,000 Blooms",
    innerPack: "1 × 1,000-bloom pack",
    exportPacking: "Wholesale Pack",
  },
  {
    packSize: "5,000 Blooms",
    innerPack: "5 × 1,000-bloom packs",
    exportPacking: "1 Master Carton",
  },
];

export const LOOSE_BLOOM_MASTER_CARTON_NOTE = "5,000 loose blooms per master carton";
export const LOOSE_BLOOM_PACKAGING_NOTE =
  "Protective inner packing designed to preserve petal shape and freshness during transit.";

const LOOSE_BLOOM_ORDER: ProductOrderOptions = {
  unit: "packs",
  packOptions: LOOSE_BLOOM_PACK_OPTIONS,
};

export function isLooseBloomProduct(
  product: Pick<{ format: ProductFormat }, "format">,
): boolean {
  return product.format === "loose";
}

export function looseBloomTotalFromPackQuantities(
  quantities: Record<string, number>,
): number {
  let total = 0;
  for (const pack of LOOSE_BLOOM_PACK_OPTIONS) {
    const qty = quantities[pack.id] ?? 0;
    if (!Number.isFinite(qty) || qty <= 0) continue;
    total += (LOOSE_BLOOM_PACK_BLOOMS[pack.id] ?? 0) * qty;
  }
  return total;
}

/**
 * Canonical stem-length ranges by size id — single source for catalog, packing,
 * inquiry, email, and Excel. Do not duplicate these strings elsewhere.
 */
export const CUT_STEM_LENGTHS: Record<string, string> = {
  SS: "35–40 cm",
  S: "40–45 cm",
  M: "45–50 cm",
  L: "50–55 cm",
  LL: "55–65 cm",
};

function stemSize(id: string, label: string): ProductStemSize {
  return { id, label, lengthRange: CUT_STEM_LENGTHS[id] };
}

/** Standard Dendrobium cut sizes currently offered — referenced from product data, not UI. */
export const STANDARD_CUT_STEM_SIZES: ProductStemSize[] = [
  stemSize("SS", "SS"),
  stemSize("S", "S"),
  stemSize("M", "M"),
  stemSize("L", "L"),
  stemSize("LL", "LL"),
];

/**
 * Mokara order sizes confirmed in source packing (stems per tray).
 * Only M / L / LL — do not auto-enable SS / S.
 * Lengths come from CUT_STEM_LENGTHS (same map as Dendrobium).
 */
export const MOKARA_CUT_STEM_SIZES: ProductStemSize[] = [
  stemSize("M", "M"),
  stemSize("L", "L"),
  stemSize("LL", "LL"),
];

const MOKARA_CUT_ORDER: ProductOrderOptions = {
  unit: "stems",
  stemSizes: MOKARA_CUT_STEM_SIZES,
};

/**
 * Vanda order sizes confirmed in source packing (stems per tray).
 * Only S / L / LL — do not enable SS / M.
 * Stem lengths are not confirmed — never copy lengths from Dendrobium/Mokara.
 */
export const VANDA_CUT_STEM_SIZES: ProductStemSize[] = [
  { id: "S", label: "S" },
  { id: "L", label: "L" },
  { id: "LL", label: "LL" },
];

const VANDA_CUT_ORDER: ProductOrderOptions = {
  unit: "stems",
  stemSizes: VANDA_CUT_STEM_SIZES,
};

/** Shared Vanda cut packing (stems per tray) — same for every Vanda variety. */
export const VANDA_STEMS_PER_TRAY = {
  S: "18",
  L: "16",
  LL: "14",
} as const;

/**
 * Oncidium order sizes confirmed in source packing (stems per tray).
 * Only M / L / LL — do not enable SS / S.
 * Stem lengths are not confirmed for Oncidium — never copy from Dendrobium/Mokara.
 */
export const ONCIDIUM_CUT_STEM_SIZES: ProductStemSize[] = [
  { id: "M", label: "M" },
  { id: "L", label: "L" },
  { id: "LL", label: "LL" },
];

const ONCIDIUM_CUT_ORDER: ProductOrderOptions = {
  unit: "stems",
  stemSizes: ONCIDIUM_CUT_STEM_SIZES,
};

/** Shared Oncidium cut packing (stems per tray) for confirmed Golden Shower sizes. */
export const ONCIDIUM_STEMS_PER_TRAY = {
  M: "180",
  L: "160",
  LL: "140",
} as const;

/**
 * Shared Dendrobium cut packing (category header / supplier table).
 * Used by every Dendrobium stem variety including dyed — do not duplicate per SKU.
 * “Supplier standard length” may differ from CUT_STEM_LENGTHS used by Stem sizes /
 * inquiry until a single length set is confirmed for the whole system.
 */
export type DendrobiumPackingRow = {
  size: string;
  supplierStandardLength: string;
  stemsPerTray: string;
};

export const DENDROBIUM_SUPPLIER_PACKING: DendrobiumPackingRow[] = [
  { size: "SS", supplierStandardLength: "35–40 cm", stemsPerTray: "100" },
  { size: "S", supplierStandardLength: "41–45 cm", stemsPerTray: "90" },
  { size: "M", supplierStandardLength: "46–49 cm", stemsPerTray: "90" },
  { size: "L", supplierStandardLength: "50–55 cm", stemsPerTray: "80" },
  { size: "LL", supplierStandardLength: "56–60 cm", stemsPerTray: "70" },
];

/**
 * Confirmed Dendrobium USA box packing (shared across the category).
 * Dimensions are centimetres; side order (L/W/H) is not labeled — unknown.
 * SS has no confirmed box row — do not invent one.
 * Alternate LL carton 37 × 75 × 42 (“Lei, LL”) remains unconfirmed for display.
 */
export type DendrobiumBoxPackingRow = {
  size: string;
  boxDimensionsCm: string;
  traysPerBox: string;
};

export const DENDROBIUM_BOX_PACKING: DendrobiumBoxPackingRow[] = [
  { size: "S", boxDimensionsCm: "39 × 70 × 43", traysPerBox: "5" },
  { size: "M", boxDimensionsCm: "39 × 70 × 43", traysPerBox: "5" },
  { size: "L", boxDimensionsCm: "39 × 70 × 43", traysPerBox: "5" },
  { size: "LL", boxDimensionsCm: "37 × 80 × 42", traysPerBox: "5" },
];

/**
 * Confirmed Mokara box packing remarks (shared across the category).
 * Used by every Mokara cut variety — do not duplicate per SKU.
 * Dimensions are centimetres; side order (L/W/H) is not labeled — unknown.
 */
export type BoxDimensionRemark = {
  label: string;
  detail: string;
};

export const MOKARA_BOX_DIMENSION_REMARKS: BoxDimensionRemark[] = [
  { label: "Sizes M & L", detail: "39 × 70 × 43 cm · 5 trays per box" },
  { label: "Size LL", detail: "37 × 80 × 42 cm · 5 trays per box" },
];

export type OrchidProduct = {
  /**
   * Product code when confirmed. Use null/omit when still pending —
   * never invent a placeholder code or use display text as an ID.
   * Identity is always `slug`.
   * Bouquet products omit a product-level code; codes live on bouquet options.
   */
  number?: string | null;
  slug: string;
  /** Catalog, breadcrumb, inquiry, email, and Excel display name */
  name: string;
  /**
   * Optional product-detail page headline under “Product Details”.
   * When omitted, the detail page uses `name`. Include any genus prefix in the data
   * (e.g. “Den. …”) — components do not invent “Den.” automatically.
   */
  detailName?: string;
  /**
   * Optional product-detail page section title above the headline.
   * When omitted, defaults to “Product Details”.
   */
  detailEyebrow?: string;
  descriptor: string;
  tagline?: string;
  imageClass: string;
  /** Primary catalog / card image (kept for existing home usage) */
  image: string;
  images: ProductImage[];
  category: string;
  format: ProductFormat;
  family: ProductFamily;
  /** Color tone when known; null/omit when still pending confirmation */
  color?: string | null;
  description: string;
  packing?: ProductPacking;
  /** When omitted or incomplete, detail page uses Inquire CTA */
  order?: ProductOrderOptions;
  /** Dyed variety flag — catalog family is `dyed` when true */
  isDyed?: boolean;
  /** Bouquet SKU options — informational table on product details */
  bouquetOptions?: BouquetOption[];
  /** Packing note shown above the bouquets-per-tray table */
  bouquetPackingNote?: string;
  /** Bouquets per tray by code and stem-size column (null = not available in source doc) */
  bouquetTrayCounts?: BouquetTrayRow[];
  /**
   * Confirmed stems-per-tray packing by size (Mokara, Vanda, etc.).
   * Omit sizes that are unavailable — never invent 0 or copy from another genus.
   */
  stemsPerTray?: {
    S?: string;
    M?: string;
    L?: string;
    LL?: string;
  };
};

/** One selectable bouquet SKU row (variety × stem count). */
export type BouquetOption = {
  variety: string;
  stemsPerBouquet: string;
  foliage: string;
  code: string;
};

/**
 * Bouquets-per-tray counts by stem-size column.
 * `null` means unavailable in the source document — never display as 0.
 */
export type BouquetTrayRow = {
  code: string;
  ss: string | null;
  s: string | null;
  m: string | null;
  l: string | null;
  ll: string | null;
};

/** Stem-size columns for bouquet packing / inquiry (shared order). */
export const BOUQUET_SIZE_COLUMNS = [
  { id: "SS", key: "ss", label: "SS" },
  { id: "S", key: "s", label: "S" },
  { id: "M", key: "m", label: "M" },
  { id: "L", key: "l", label: "L" },
  { id: "LL", key: "ll", label: "LL" },
] as const;

export type BouquetSizeColumnKey = (typeof BOUQUET_SIZE_COLUMNS)[number]["key"];

export const PRODUCT_FORMATS: { id: ProductFormat; label: string }[] = [
  { id: "cut", label: "Fresh Cut Orchids" },
  { id: "bouquet", label: "Bouquet" },
  { id: "loose", label: "Fresh Loose Blooms" },
];

export const PRODUCT_FAMILIES: { id: ProductFamily; label: string }[] = [
  { id: "dendrobium", label: "Dendrobium" },
  { id: "mokara-aranda", label: "Mokara" },
  { id: "vanda", label: "Vanda" },
  { id: "oncidium", label: "Oncidium" },
  { id: "dyed", label: "Dyed Orchids" },
];

export const UNKNOWN_DETAIL = "Confirmed with your quote";
export const PENDING_CONFIRMATION = "Pending confirmation";

const CUT_ORDER: ProductOrderOptions = {
  unit: "stems",
  stemSizes: STANDARD_CUT_STEM_SIZES,
};

function dendrobiumGalleryExtra(
  file: string,
  name: string,
  label = "additional photo",
): ProductImage {
  return {
    src: `/images/products/dendrobium/${file}`,
    alt: `${name} — ${label}`,
    kind: "product",
  };
}

function uniqueProductImages(images: ProductImage[]): ProductImage[] {
  const seen = new Set<string>();
  const out: ProductImage[] = [];
  for (const image of images) {
    if (seen.has(image.src)) continue;
    seen.add(image.src);
    out.push(image);
  }
  return out;
}

function dendrobiumCut(opts: {
  number?: string | null;
  slug: string;
  name: string;
  imageFile: string;
  color?: string | null;
  isDyed?: boolean;
  /** Extra gallery images after the primary catalog photo */
  extraImages?: ProductImage[];
  imageClass?: string;
  category?: string;
  tagline?: string;
}): OrchidProduct {
  const primary = `/images/products/dendrobium/${opts.imageFile}`;
  const images = uniqueProductImages([
    {
      src: primary,
      alt: `${opts.name} fresh-cut orchid stems`,
      kind: "product",
    },
    ...(opts.extraImages ?? []),
  ]);

  const isDyed = Boolean(opts.isDyed);
  return {
    number: opts.number ?? null,
    slug: opts.slug,
    name: opts.name,
    detailName: `Den. ${opts.name}`,
    detailEyebrow: "Product Details",
    descriptor: "Fresh-cut orchid stems",
    tagline: opts.tagline,
    imageClass: opts.imageClass ?? "",
    image: primary,
    images,
    category:
      opts.category ??
      (isDyed
        ? `DYED ORCHIDS ${opts.name.toUpperCase()}`
        : `DENDROBIUM ${opts.name.toUpperCase()}`),
    format: "cut",
    family: isDyed ? "dyed" : "dendrobium",
    color: opts.color ?? null,
    description: "Fresh-cut orchid stems",
    order: CUT_ORDER,
    isDyed: isDyed || undefined,
  };
}

function mokaraCut(opts: {
  number?: string | null;
  slug: string;
  name: string;
  imageFile: string;
  color?: string | null;
  /** Confirmed stems per tray for M / L / LL — omit when unconfirmed */
  stemsPerTray?: { M: string; L: string; LL: string };
  /** Extra gallery images after the primary catalog photo */
  extraImages?: ProductImage[];
}): OrchidProduct {
  const primary = `/images/products/mokara/${opts.imageFile}`;
  const confirmed = Boolean(opts.stemsPerTray && opts.number?.trim() && opts.color?.trim());
  const images = uniqueProductImages([
    {
      src: primary,
      alt: `${opts.name} fresh-cut Mokara orchid stems`,
      kind: "product",
    },
    ...(opts.extraImages ?? []),
  ]);

  return {
    number: opts.number ?? null,
    slug: opts.slug,
    name: opts.name,
    detailName: `Mok. ${opts.name}`,
    detailEyebrow: "Product Details",
    descriptor: "Fresh-cut Mokara orchid stems",
    imageClass: "",
    image: primary,
    images,
    category: `MOKARA ${opts.name.toUpperCase()}`,
    format: "cut",
    family: "mokara-aranda",
    color: opts.color ?? null,
    description: "Fresh-cut Mokara orchid stems",
    stemsPerTray: opts.stemsPerTray,
    // Only enable stem inquiry when code, color, and tray packing are confirmed.
    order: confirmed ? MOKARA_CUT_ORDER : undefined,
  };
}

function mokaraGalleryExtra(file: string, name: string, label = "additional photo"): ProductImage {
  return {
    src: `/images/products/mokara/${file}`,
    alt: `${name} — ${label}`,
    kind: "product",
  };
}

function vandaGalleryExtra(file: string, name: string, label = "additional photo"): ProductImage {
  return {
    src: `/images/products/vanda/${file}`,
    alt: `${name} — ${label}`,
    kind: "product",
  };
}

function vandaCut(opts: {
  number: string;
  slug: string;
  name: string;
  detailName: string;
  imageFile: string;
  color: string;
  /** Extra gallery images after the primary catalog photo */
  extraImages?: ProductImage[];
}): OrchidProduct {
  const primary = `/images/products/vanda/${opts.imageFile}`;
  const images = uniqueProductImages([
    {
      src: primary,
      alt: `${opts.name} fresh-cut orchid stems`,
      kind: "product",
    },
    ...(opts.extraImages ?? []),
  ]);

  return {
    number: opts.number,
    slug: opts.slug,
    name: opts.name,
    detailName: opts.detailName,
    detailEyebrow: "Product Details",
    descriptor: "Fresh-cut orchid stems",
    imageClass: "",
    image: primary,
    images,
    category: `VANDA ${opts.name.toUpperCase()}`,
    format: "cut",
    family: "vanda",
    color: opts.color,
    description: "Fresh-cut orchid stems",
    stemsPerTray: { ...VANDA_STEMS_PER_TRAY },
    order: VANDA_CUT_ORDER,
  };
}

function oncidiumCut(opts: {
  number: string;
  slug: string;
  name: string;
  detailName: string;
  imageFile: string;
  color: string;
  /** Extra gallery images after the primary catalog photo */
  extraImages?: ProductImage[];
}): OrchidProduct {
  const primary = `/images/products/oncidium/${opts.imageFile}`;
  const images = uniqueProductImages([
    {
      src: primary,
      alt: `${opts.name} fresh-cut orchid stems`,
      kind: "product",
    },
    ...(opts.extraImages ?? []),
  ]);

  return {
    number: opts.number,
    slug: opts.slug,
    name: opts.name,
    detailName: opts.detailName,
    detailEyebrow: "Product Details",
    descriptor: "Fresh-cut orchid stems",
    imageClass: "",
    image: primary,
    images,
    category: `ONCIDIUM ${opts.name.toUpperCase()}`,
    format: "cut",
    family: "oncidium",
    color: opts.color,
    description: "Fresh-cut orchid stems",
    stemsPerTray: { ...ONCIDIUM_STEMS_PER_TRAY },
    order: ONCIDIUM_CUT_ORDER,
  };
}

export const orchids: OrchidProduct[] = [
  // 01 — keep slug / inquiry identity for Big White Form
  dendrobiumCut({
    number: "BWF",
    slug: "big-white",
    name: "Big White Form",
    imageFile: "big-white-form.png",
    color: "White Tone",
    imageClass: "white-image",
    category: "DENDROBIUM BIG WHITE",
    tagline: "WHITE FOR BALANCE",
    extraImages: [
      {
        src: "/images/products/big-white.png",
        alt: "Big White Form — additional photo",
        kind: "product",
      },
      dendrobiumGalleryExtra("big-white-form-2.png", "Big White Form"),
      dendrobiumGalleryExtra("big-white-form-3.png", "Big White Form"),
    ],
  }),
  // 02 — code pending
  dendrobiumCut({
    number: null,
    slug: "jacqueline-white",
    name: "Jacqueline White",
    imageFile: "jacqueline-white.png",
    color: "White Tone",
    extraImages: [dendrobiumGalleryExtra("jacqueline-white-2.png", "Jacqueline White")],
  }),
  // 03
  dendrobiumCut({
    number: "PW",
    slug: "prima-white",
    name: "Prima White",
    imageFile: "prima-white.png",
    color: "White Tone",
  }),
  // 04
  dendrobiumCut({
    number: "WG",
    slug: "white-galaxy",
    name: "White Galaxy",
    imageFile: "white-galaxy.png",
    color: "White Tone",
    extraImages: [dendrobiumGalleryExtra("white-galaxy-2.png", "White Galaxy")],
  }),
  // 05
  dendrobiumCut({
    number: "BJ",
    slug: "burana-jade",
    name: "Burana Jade",
    imageFile: "burana-jade.png",
    color: "Green Tone",
    extraImages: [dendrobiumGalleryExtra("burana-jade-2.png", "Burana Jade")],
  }),
  // 06
  dendrobiumCut({
    number: "ML",
    slug: "moonlight",
    name: "Moonlight",
    imageFile: "moonlight.png",
    color: "Green Tone",
  }),
  // 07
  dendrobiumCut({
    number: "PD",
    slug: "pandanus",
    name: "Pandanus",
    imageFile: "pandanus.png",
    color: "Green Tone",
  }),
  // 08 — code and color pending
  dendrobiumCut({
    number: null,
    slug: "sweet-pink",
    name: "Sweet Pink",
    imageFile: "sweet-pink.png",
    color: null,
  }),
  // 09
  dendrobiumCut({
    number: "SG",
    slug: "splash-galaxy",
    name: "Splash Galaxy",
    imageFile: "splash-galaxy.png",
    color: "Novelty Tone",
  }),
  // 10
  dendrobiumCut({
    number: "QL",
    slug: "queensland",
    name: "Queensland",
    imageFile: "queensland.png",
    color: "Novelty Tone",
  }),
  // 11
  dendrobiumCut({
    number: "PB",
    slug: "pink-butterfly",
    name: "Pink Butterfly",
    imageFile: "pink-butterfly.png",
    color: "Novelty Tone",
  }),
  // 12
  dendrobiumCut({
    number: "CT",
    slug: "candy-twist",
    name: "Candy Twist",
    imageFile: "candy-twist.png",
    color: "Stripe Pink Tone",
    extraImages: [dendrobiumGalleryExtra("candy-twist-2.png", "Candy Twist")],
  }),
  // 13
  dendrobiumCut({
    number: "CW",
    slug: "candy-sweet",
    name: "Candy Sweet",
    imageFile: "candy-sweet.png",
    color: "Stripe Pink Tone",
    extraImages: [dendrobiumGalleryExtra("candy-sweet-2.png", "Candy Sweet")],
  }),
  // 14
  dendrobiumCut({
    number: "LH",
    slug: "lovely-sherbet",
    name: "Lovely Sherbet",
    imageFile: "lovely-sherbet.png",
    color: "Stripe Pink Tone",
    extraImages: [dendrobiumGalleryExtra("lovely-sherbet-2.png", "Lovely Sherbet")],
  }),
  // 15
  dendrobiumCut({
    number: "MS",
    slug: "miss-singapore",
    name: "Miss Singapore",
    imageFile: "miss-singapore.png",
    color: "Dark Purple Tone",
    extraImages: [dendrobiumGalleryExtra("miss-singapore-2.png", "Miss Singapore")],
  }),
  // 16
  dendrobiumCut({
    number: "MR",
    slug: "maroon",
    name: "Maroon",
    imageFile: "maroon.png",
    color: "Dark Purple Tone",
  }),
  // 17
  dendrobiumCut({
    number: "SB",
    slug: "sabine",
    name: "Sabine",
    imageFile: "sabine.png",
    color: "Dark Purple Tone",
  }),
  // 18
  dendrobiumCut({
    number: "RV",
    slug: "red-velvet",
    name: "Red Velvet",
    imageFile: "red-velvet.png",
    color: "Dark Purple Tone",
  }),
  // 19 — keep slug / inquiry identity for Sonia
  dendrobiumCut({
    number: "SN",
    slug: "sonia-purple",
    name: "Sonia",
    imageFile: "sonia.png",
    color: "Red Magenta Tone",
    imageClass: "sonia-image",
    category: "DENDROBIUM SONIA",
    tagline: "PURPLE FOR IMPACT",
    extraImages: [
      {
        src: "/images/products/sonia-purple.png",
        alt: "Sonia — additional photo",
        kind: "product",
      },
      {
        src: "/images/products/sonia-purple-pack.png",
        alt: "Sonia packing",
        kind: "packing",
      },
      dendrobiumGalleryExtra("sonia-3.png", "Sonia"),
    ],
  }),
  // 20
  dendrobiumCut({
    number: "SL",
    slug: "skalaxy",
    name: "Skalaxy",
    imageFile: "skalaxy.png",
    color: "Red Magenta Tone",
    extraImages: [dendrobiumGalleryExtra("skalaxy-2.png", "Skalaxy")],
  }),
  // 21
  dendrobiumCut({
    number: "SR",
    slug: "siam-ruby",
    name: "Siam Ruby",
    imageFile: "siam-ruby.png",
    color: "Red Magenta Tone",
    extraImages: [dendrobiumGalleryExtra("siam-ruby-2.png", "Siam Ruby")],
  }),
  // 22
  dendrobiumCut({
    number: "FV",
    slug: "forever",
    name: "Forever",
    imageFile: "forever.png",
    color: "Red Violet Tone",
  }),
  // 23
  dendrobiumCut({
    number: "MD",
    slug: "madam",
    name: "Madam",
    imageFile: "madam.png",
    color: "Red Violet Tone",
    extraImages: [dendrobiumGalleryExtra("madam-2.png", "Madam")],
  }),
  // 24
  dendrobiumCut({
    number: "BO",
    slug: "blue-ocean",
    name: "Blue Ocean",
    imageFile: "blue-ocean.png",
    color: "Purple Tone",
    extraImages: [dendrobiumGalleryExtra("blue-ocean-2.png", "Blue Ocean")],
  }),
  // 25
  dendrobiumCut({
    number: "AL",
    slug: "alvier",
    name: "Alvier",
    imageFile: "alvier.png",
    color: "Two Tone",
    extraImages: [dendrobiumGalleryExtra("alvier-2.png", "Alvier")],
  }),
  // 26
  dendrobiumCut({
    number: "MB",
    slug: "morning-blossom",
    name: "Morning Blossom",
    imageFile: "morning-blossom.png",
    color: "Two Tone",
    extraImages: [dendrobiumGalleryExtra("morning-bloom-2.png", "Morning Blossom")],
  }),
  // 27
  dendrobiumCut({
    number: "PC",
    slug: "princess-crown",
    name: "Princess Crown",
    imageFile: "princess-crown.png",
    color: "Two Tone",
    extraImages: [dendrobiumGalleryExtra("princess-crown-2.png", "Princess Crown")],
  }),
  // 28
  dendrobiumCut({
    number: "SW",
    slug: "sugar-sweet",
    name: "Sugar Sweet",
    imageFile: "sugar-sweet.png",
    color: "Magenta Tone",
  }),
  // 29
  dendrobiumCut({
    number: "AN",
    slug: "anna",
    name: "Anna",
    imageFile: "anna.png",
    color: "Magenta Tone",
  }),
  // 30
  dendrobiumCut({
    number: "IN",
    slug: "intuwong",
    name: "Intuwong",
    imageFile: "intuwong.png",
    color: "Magenta Tone",
    extraImages: [dendrobiumGalleryExtra("intuwong-2.png", "Intuwong")],
  }),
  // 31
  dendrobiumCut({
    number: "QP",
    slug: "queen-pink",
    name: "Queen Pink",
    imageFile: "queen-pink.png",
    color: "Magenta Tone",
    extraImages: [dendrobiumGalleryExtra("queen-pink-2.png", "Queen Pink")],
  }),
  // 32
  dendrobiumCut({
    number: "SK",
    slug: "sakura",
    name: "Sakura",
    imageFile: "sakura.png",
    color: "Dark Pink Tone",
    extraImages: [dendrobiumGalleryExtra("sakura-2.png", "Sakura")],
  }),
  // 33
  dendrobiumCut({
    number: "HW",
    slug: "hawaiian",
    name: "Hawaiian",
    imageFile: "hawaiian.png",
    color: "Dark Pink Tone",
    extraImages: [dendrobiumGalleryExtra("hawaiian-pink-2.png", "Hawaiian")],
  }),
  // 34
  dendrobiumCut({
    number: "PG",
    slug: "pink-galaxy",
    name: "Pink Galaxy",
    imageFile: "pink-galaxy.png",
    color: "Light Pink Tone",
  }),
  // 35
  dendrobiumCut({
    number: "MT",
    slug: "miss-teen",
    name: "Miss Teen",
    imageFile: "miss-teen.png",
    color: "Light Pink Tone",
    extraImages: [dendrobiumGalleryExtra("miss-teen-2.png", "Miss Teen")],
  }),
  // 36
  dendrobiumCut({
    number: "NV",
    slug: "neva",
    name: "Neva",
    imageFile: "neva.png",
    color: "Peach Tone",
  }),
  // 37
  dendrobiumCut({
    number: "CL",
    slug: "classic",
    name: "Classic",
    imageFile: "classic.png",
    color: "Peach Tone",
    extraImages: [dendrobiumGalleryExtra("classic-2.png", "Classic")],
  }),
  // 38
  dendrobiumCut({
    number: "SN (B)",
    slug: "dyed-blue-sonia",
    name: "Dyed Blue Sonia",
    imageFile: "dyed-blue-sonia.png",
    color: "Blue — Dyed",
    isDyed: true,
  }),
  // 39
  dendrobiumCut({
    number: "SN (PP)",
    slug: "dyed-purple-sonia",
    name: "Dyed Purple Sonia",
    imageFile: "dyed-purple-sonia.png",
    color: "Purple — Dyed",
    isDyed: true,
  }),
  // 40
  dendrobiumCut({
    number: "SN (R)",
    slug: "dyed-red-sonia",
    name: "Dyed Red Sonia",
    imageFile: "dyed-red-sonia.png",
    color: "Red — Dyed",
    isDyed: true,
  }),
  // 41
  dendrobiumCut({
    number: "SN (Y)",
    slug: "dyed-yellow-sonia",
    name: "Dyed Yellow Sonia",
    imageFile: "dyed-yellow-sonia.png",
    color: "Yellow — Dyed",
    isDyed: true,
  }),
  // 42 — code pending (possible BWF (B), unconfirmed)
  dendrobiumCut({
    number: null,
    slug: "dyed-blue-white-orchid",
    name: "Dyed Blue White Orchid",
    imageFile: "dyed-blue-white-orchid.png",
    color: "Blue — Dyed",
    isDyed: true,
  }),
  // 43 — code pending (possible BWF (Y), unconfirmed)
  dendrobiumCut({
    number: null,
    slug: "dyed-yellow-white-orchid",
    name: "Dyed Yellow White Orchid",
    imageFile: "dyed-yellow-white-orchid.png",
    color: "Yellow — Dyed",
    isDyed: true,
  }),
  // Mokara (Orchids → Mokara) — order matches source files 01–19; skip if re-run would duplicate slugs
  mokaraCut({
    number: "CS",
    slug: "mokara-calipso",
    name: "Calipso",
    imageFile: "01-calipso.png",
    color: "Purple Tone",
    stemsPerTray: { M: "90", L: "80", LL: "70" },
    extraImages: [mokaraGalleryExtra("calipso.png", "Calipso")],
  }),
  mokaraCut({
    number: "BCS",
    slug: "mokara-big-calipso",
    name: "Big Calipso",
    imageFile: "02-big-calipso.png",
    color: "Purple Tone",
    stemsPerTray: { M: "80", L: "70", LL: "60" },
    extraImages: [mokaraGalleryExtra("big-calipso.png", "Big Calipso")],
  }),
  mokaraCut({
    number: "NR",
    slug: "mokara-norah-blue",
    name: "Norah Blue",
    imageFile: "03-norah-blue.png",
    color: "Purple Tone",
    stemsPerTray: { M: "80", L: "70", LL: "60" },
    extraImages: [mokaraGalleryExtra("norah-blue.png", "Norah Blue")],
  }),
  mokaraCut({
    number: null,
    slug: "mokara-anne-cool",
    name: "Anne Cool",
    imageFile: "04-anne-cool.png",
    color: null,
  }),
  mokaraCut({
    number: null,
    slug: "mokara-ryder",
    name: "Ryder",
    imageFile: "05-ryder.png",
    color: null,
  }),
  mokaraCut({
    number: "BS",
    slug: "mokara-blue-sky",
    name: "Blue Sky",
    imageFile: "06-blue-sky.png",
    color: "Purple Tone",
    stemsPerTray: { M: "90", L: "80", LL: "70" },
  }),
  mokaraCut({
    number: "JC",
    slug: "mokara-juicy-syrup",
    name: "Juicy Syrup",
    imageFile: "07-juicy-syrub.png",
    color: "Orange Tone",
    stemsPerTray: { M: "90", L: "80", LL: "70" },
  }),
  mokaraCut({
    number: "YK",
    slug: "mokara-yellow-kitty",
    name: "Yellow Kitty",
    imageFile: "08-yellow-kitty.png",
    color: "Yellow Tone",
    stemsPerTray: { M: "80", L: "70", LL: "60" },
    extraImages: [mokaraGalleryExtra("yellow-kitty.png", "Yellow Kitty")],
  }),
  mokaraCut({
    number: "YL",
    slug: "mokara-yellow-salaya",
    name: "Yellow Salaya",
    imageFile: "09-yellow-salaya.png",
    color: "Yellow Tone",
    stemsPerTray: { M: "90", L: "80", LL: "70" },
    extraImages: [mokaraGalleryExtra("yellow-salaya.png", "Yellow Salaya")],
  }),
  mokaraCut({
    number: "TM",
    slug: "mokara-tammy-yellow",
    name: "Tammy Yellow",
    imageFile: "10-tammy-yellow.png",
    color: "Yellow Tone",
    stemsPerTray: { M: "90", L: "80", LL: "70" },
    extraImages: [mokaraGalleryExtra("tammy-yellow.png", "Tammy Yellow")],
  }),
  mokaraCut({
    number: "TR",
    slug: "mokara-tangerine",
    name: "Tangerine",
    imageFile: "11-tangerine.png",
    color: "Orange Tone",
    stemsPerTray: { M: "90", L: "80", LL: "70" },
    extraImages: [mokaraGalleryExtra("tangerine.png", "Tangerine")],
  }),
  mokaraCut({
    number: "PN",
    slug: "mokara-punny",
    name: "Punny",
    imageFile: "12-punny.png",
    color: "Yellow Tone",
    stemsPerTray: { M: "80", L: "70", LL: "60" },
    extraImages: [mokaraGalleryExtra("punny.png", "Punny")],
  }),
  mokaraCut({
    number: "OJ",
    slug: "mokara-orange-jubkuan",
    name: "Orange Jubkuan",
    imageFile: "13-orange-jubkuan.png",
    color: "Orange Tone",
    stemsPerTray: { M: "80", L: "70", LL: "60" },
    extraImages: [mokaraGalleryExtra("orange-jubkuan.png", "Orange Jubkuan")],
  }),
  mokaraCut({
    number: "RL",
    slug: "mokara-red-salaya",
    name: "Red Salaya",
    imageFile: "14-red-salaya.png",
    color: "Red Tone",
    stemsPerTray: { M: "90", L: "80", LL: "70" },
    extraImages: [mokaraGalleryExtra("red-salaya.png", "Red Salaya")],
  }),
  mokaraCut({
    number: "RB",
    slug: "mokara-red-ruby",
    name: "Red Ruby",
    imageFile: "15-red-ruby.png",
    color: "Red Tone",
    stemsPerTray: { M: "90", L: "80", LL: "70" },
    extraImages: [mokaraGalleryExtra("red-ruby.png", "Red Ruby")],
  }),
  mokaraCut({
    number: "RC",
    slug: "mokara-red-crystal",
    name: "Red Crystal",
    imageFile: "16-red-crystal.png",
    color: "Red Tone",
    stemsPerTray: { M: "90", L: "80", LL: "70" },
    extraImages: [mokaraGalleryExtra("red-crystal.png", "Red Crystal")],
  }),
  mokaraCut({
    number: "RP",
    slug: "mokara-royal-sapphire",
    name: "Royal Sapphire",
    imageFile: "17-royal-sapphire.png",
    color: "Pink Tone",
    stemsPerTray: { M: "90", L: "80", LL: "70" },
    extraImages: [mokaraGalleryExtra("royal-sapphire.png", "Royal Sapphire")],
  }),
  mokaraCut({
    number: "PJ",
    slug: "mokara-pink-jubkuan",
    name: "Pink Jubkuan",
    imageFile: "18-pink-jubkuan.png",
    color: "Pink Tone",
    stemsPerTray: { M: "80", L: "70", LL: "60" },
    extraImages: [mokaraGalleryExtra("pink-jubkuan.png", "Pink Jubkuan")],
  }),
  mokaraCut({
    number: "TC",
    slug: "mokara-tago-christine",
    name: "Tago Christine",
    imageFile: "19-tago-cristine.png",
    color: "White Tone",
    stemsPerTray: { M: "80", L: "70", LL: "60" },
    // Primary remains 19-tago-cristine.png (single bloom); add spray photo with matching pattern.
    extraImages: [mokaraGalleryExtra("tago-christine.png", "Tago Christine")],
  }),
  // Vanda (Orchids → Vanda) — order: Fuce → Patchara → Fushia → Doctor Anek
  vandaCut({
    number: "FE",
    slug: "vanda-fuce",
    name: "Fuce",
    detailName: "Van. Fuce",
    imageFile: "fuce.png",
    color: "Blue Tone",
  }),
  vandaCut({
    number: "PT",
    slug: "vanda-patchara",
    name: "Patchara",
    detailName: "Van. Patchara",
    imageFile: "patchara.png",
    color: "Purple Tone",
  }),
  vandaCut({
    number: "FS",
    slug: "vanda-fushia",
    name: "Fushia",
    detailName: "Van. Fushia",
    imageFile: "fushia.png",
    color: "Pink Tone",
  }),
  vandaCut({
    number: "DA",
    slug: "vanda-doctor-anek",
    name: "Doctor Anek",
    detailName: "Van. Doctor Anek",
    imageFile: "doctor.png",
    color: "Dark Pink Tone",
    extraImages: [vandaGalleryExtra("doctor-anek.png", "Doctor Anek")],
  }),
  // Oncidium (Orchids → Oncidium) — Golden Shower only (Grower Ramsay deferred: no matched photo)
  oncidiumCut({
    number: "ON",
    slug: "oncidium-golden-shower",
    name: "Golden Shower",
    detailName: "Onc. Golden Shower",
    imageFile: "oncidium.png",
    color: "Yellow Tone",
    extraImages: [
      {
        src: "/images/products/oncidium/oncidium-2.png",
        alt: "Golden Shower — spray form",
        kind: "product",
      },
    ],
  }),
  {
    number: null,
    slug: "bouquet",
    name: "Orchid Bouquets",
    detailName: "Orchid Bouquets",
    detailEyebrow: "Product Details",
    descriptor:
      "Choose Dendrobium or Mokara bouquets with 3, 5, or 7 stems, each finished with one leaf.",
    imageClass: "",
    image: "/images/products/bouquet/bouquet-1.png",
    images: [
      {
        src: "/images/products/bouquet/bouquet-1.png",
        alt: "Bouquet of fresh-cut Dendrobium orchids",
        kind: "product",
      },
      {
        src: "/images/products/bouquet/bouquet-2.png",
        alt: "Bouquet — additional photo",
        kind: "product",
      },
      {
        src: "/images/products/bouquet/bouquet-3.png",
        alt: "Bouquet — additional photo",
        kind: "product",
      },
    ],
    category: "BOUQUET",
    format: "bouquet",
    family: "dendrobium",
    color: null,
    description:
      "Choose Dendrobium or Mokara bouquets with 3, 5, or 7 stems, each finished with one leaf.",
    bouquetOptions: [
      { variety: "Dendrobium", stemsPerBouquet: "3 stems", foliage: "1 leaf", code: "DBQ3" },
      { variety: "Dendrobium", stemsPerBouquet: "5 stems", foliage: "1 leaf", code: "DBQ5" },
      { variety: "Dendrobium", stemsPerBouquet: "7 stems", foliage: "1 leaf", code: "DBQ7" },
      { variety: "Mokara", stemsPerBouquet: "3 stems", foliage: "1 leaf", code: "MBQ3" },
      { variety: "Mokara", stemsPerBouquet: "5 stems", foliage: "1 leaf", code: "MBQ5" },
      { variety: "Mokara", stemsPerBouquet: "7 stems", foliage: "1 leaf", code: "MBQ7" },
    ],
    bouquetPackingNote: "Bouquets per tray vary by bouquet type and stem size.",
    bouquetTrayCounts: [
      { code: "DBQ3", ss: "33", s: "30", m: "30", l: "26", ll: "23" },
      { code: "DBQ5", ss: "20", s: "18", m: "18", l: "16", ll: "14" },
      { code: "DBQ7", ss: "14", s: "12", m: "12", l: "11", ll: "10" },
      { code: "MBQ3", ss: null, s: null, m: "30", l: "26", ll: "23" },
      { code: "MBQ5", ss: null, s: null, m: "18", l: "16", ll: "14" },
      { code: "MBQ7", ss: null, s: null, m: "12", l: "11", ll: "10" },
    ],
    order: { unit: "bouquets" },
  },
  {
    number: "03",
    slug: "loose-blooms-sonia",
    name: "Loose Blooms",
    descriptor: "Individual purple orchid for garnish",
    imageClass: "loose-image",
    image: "/images/products/loose-bloom-sonia.png",
    images: [
      {
        src: "/images/products/loose-bloom-sonia.png",
        alt: "Loose Blooms — Dendrobium Sonia",
        kind: "product",
      },
    ],
    category: "DENDROBIUM SONIA",
    format: "loose",
    family: "dendrobium",
    color: "Purple",
    description: "Individual purple orchid for garnish",
    order: LOOSE_BLOOM_ORDER,
  },
  {
    number: "04",
    slug: "loose-blooms-big-white",
    name: "Loose Blooms",
    descriptor: "Individual white orchids for garnish",
    imageClass: "new-collection-image",
    image: "/images/products/loose-bloom-white.png",
    images: [
      {
        src: "/images/products/loose-bloom-white.png",
        alt: "Loose Blooms — Dendrobium Big White",
        kind: "product",
      },
    ],
    category: "DENDROBIUM BIG WHITE",
    format: "loose",
    family: "dendrobium",
    color: "White",
    description: "Individual white orchids for garnish",
    order: LOOSE_BLOOM_ORDER,
  },
];

export function displayProductCode(product: Pick<OrchidProduct, "number">): string {
  const code = product.number?.trim();
  return code ? code : PENDING_CONFIRMATION;
}

export function displayProductColor(product: Pick<OrchidProduct, "color">): string {
  const color = product.color?.trim();
  return color ? color : PENDING_CONFIRMATION;
}

/** Tray count cell — null/empty means unavailable in source data, shown as an em dash. */
export function displayBouquetTrayCount(value: string | null | undefined): string {
  if (value == null || value.trim() === "") return "—";
  return value.trim();
}

export function hasBouquetOptions(product: OrchidProduct): boolean {
  return Boolean(product.bouquetOptions?.length);
}

export function getBouquetTrayRow(
  product: Pick<OrchidProduct, "bouquetTrayCounts">,
  code: string,
): BouquetTrayRow | undefined {
  return product.bouquetTrayCounts?.find((row) => row.code === code);
}

/** Sizes with real packing counts only — “—” / null columns are not selectable. */
export function availableBouquetSizes(
  trayRow: BouquetTrayRow | undefined,
): { id: string; label: string }[] {
  if (!trayRow) return [];
  return BOUQUET_SIZE_COLUMNS.filter((col) => {
    const value = trayRow[col.key];
    return value != null && String(value).trim() !== "";
  }).map((col) => ({ id: col.id, label: col.label }));
}

/** Confirmed packing cells for mobile blocks (skips unavailable sizes). */
export function bouquetPackingSizeEntries(
  trayRow: BouquetTrayRow,
): { size: string; count: string }[] {
  return BOUQUET_SIZE_COLUMNS.flatMap((col) => {
    const value = trayRow[col.key];
    if (value == null || String(value).trim() === "") return [];
    return [{ size: col.label, count: String(value).trim() }];
  });
}

export function normalizeProductFormat(value: string | null | undefined): ProductFormat {
  if (value === "loose") return "loose";
  if (value === "bouquet") return "bouquet";
  return "cut";
}

export function normalizeProductFamily(value: string | null | undefined): ProductFamily {
  const match = PRODUCT_FAMILIES.find((item) => item.id === value);
  return match ? match.id : "dendrobium";
}

export type ProductsQuery = {
  format?: ProductFormat;
  family?: ProductFamily;
  color?: string | null;
  q?: string | null;
};

export function productsHref(
  format: ProductFormat,
  family: ProductFamily = "dendrobium",
  extras: { color?: string | null; q?: string | null } = {},
) {
  const params = new URLSearchParams();
  params.set("format", format);
  if (family !== "dendrobium") params.set("category", family);
  if (extras.color) params.set("color", extras.color);
  if (extras.q?.trim()) params.set("q", extras.q.trim());
  return `/products?${params.toString()}`;
}

export function productsHrefFromQuery(query: ProductsQuery) {
  return productsHref(
    query.format ?? "cut",
    query.family ?? "dendrobium",
    { color: query.color, q: query.q },
  );
}

export function productDetailHref(slug: string, query: ProductsQuery = {}) {
  const catalog = productsHrefFromQuery(query);
  const search = catalog.includes("?") ? catalog.slice(catalog.indexOf("?")) : "";
  return `/products/${slug}${search}`;
}

export function getOrchidBySlug(slug: string): OrchidProduct | undefined {
  return orchids.find((item) => item.slug === slug);
}

export function filterOrchids(
  format: ProductFormat,
  family: ProductFamily = "dendrobium",
): OrchidProduct[] {
  return orchids.filter((item) => item.format === format && item.family === family);
}

export function getAvailableColors(
  format: ProductFormat,
  family: ProductFamily = "dendrobium",
): string[] {
  const colors = new Set(
    filterOrchids(format, family)
      .map((item) => item.color?.trim())
      .filter((color): color is string => Boolean(color)),
  );
  return Array.from(colors).sort((a, b) => a.localeCompare(b));
}

export function searchOrchids(
  products: OrchidProduct[],
  opts: { q?: string | null; color?: string | null },
): OrchidProduct[] {
  const query = opts.q?.trim().toLowerCase() ?? "";
  const color = opts.color?.trim().toLowerCase() ?? "";

  return products.filter((item) => {
    if (color && (item.color?.toLowerCase() ?? "") !== color) return false;
    if (!query) return true;
    const haystack = [
      item.name,
      item.category,
      item.number ?? "",
      item.color ?? "",
      item.descriptor,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function canAddToInquiry(product: OrchidProduct): boolean {
  return Boolean(product.order?.unit?.trim());
}

export function formatLabel(format: ProductFormat): string {
  return PRODUCT_FORMATS.find((item) => item.id === format)?.label ?? "Products";
}

/** Short breadcrumb / nav label for product formats (Orchids / Bouquets / Loose Blooms). */
export function formatNavLabel(format: ProductFormat): string {
  if (format === "cut") return "Orchids";
  if (format === "bouquet") return "Bouquets";
  return "Loose Blooms";
}

export function familyLabel(family: ProductFamily): string {
  return PRODUCT_FAMILIES.find((item) => item.id === family)?.label ?? family;
}

/** Dendrobium stem packing table — also used by dyed cut stems (same tray/size rules). */
export function isDendrobiumCutProduct(
  product: Pick<OrchidProduct, "format" | "family">,
): boolean {
  return (
    product.format === "cut" &&
    (product.family === "dendrobium" || product.family === "dyed")
  );
}

export function stemsPerTrayRows(
  product: OrchidProduct,
): { size: string; stemLength: string; stemsPerTray: string }[] {
  const tray = product.stemsPerTray;
  if (!tray) return [];

  const lengthBySize = new Map(
    (product.order?.stemSizes ?? []).map((size) => [
      size.id,
      size.lengthRange?.trim() || "",
    ]),
  );

  // Prefer confirmed inquiry size order; otherwise scan known packing keys.
  const sizeOrder =
    product.order?.stemSizes?.map((size) => size.id) ??
    (["S", "M", "L", "LL"] as const).filter((size) => Boolean(tray[size]?.trim()));

  const rows: { size: string; stemLength: string; stemsPerTray: string }[] = [];
  for (const size of sizeOrder) {
    const count = tray[size as keyof typeof tray]?.trim();
    if (!count) continue;
    rows.push({
      size,
      // Only show length when this product defines it — never invent from another genus.
      stemLength: lengthBySize.get(size) || "",
      stemsPerTray: count,
    });
  }
  return rows;
}

export function packingLines(product: OrchidProduct): { label: string; value: string }[] {
  const packing = product.packing;
  if (product.format === "loose") {
    return [
      { label: "Per pack", value: packing?.perPack ?? UNKNOWN_DETAIL },
      { label: "Per box", value: packing?.perBox ?? UNKNOWN_DETAIL },
    ];
  }
  return [
    { label: "Per bunch", value: packing?.perBunch ?? UNKNOWN_DETAIL },
    { label: "Per box", value: packing?.perBox ?? UNKNOWN_DETAIL },
  ];
}
