import {
  productsHref,
  type ProductFamily,
  type ProductFormat,
} from "./orchids";

/** Uppercase category titles for Hero / Mega banner HTML overlays. */
export const PRODUCT_CATEGORY_OVERLAY_TITLES = {
  dendrobium: "DENDROBIUM",
  "mokara-aranda": "MOKARA",
  vanda: "VANDA",
  oncidium: "ONCIDIUM",
  dyed: "DYED ORCHIDS",
  bouquet: "BOUQUETS",
  loose: "LOOSE BLOOMS",
} as const;

export type ProductCategoryOverlayId = keyof typeof PRODUCT_CATEGORY_OVERLAY_TITLES;

/** CSS modifier keys for per-category overlay colors (stable; not URL/slug). */
export const PRODUCT_CATEGORY_OVERLAY_TONE: Record<
  ProductCategoryOverlayId,
  string
> = {
  dendrobium: "dendrobium",
  "mokara-aranda": "mokara",
  vanda: "vanda",
  oncidium: "oncidium",
  dyed: "dyed",
  bouquet: "bouquet",
  loose: "loose",
};

export function productCategoryOverlayTitle(
  id: ProductCategoryOverlayId,
): string {
  return PRODUCT_CATEGORY_OVERLAY_TITLES[id];
}

export function productCategoryOverlayTone(
  id: ProductCategoryOverlayId,
): string {
  return PRODUCT_CATEGORY_OVERLAY_TONE[id];
}

export type ProductNavMegaItem =
  | {
      kind: "cut-family";
      id: ProductFamily;
      label: string;
      overlayTitle: string;
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
      overlayTitle: string;
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
    overlayTitle: PRODUCT_CATEGORY_OVERLAY_TITLES.dendrobium,
    imageSrc: "/images/products/dendrobium/dendrobium-mega-menu.png",
  },
  {
    kind: "cut-family",
    id: "mokara-aranda",
    label: "Mokara",
    overlayTitle: PRODUCT_CATEGORY_OVERLAY_TITLES["mokara-aranda"],
    imageSrc: "/images/products/mokara/mokara-mega-menu.png",
  },
  {
    kind: "cut-family",
    id: "vanda",
    label: "Vanda",
    overlayTitle: PRODUCT_CATEGORY_OVERLAY_TITLES.vanda,
    imageSrc: "/images/products/vanda/vanda-mega-menu.png",
  },
  {
    kind: "cut-family",
    id: "oncidium",
    label: "Oncidium",
    overlayTitle: PRODUCT_CATEGORY_OVERLAY_TITLES.oncidium,
    imageSrc: "/images/products/oncidium/oncidium-mega-menu.png",
  },
  {
    kind: "cut-family",
    id: "dyed",
    label: "Dyed Orchids",
    overlayTitle: PRODUCT_CATEGORY_OVERLAY_TITLES.dyed,
    imageSrc: "/images/products/dyed-orchids/dyed-orchid-mega-menu.png",
  },
  {
    kind: "format",
    id: "bouquet",
    label: "Bouquets",
    overlayTitle: PRODUCT_CATEGORY_OVERLAY_TITLES.bouquet,
    imageSrc: "/images/products/bouquet/bouquets-mega-menu.png",
  },
  {
    kind: "format",
    id: "loose",
    label: "Loose Blooms",
    overlayTitle: PRODUCT_CATEGORY_OVERLAY_TITLES.loose,
    imageSrc: "/images/products/loose-blooms/loose-blooms-mega-menu-v2.png",
  },
];

export function productNavMegaHref(item: ProductNavMegaItem): string {
  if (item.kind === "format") {
    return productsHref(item.id);
  }
  return productsHref("cut", item.id);
}

/** Resolve the mega-menu tile for the active products catalog category. */
export function productNavMegaItemForCatalog(
  format: ProductFormat,
  family: ProductFamily,
): ProductNavMegaItem | undefined {
  if (format === "bouquet" || format === "loose") {
    return PRODUCT_NAV_MEGA_ITEMS.find(
      (item) => item.kind === "format" && item.id === format,
    );
  }
  if (format === "cut") {
    return PRODUCT_NAV_MEGA_ITEMS.find(
      (item) => item.kind === "cut-family" && item.id === family,
    );
  }
  return undefined;
}

export function productNavMegaMissingImages(): string[] {
  return PRODUCT_NAV_MEGA_ITEMS.filter((item) => !item.imageSrc).map((item) => item.label);
}
