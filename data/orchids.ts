export type OrchidProduct = {
  number: string;
  name: string;
  descriptor: string;
  tagline?: string;
  imageClass: string;
  image: string;
  category: string;
  format: ProductFormat;
  family: ProductFamily;
};

export type ProductFormat = "cut" | "loose";

export type ProductFamily =
  | "dendrobium"
  | "mokara-aranda"
  | "vanda"
  | "oncidium"
  | "dyed";

/** @deprecated Use ProductFormat */
export type ProductFilter = ProductFormat;

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

export const orchids: OrchidProduct[] = [
  {
    number: "01",
    name: "Sonia Purple",
    descriptor: "Fresh-cut orchid stems",
    tagline: "PURPLE FOR IMPACT",
    imageClass: "sonia-image",
    image: "/images/products/sonia-purple.png",
    category: "DENDROBIUM SONIA",
    format: "cut",
    family: "dendrobium",
  },
  {
    number: "02",
    name: "Big White",
    descriptor: "Fresh-cut orchid stems",
    tagline: "WHITE FOR BALANCE",
    imageClass: "white-image",
    image: "/images/products/big-white.png",
    category: "DENDROBIUM BIG WHITE",
    format: "cut",
    family: "dendrobium",
  },
  {
    number: "03",
    name: "Loose Blooms",
    descriptor: "Individual purple orchid for garnish",
    imageClass: "loose-image",
    image: "/images/products/loose-bloom-sonia.png",
    category: "DENDROBIUM SONIA",
    format: "loose",
    family: "dendrobium",
  },
  {
    number: "04",
    name: "Loose Blooms",
    descriptor: "Individual white orchids for garnish",
    imageClass: "new-collection-image",
    image: "/images/products/loose-bloom-white.png",
    category: "DENDROBIUM BIG WHITE",
    format: "loose",
    family: "dendrobium",
  },
];

export function normalizeProductFormat(value: string | null | undefined): ProductFormat {
  return value === "loose" ? "loose" : "cut";
}

export function normalizeProductFamily(value: string | null | undefined): ProductFamily {
  const match = PRODUCT_FAMILIES.find((item) => item.id === value);
  return match ? match.id : "dendrobium";
}

export function productsHref(format: ProductFormat, family: ProductFamily = "dendrobium") {
  const params = new URLSearchParams();
  params.set("format", format);
  if (family !== "dendrobium") params.set("category", family);
  return `/products?${params.toString()}`;
}

export function filterOrchids(
  format: ProductFormat,
  family: ProductFamily = "dendrobium",
): OrchidProduct[] {
  return orchids.filter((item) => item.format === format && item.family === family);
}
