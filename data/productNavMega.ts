import {
  productsHref,
  type ProductFamily,
  type ProductFormat,
} from "./orchids";

export type ProductNavMegaItem =
  | {
      kind: "cut-family";
      id: ProductFamily;
      label: string;
      /** Category banner in public/; null when no matching asset exists. */
      imageSrc: string | null;
      /** Intrinsic Next.js Image size when not using fill defaults. */
      imageWidth?: number;
      imageHeight?: number;
      imageFit?: "cover" | "contain";
    }
  | {
      kind: "format";
      id: ProductFormat;
      label: string;
      imageSrc: string | null;
      imageWidth?: number;
      imageHeight?: number;
      imageFit?: "cover" | "contain";
    };

/** Desktop Products mega menu — order matches design reference (7 tiles, 4-column grid). */
export const PRODUCT_NAV_MEGA_ITEMS: ProductNavMegaItem[] = [
  {
    kind: "cut-family",
    id: "dendrobium",
    label: "Dendrobium",
    imageSrc: "/images/products/dendrobium/dendrobium-mega-menu.png",
  },
  {
    kind: "cut-family",
    id: "mokara-aranda",
    label: "Mokara",
    imageSrc: "/images/products/mokara/mokara-mega-menu.png",
  },
  {
    kind: "cut-family",
    id: "vanda",
    label: "Vanda",
    imageSrc: "/images/products/vanda/vanda-mega-menu.png",
  },
  {
    kind: "cut-family",
    id: "oncidium",
    label: "Oncidium",
    imageSrc: "/images/products/oncidium/oncidium-mega-menu.png",
  },
  {
    kind: "cut-family",
    id: "dyed",
    label: "Dyed Orchids",
    // Real folder is dyed-orchid (not dye-orchid from brief).
    imageSrc: "/images/products/dyed-orchid/dyed-orchid-mega-menu.png",
  },
  {
    kind: "format",
    id: "bouquet",
    label: "Bouquets",
    imageSrc: "/images/products/bouquet/bouquet-1.png",
  },
  {
    kind: "format",
    id: "loose",
    label: "Loose Blooms",
    imageSrc: "/images/products/loose-bloom-sonia.png",
  },
];

export function productNavMegaHref(item: ProductNavMegaItem): string {
  if (item.kind === "format") {
    return productsHref(item.id);
  }
  return productsHref("cut", item.id);
}

export function productNavMegaMissingImages(): string[] {
  return PRODUCT_NAV_MEGA_ITEMS.filter((item) => !item.imageSrc).map((item) => item.label);
}
