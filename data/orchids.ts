export type ProductFormat = "cut" | "loose";

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
  lengthRange: string;
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

/** Standard Dendrobium cut sizes currently offered — referenced from product data, not UI. */
export const STANDARD_CUT_STEM_SIZES: ProductStemSize[] = [
  { id: "SS", label: "SS", lengthRange: "35–40 cm" },
  { id: "S", label: "S", lengthRange: "40–45 cm" },
  { id: "M", label: "M", lengthRange: "45–50 cm" },
  { id: "L", label: "L", lengthRange: "50–55 cm" },
  { id: "LL", label: "LL", lengthRange: "55–65 cm" },
];

export type OrchidProduct = {
  /**
   * Product code when confirmed. Use null/omit when still pending —
   * never invent a placeholder code or use display text as an ID.
   * Identity is always `slug`.
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
  /** Dyed variety flag — products remain under Dendrobium when true */
  isDyed?: boolean;
};

export const PRODUCT_FORMATS: { id: ProductFormat; label: string }[] = [
  { id: "cut", label: "Fresh Cut Orchids" },
  { id: "loose", label: "Fresh Loose Blooms" },
];

export const PRODUCT_FAMILIES: { id: ProductFamily; label: string }[] = [
  { id: "dendrobium", label: "Dendrobium" },
  { id: "mokara-aranda", label: "Mokara & Aranda" },
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
    category: opts.category ?? `DENDROBIUM ${opts.name.toUpperCase()}`,
    format: "cut",
    family: "dendrobium",
    color: opts.color ?? null,
    description: "Fresh-cut orchid stems",
    order: CUT_ORDER,
    isDyed: opts.isDyed,
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
    order: { unit: "blooms" },
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
    order: { unit: "blooms" },
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

export function normalizeProductFormat(value: string | null | undefined): ProductFormat {
  return value === "loose" ? "loose" : "cut";
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

export function familyLabel(family: ProductFamily): string {
  return PRODUCT_FAMILIES.find((item) => item.id === family)?.label ?? family;
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
