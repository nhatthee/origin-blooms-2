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
  number: string;
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
  color: string;
  description: string;
  packing?: ProductPacking;
  /** When omitted or incomplete, detail page uses Inquire CTA */
  order?: ProductOrderOptions;
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

export const orchids: OrchidProduct[] = [
  {
    number: "SN",
    slug: "sonia-purple",
    name: "Sonia",
    detailName: "Den. Sonia",
    detailEyebrow: "Product Details",
    descriptor: "Fresh-cut orchid stems",
    tagline: "PURPLE FOR IMPACT",
    imageClass: "sonia-image",
    image: "/images/products/sonia-purple.png",
    images: [
      {
        src: "/images/products/sonia-purple.png",
        alt: "Sonia fresh-cut orchid stems",
        kind: "product",
      },
      {
        src: "/images/products/sonia-purple-pack.png",
        alt: "Sonia packing",
        kind: "packing",
      },
    ],
    category: "DENDROBIUM SONIA",
    format: "cut",
    family: "dendrobium",
    color: "Red Magenta Tone",
    description: "Fresh-cut orchid stems",
    order: { unit: "stems", stemSizes: STANDARD_CUT_STEM_SIZES },
  },
  {
    number: "BWF",
    slug: "big-white",
    name: "Big White Form",
    detailName: "Den. Big White Form",
    detailEyebrow: "Product Details",
    descriptor: "Fresh-cut orchid stems",
    tagline: "WHITE FOR BALANCE",
    imageClass: "white-image",
    image: "/images/products/big-white.png",
    images: [
      {
        src: "/images/products/big-white.png",
        alt: "Big White Form fresh-cut orchid stems",
        kind: "product",
      },
    ],
    category: "DENDROBIUM BIG WHITE",
    format: "cut",
    family: "dendrobium",
    color: "White Tone",
    description: "Fresh-cut orchid stems",
    order: { unit: "stems", stemSizes: STANDARD_CUT_STEM_SIZES },
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
  const colors = new Set(filterOrchids(format, family).map((item) => item.color));
  return Array.from(colors).sort((a, b) => a.localeCompare(b));
}

export function searchOrchids(
  products: OrchidProduct[],
  opts: { q?: string | null; color?: string | null },
): OrchidProduct[] {
  const query = opts.q?.trim().toLowerCase() ?? "";
  const color = opts.color?.trim().toLowerCase() ?? "";

  return products.filter((item) => {
    if (color && item.color.toLowerCase() !== color) return false;
    if (!query) return true;
    const haystack = [item.name, item.category, item.number, item.color, item.descriptor]
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
