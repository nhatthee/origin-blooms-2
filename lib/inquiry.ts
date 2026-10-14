import {
  availableBouquetSizes,
  displayProductCode,
  getBouquetTrayRow,
  hasBouquetOptions,
  LOOSE_BLOOM_LEGACY_PACK_LABELS,
  LOOSE_BLOOM_PACK_BLOOMS,
  orchids,
  type ProductFormat,
} from "../data/orchids";

export const INQUIRY_STORAGE_KEY = "origin-blooms:inquiry-v2";

export type InquiryItem = {
  /** Stable key for merge: slug + optionKey */
  id: string;
  slug: string;
  name: string;
  image: string;
  format: ProductFormat;
  category: string;
  /**
   * Display-only product code (may be “Pending confirmation”).
   * For bouquet lines this is the option code (e.g. DBQ3).
   * Never used as a unique ID — identity is always slug + optionKey.
   */
  code: string;
  /** Display label for size / pack (e.g. "SS · 35–40 cm" or "DBQ3 · Size M") */
  optionLabel: string;
  /** Internal key used to merge matching lines */
  optionKey: string;
  sizeId?: string;
  sizeLabel?: string;
  lengthRange?: string;
  /** Catalog color id when the line includes a color selection */
  colorId?: string;
  /** Catalog color label (never trust a client-supplied name) */
  colorLabel?: string;
  quantity: number;
  unit: string;
};

export type InquiryDraft = {
  stemSizeId?: string;
  packOptionId?: string;
  /** Required for products that define colorOptions; use "custom" for free-text color */
  colorId?: string;
  /** Preferred color name or HEX when colorId is "custom" */
  customColor?: string;
  quantity: number;
};

/** Display when a legacy dried line has no color in optionKey */
export const INQUIRY_COLOR_UNSPECIFIED = "Not specified";

/** Catalog radio value + optionKey prefix for free-text custom colors */
export const CUSTOM_COLOR_OPTION_ID = "custom";
export const CUSTOM_COLOR_ID_PREFIX = "custom__";
export const CUSTOM_COLOR_MAX_LENGTH = 100;
export const CUSTOM_COLOR_EMPTY_ERROR =
  "Please enter your preferred color or HEX code.";
export const CUSTOM_COLOR_HEX_ERROR =
  "Enter a valid HEX color (#RGB or #RRGGBB).";

export type CustomColorNormalizeResult =
  | { ok: true; mergeKey: string; displayValue: string }
  | { ok: false; error: string };

/** Trim, validate, and canonicalize a custom color name or HEX. */
export function normalizeCustomColorInput(
  raw: string,
): CustomColorNormalizeResult {
  const trimmed = raw.trim().slice(0, CUSTOM_COLOR_MAX_LENGTH);
  if (!trimmed) {
    return { ok: false, error: CUSTOM_COLOR_EMPTY_ERROR };
  }

  if (trimmed.startsWith("#")) {
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
      return { ok: false, error: CUSTOM_COLOR_HEX_ERROR };
    }
    const hex =
      trimmed.length === 4
        ? `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`
        : trimmed;
    const displayValue = hex.toUpperCase();
    return { ok: true, mergeKey: displayValue, displayValue };
  }

  return { ok: true, mergeKey: trimmed, displayValue: trimmed };
}

export function isCustomColorId(colorId: string | undefined): boolean {
  return Boolean(colorId?.startsWith(CUSTOM_COLOR_ID_PREFIX));
}

export function encodeCustomColorId(mergeKey: string): string {
  return `${CUSTOM_COLOR_ID_PREFIX}${encodeURIComponent(mergeKey)}`;
}

export function decodeCustomColorId(colorId: string): string | null {
  if (!isCustomColorId(colorId)) return null;
  try {
    const decoded = decodeURIComponent(colorId.slice(CUSTOM_COLOR_ID_PREFIX.length));
    return decoded.trim() ? decoded : null;
  } catch {
    return null;
  }
}

export function customColorDisplayLabel(displayValue: string): string {
  return `Custom color: ${displayValue}`;
}

export type BouquetInquiryLineDraft = {
  code: string;
  sizeId: string;
  quantity: number;
};

export type InquiryProductGroup = {
  slug: string;
  name: string;
  image: string;
  category: string;
  code: string;
  format: ProductFormat;
  lines: InquiryItem[];
  /** Sum of stem quantities in this product group (0 if no stem lines) */
  stemTotal: number;
  /** Sum of blooms from loose pack lines (packs × blooms per pack) */
  bloomTotal: number;
};

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function inquiryLineId(slug: string, optionKey: string): string {
  return `${slug}::${optionKey || "default"}`;
}

function sizeOptionKey(sizeId: string) {
  return `size:${sizeId}`;
}

function sizeOptionLabel(sizeLabel: string, lengthRange: string | undefined) {
  const range = lengthRange?.trim();
  if (!range) return sizeLabel;
  return `${sizeLabel} · ${range}`;
}

export function bouquetOptionKey(code: string, sizeId: string): string {
  return `bouquet:${code}:size:${sizeId}`;
}

function parseBouquetOptionKey(
  optionKey: string,
): { code: string; sizeId: string } | null {
  const match = /^bouquet:([^:]+):size:([^:]+)$/.exec(optionKey);
  if (!match) return null;
  return { code: match[1], sizeId: match[2] };
}

function bouquetOptionLabel(code: string, sizeLabel: string): string {
  return `${code} · Size ${sizeLabel}`;
}

/** New colored pack lines: color:{colorId}:pack:{packId} */
export function colorPackOptionKey(colorId: string, packId: string): string {
  return `color:${colorId}:pack:${packId}`;
}

export function parseColorPackOptionKey(
  optionKey: string,
): { colorId: string; packId: string } | null {
  const match = /^color:([^:]+):pack:([^:]+)$/.exec(optionKey);
  if (!match) return null;
  return { colorId: match[1], packId: match[2] };
}

/** True when this line should show a Color row (including legacy unspecified). */
export function inquiryShowsColor(item: InquiryItem): boolean {
  return (
    item.format === "dried" ||
    Boolean(item.colorId) ||
    item.optionKey.startsWith("color:")
  );
}

export function inquiryColorDisplayLabel(item: InquiryItem): string {
  if (item.colorLabel?.trim()) return item.colorLabel.trim();
  if (isCustomColorId(item.colorId)) {
    const decoded = decodeCustomColorId(item.colorId!);
    if (decoded) return customColorDisplayLabel(decoded);
  }
  return INQUIRY_COLOR_UNSPECIFIED;
}

/** "Color: Orange" or "Custom color: #C66B4E" for list / email / review rows. */
export function inquiryColorLineLabel(item: InquiryItem): string {
  const label = inquiryColorDisplayLabel(item);
  if (isCustomColorId(item.colorId) || label.startsWith("Custom color:")) {
    return label;
  }
  return `Color: ${label}`;
}

/** Compact label for email / Excel: "Orange · 5 kg" or "Custom color: #C66B4E · 5 kg". */
export function inquiryColorAndPackLabel(item: InquiryItem): string {
  const pack = item.optionLabel?.trim() || "—";
  if (!inquiryShowsColor(item)) return pack;
  return `${inquiryColorDisplayLabel(item)} · ${pack}`;
}

export function buildInquiryItem(
  slug: string,
  draft: InquiryDraft,
): InquiryItem | null {
  const product = orchids.find((item) => item.slug === slug);
  if (!product?.order?.unit) return null;
  // Bouquet uses code + size lines via buildInquiryItemsForBouquetOptions only.
  if (hasBouquetOptions(product)) return null;
  if (!isPositiveInt(draft.quantity)) return null;

  let optionKey = "default";
  let optionLabel = "";
  let sizeId: string | undefined;
  let sizeLabel: string | undefined;
  let lengthRange: string | undefined;
  let colorId: string | undefined;
  let colorLabel: string | undefined;

  const stemSizes = product.order.stemSizes ?? [];
  const colorOptions = product.colorOptions ?? [];
  if (stemSizes.length > 0) {
    const size = stemSizes.find((item) => item.id === draft.stemSizeId);
    if (!size) return null;
    optionKey = sizeOptionKey(size.id);
    optionLabel = sizeOptionLabel(size.label, size.lengthRange);
    sizeId = size.id;
    sizeLabel = size.label;
    lengthRange = size.lengthRange;
  } else if (product.order.packOptions?.length) {
    const pack = product.order.packOptions.find((item) => item.id === draft.packOptionId);
    if (!pack) return null;
    optionLabel = pack.label;
    if (colorOptions.length > 0) {
      if (draft.colorId === CUSTOM_COLOR_OPTION_ID) {
        const normalized = normalizeCustomColorInput(draft.customColor ?? "");
        if (!normalized.ok) return null;
        colorId = encodeCustomColorId(normalized.mergeKey);
        colorLabel = customColorDisplayLabel(normalized.displayValue);
        optionKey = colorPackOptionKey(colorId, pack.id);
      } else {
        const color = colorOptions.find((item) => item.id === draft.colorId);
        if (!color) return null;
        colorId = color.id;
        colorLabel = color.label;
        optionKey = colorPackOptionKey(color.id, pack.id);
      }
    } else {
      optionKey = `pack:${pack.id}`;
    }
  }

  return {
    id: inquiryLineId(product.slug, optionKey),
    slug: product.slug,
    name: product.name,
    image: product.image,
    format: product.format,
    category: product.category,
    code: displayProductCode(product),
    optionLabel,
    optionKey,
    sizeId,
    sizeLabel,
    lengthRange,
    colorId,
    colorLabel,
    quantity: draft.quantity,
    unit: product.order.unit,
  };
}

/** Build inquiry lines for every stem size with quantity > 0. */
export function buildInquiryItemsForStemSizes(
  slug: string,
  quantities: Record<string, number>,
): InquiryItem[] | null {
  const product = orchids.find((item) => item.slug === slug);
  const stemSizes = product?.order?.stemSizes ?? [];
  if (!product || stemSizes.length === 0) return null;
  if (hasBouquetOptions(product)) return null;

  const items: InquiryItem[] = [];
  for (const size of stemSizes) {
    const quantity = quantities[size.id] ?? 0;
    if (!isPositiveInt(quantity)) continue;
    const built = buildInquiryItem(slug, { stemSizeId: size.id, quantity });
    if (built) items.push(built);
  }
  return items.length > 0 ? items : null;
}

/**
 * Build inquiry lines for bouquet option codes × sizes with quantity > 0.
 * Same code + size drafts are merged before insert; identity is slug + optionKey.
 */
export function buildInquiryItemsForBouquetOptions(
  slug: string,
  lines: BouquetInquiryLineDraft[],
): InquiryItem[] | null {
  const product = orchids.find((item) => item.slug === slug);
  if (!product?.order?.unit || !hasBouquetOptions(product)) return null;

  const merged = new Map<string, number>();
  for (const line of lines) {
    if (!isPositiveInt(line.quantity)) continue;
    const code = line.code.trim();
    const sizeId = line.sizeId.trim();
    if (!code || !sizeId) continue;
    const key = `${code}::${sizeId}`;
    merged.set(key, (merged.get(key) ?? 0) + line.quantity);
  }
  if (merged.size === 0) return null;

  const items: InquiryItem[] = [];
  for (const [key, quantity] of merged) {
    const [code, sizeId] = key.split("::");
    const option = product.bouquetOptions!.find((item) => item.code === code);
    if (!option) return null;
    const sizes = availableBouquetSizes(getBouquetTrayRow(product, code));
    const size = sizes.find((item) => item.id === sizeId);
    if (!size) return null;

    const optionKey = bouquetOptionKey(code, sizeId);
    items.push({
      id: inquiryLineId(product.slug, optionKey),
      slug: product.slug,
      name: product.name,
      image: product.image,
      format: product.format,
      category: product.category,
      code: option.code,
      optionLabel: bouquetOptionLabel(option.code, size.label),
      optionKey,
      sizeId: size.id,
      sizeLabel: size.label,
      quantity,
      unit: product.order.unit,
    });
  }

  return items.length > 0 ? items : null;
}

/**
 * Build inquiry lines for every Loose Bloom pack size with quantity > 0.
 * Quantity is packs; blooms total is derived for display/summary.
 */
export function buildInquiryItemsForLoosePacks(
  slug: string,
  quantities: Record<string, number>,
): InquiryItem[] | null {
  const product = orchids.find((item) => item.slug === slug);
  const packOptions = product?.order?.packOptions ?? [];
  if (!product || product.format !== "loose" || packOptions.length === 0) return null;

  const items: InquiryItem[] = [];
  for (const pack of packOptions) {
    const quantity = quantities[pack.id] ?? 0;
    if (!isPositiveInt(quantity)) continue;
    const built = buildInquiryItem(slug, { packOptionId: pack.id, quantity });
    if (built) items.push(built);
  }
  return items.length > 0 ? items : null;
}

export function mergeInquiryItems(
  existing: InquiryItem[],
  next: InquiryItem,
): InquiryItem[] {
  const index = existing.findIndex((item) => item.id === next.id);
  if (index === -1) return [...existing, next];
  const copy = [...existing];
  copy[index] = {
    ...copy[index],
    quantity: copy[index].quantity + next.quantity,
  };
  return copy;
}

export function mergeManyInquiryItems(
  existing: InquiryItem[],
  nextItems: InquiryItem[],
): InquiryItem[] {
  return nextItems.reduce((acc, item) => mergeInquiryItems(acc, item), existing);
}

export function updateInquiryQuantity(
  items: InquiryItem[],
  id: string,
  quantity: number,
): InquiryItem[] {
  if (!isPositiveInt(quantity)) {
    return items.filter((item) => item.id !== id);
  }
  return items.map((item) => (item.id === id ? { ...item, quantity } : item));
}

export function removeInquiryItem(items: InquiryItem[], id: string): InquiryItem[] {
  return items.filter((item) => item.id !== id);
}

export function parseStoredInquiry(raw: string | null): InquiryItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => normalizeStoredItem(entry))
      .filter((item): item is InquiryItem => item !== null);
  } catch {
    return [];
  }
}

function normalizeStoredItem(entry: unknown): InquiryItem | null {
  if (!entry || typeof entry !== "object") return null;
  const value = entry as Record<string, unknown>;
  const slug = typeof value.slug === "string" ? value.slug : "";
  const product = orchids.find((item) => item.slug === slug);
  if (!product) return null;
  if (!isPositiveInt(value.quantity)) return null;

  let optionKey = typeof value.optionKey === "string" ? value.optionKey : "default";
  let optionLabel = typeof value.optionLabel === "string" ? value.optionLabel : "";
  let sizeId = typeof value.sizeId === "string" ? value.sizeId : undefined;
  let sizeLabel = typeof value.sizeLabel === "string" ? value.sizeLabel : undefined;
  let lengthRange = typeof value.lengthRange === "string" ? value.lengthRange : undefined;
  let colorId: string | undefined;
  let colorLabel: string | undefined;
  let code = displayProductCode(product);
  const colorOptions = product.colorOptions ?? [];

  // Rehydrate size fields from product data when possible.
  if (optionKey.startsWith("size:")) {
    const id = optionKey.slice(5);
    const size = product.order?.stemSizes?.find((item) => item.id === id);
    if (size) {
      sizeId = size.id;
      sizeLabel = size.label;
      lengthRange = size.lengthRange;
      optionLabel = sizeOptionLabel(size.label, size.lengthRange);
    }
  } else if (optionKey.startsWith("bouquet:")) {
    const parsed = parseBouquetOptionKey(optionKey);
    if (!parsed || !hasBouquetOptions(product)) return null;
    const option = product.bouquetOptions!.find((item) => item.code === parsed.code);
    const size = availableBouquetSizes(getBouquetTrayRow(product, parsed.code)).find(
      (item) => item.id === parsed.sizeId,
    );
    if (!option || !size) return null;
    code = option.code;
    sizeId = size.id;
    sizeLabel = size.label;
    lengthRange = undefined;
    optionLabel = bouquetOptionLabel(option.code, size.label);
  } else if (optionKey.startsWith("color:")) {
    const parsed = parseColorPackOptionKey(optionKey);
    if (!parsed) return null;
    const pack = product.order?.packOptions?.find((item) => item.id === parsed.packId);
    if (!pack) return null;
    optionLabel = pack.label;
    if (isCustomColorId(parsed.colorId)) {
      const decoded = decodeCustomColorId(parsed.colorId);
      if (!decoded) return null;
      const normalized = normalizeCustomColorInput(decoded);
      if (!normalized.ok) return null;
      colorId = encodeCustomColorId(normalized.mergeKey);
      colorLabel = customColorDisplayLabel(normalized.displayValue);
      optionKey = colorPackOptionKey(colorId, pack.id);
    } else {
      const color = colorOptions.find((item) => item.id === parsed.colorId);
      if (!color) return null;
      colorId = color.id;
      colorLabel = color.label;
    }
  } else if (optionKey.startsWith("pack:")) {
    // Legacy pack-only lines (including dried without color) — do not invent a color.
    const id = optionKey.slice(5);
    const pack = product.order?.packOptions?.find((item) => item.id === id);
    if (pack) {
      optionLabel = pack.label;
    } else if (id in LOOSE_BLOOM_PACK_BLOOMS) {
      // Keep retired pack sizes from stored inquiries; never drop or convert qty.
      if (!optionLabel.trim()) {
        optionLabel = LOOSE_BLOOM_LEGACY_PACK_LABELS[id] ?? `${id} Blooms`;
      }
    }
  }

  const unit =
    typeof value.unit === "string" && value.unit.trim()
      ? value.unit
      : product.order?.unit ?? "";
  if (!unit) return null;

  return {
    id: inquiryLineId(slug, optionKey),
    slug,
    name: product.name,
    image: product.image,
    format: product.format,
    category: product.category,
    code,
    optionLabel,
    optionKey,
    sizeId,
    sizeLabel,
    lengthRange,
    colorId,
    colorLabel,
    quantity: value.quantity,
    unit,
  };
}

export function readInquiryFromStorage(): InquiryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return parseStoredInquiry(window.localStorage.getItem(INQUIRY_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function writeInquiryToStorage(items: InquiryItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(INQUIRY_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota / private mode — ignore; UI still works for the session.
  }
}

export function formatInquiryLine(item: InquiryItem): string {
  const codePart = item.code ? ` [${item.code}]` : "";
  if (item.format === "bouquet" && item.sizeLabel) {
    return `${item.name}${codePart} — Size ${item.sizeLabel}: ${item.quantity} ${item.unit}`;
  }
  if (item.sizeLabel && item.lengthRange) {
    return `${item.name}${codePart} — ${item.sizeLabel} (${item.lengthRange}): ${item.quantity} ${item.unit}`;
  }
  if (inquiryShowsColor(item)) {
    const pack = item.optionLabel?.trim() || "—";
    return `${item.name}${codePart} — ${inquiryColorLineLabel(item)}; Bunch size: ${pack}: ${item.quantity} ${item.unit}`;
  }
  const option = item.optionLabel ? ` — ${item.optionLabel}` : "";
  return `${item.name}${codePart}${option}: ${item.quantity} ${item.unit}`;
}

export function groupInquiryByProduct(items: InquiryItem[]): InquiryProductGroup[] {
  const order: string[] = [];
  const map = new Map<string, InquiryProductGroup>();

  for (const item of items) {
    let group = map.get(item.slug);
    if (!group) {
      group = {
        slug: item.slug,
        name: item.name,
        image: item.image,
        category: item.category,
        code: item.code,
        format: item.format,
        lines: [],
        stemTotal: 0,
        bloomTotal: 0,
      };
      map.set(item.slug, group);
      order.push(item.slug);
    }
    group.lines.push(item);
    if (item.unit === "stems") {
      group.stemTotal += item.quantity;
    }
    if (item.format === "loose" && item.optionKey.startsWith("pack:")) {
      const packId = item.optionKey.slice(5);
      const bloomsPerPack = LOOSE_BLOOM_PACK_BLOOMS[packId] ?? 0;
      group.bloomTotal += bloomsPerPack * item.quantity;
    }
  }

  return order.map((slug) => map.get(slug)!);
}

/** Distinct products in the inquiry (sizes of the same slug count as one). */
export function uniqueProductCount(items: InquiryItem[]): number {
  return groupInquiryByProduct(items).length;
}

export function totalStems(items: InquiryItem[]): number {
  return items
    .filter((item) => item.unit === "stems")
    .reduce((sum, item) => sum + item.quantity, 0);
}

export function formatInquirySummary(items: InquiryItem[]): {
  message: string;
  quantity: string;
  interestedIn:
    | "Cut Orchids"
    | "Loose Blooms"
    | "Bouquets"
    | "Dried Decorative Branches"
    | "All Products"
    | "";
} {
  if (items.length === 0) {
    return { message: "", quantity: "", interestedIn: "" };
  }

  const groups = groupInquiryByProduct(items);
  const lines: string[] = [];
  for (const group of groups) {
    const codeNote =
      group.format === "bouquet" || !group.code ? "" : ` [${group.code}]`;
    lines.push(`${group.name}${codeNote}:`);
    for (const item of group.lines) {
      if (item.format === "bouquet" && item.sizeLabel) {
        lines.push(
          `  - ${item.code} · Size ${item.sizeLabel}: ${item.quantity} ${item.unit}`,
        );
      } else if (item.sizeLabel && item.lengthRange) {
        lines.push(
          `  - ${item.sizeLabel} (${item.lengthRange}): ${item.quantity} ${item.unit}`,
        );
      } else if (inquiryShowsColor(item)) {
        lines.push(
          `  - ${inquiryColorLineLabel(item)}; Bunch size: ${item.optionLabel || "—"}: ${item.quantity} ${item.unit}`,
        );
      } else if (item.optionLabel) {
        lines.push(`  - ${item.optionLabel}: ${item.quantity} ${item.unit}`);
      } else {
        lines.push(`  - ${item.quantity} ${item.unit}`);
      }
    }
    if (group.stemTotal > 0) {
      lines.push(`  Subtotal: ${group.stemTotal} stems`);
    }
    if (group.bloomTotal > 0) {
      lines.push(`  Total Blooms: ${group.bloomTotal.toLocaleString("en-US")}`);
    }
  }

  const stems = totalStems(items);
  if (stems > 0) {
    lines.push("", `Total stems: ${stems}`);
  }

  const hasCut = items.some((item) => item.format === "cut");
  const hasLoose = items.some((item) => item.format === "loose");
  const hasBouquet = items.some((item) => item.format === "bouquet");
  const hasDried = items.some((item) => item.format === "dried");
  const classicCount = Number(hasCut) + Number(hasLoose) + Number(hasBouquet);
  const singleFormatCount = classicCount + Number(hasDried);
  const interestedIn =
    classicCount === 3
      ? "All Products"
      : singleFormatCount === 1
        ? hasCut
          ? "Cut Orchids"
          : hasLoose
            ? "Loose Blooms"
            : hasBouquet
              ? "Bouquets"
              : "Dried Decorative Branches"
        : "";

  const quantityParts = [
    ...totalsByUnit(items).map((row) => `${row.total} ${row.unit}`),
  ];

  const message = [
    "Inquiry list request:",
    ...lines,
    "",
    "Please confirm availability, packing, and pricing.",
  ].join("\n");

  return {
    message,
    quantity: quantityParts.join("; "),
    interestedIn,
  };
}

/** Totals grouped by unit — never merge different units into one number. */
export function totalsByUnit(items: InquiryItem[]): { unit: string; total: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const unit = item.unit.trim();
    if (!unit) continue;
    map.set(unit, (map.get(unit) ?? 0) + item.quantity);
  }
  return Array.from(map.entries())
    .map(([unit, total]) => ({ unit, total }))
    .sort((a, b) => a.unit.localeCompare(b.unit));
}

export function parsePositiveIntInput(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const num = Number(trimmed);
  return isPositiveInt(num) ? num : null;
}

/** Allows 0 (unselected size / remove line). */
export function parseNonNegativeIntInput(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const num = Number(trimmed);
  return isNonNegativeInt(num) ? num : null;
}

/**
 * Rebuild inquiry lines from a client-submitted payload against catalog data.
 * Rejects unknown products, sizes, packs, or mismatched units.
 */
export function sanitizeInquirySubmission(raw: unknown): InquiryItem[] | null {
  if (!Array.isArray(raw)) return null;

  const items: InquiryItem[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const value = entry as Record<string, unknown>;
    const slug = typeof value.slug === "string" ? value.slug.trim() : "";
    const product = orchids.find((item) => item.slug === slug);
    if (!product?.order?.unit) return null;

    const quantity =
      typeof value.quantity === "number"
        ? value.quantity
        : typeof value.quantity === "string"
          ? Number(value.quantity)
          : NaN;
    if (!isPositiveInt(quantity)) return null;

    let optionKey =
      typeof value.optionKey === "string" && value.optionKey.trim()
        ? value.optionKey.trim()
        : "default";

    let optionLabel = "";
    let sizeId: string | undefined;
    let sizeLabel: string | undefined;
    let lengthRange: string | undefined;
    let colorId: string | undefined;
    let colorLabel: string | undefined;
    let code = displayProductCode(product);

    const stemSizes = product.order.stemSizes ?? [];
    const packOptions = product.order.packOptions ?? [];
    const colorOptions = product.colorOptions ?? [];

    if (hasBouquetOptions(product)) {
      const parsed = parseBouquetOptionKey(optionKey);
      if (!parsed) return null;
      const option = product.bouquetOptions!.find((item) => item.code === parsed.code);
      const size = availableBouquetSizes(getBouquetTrayRow(product, parsed.code)).find(
        (item) => item.id === parsed.sizeId,
      );
      if (!option || !size) return null;
      code = option.code;
      sizeId = size.id;
      sizeLabel = size.label;
      optionLabel = bouquetOptionLabel(option.code, size.label);
    } else if (stemSizes.length > 0) {
      if (!optionKey.startsWith("size:")) return null;
      const id = optionKey.slice(5);
      const size = stemSizes.find((item) => item.id === id);
      if (!size) return null;
      sizeId = size.id;
      sizeLabel = size.label;
      lengthRange = size.lengthRange;
      optionLabel = sizeOptionLabel(size.label, size.lengthRange);
    } else if (product.format === "loose" || packOptions.length > 0) {
      const colored = parseColorPackOptionKey(optionKey);
      if (colored) {
        const pack = packOptions.find((item) => item.id === colored.packId);
        if (!pack) return null;
        optionLabel = pack.label;
        if (isCustomColorId(colored.colorId)) {
          // Decode + re-validate custom text from optionKey only — never trust client labels.
          const decoded = decodeCustomColorId(colored.colorId);
          if (!decoded) return null;
          const normalized = normalizeCustomColorInput(decoded);
          if (!normalized.ok) return null;
          colorId = encodeCustomColorId(normalized.mergeKey);
          colorLabel = customColorDisplayLabel(normalized.displayValue);
          optionKey = colorPackOptionKey(colorId, pack.id);
        } else {
          // Resolve standard color from catalog only.
          const color = colorOptions.find((item) => item.id === colored.colorId);
          if (!color) return null;
          colorId = color.id;
          colorLabel = color.label;
        }
      } else if (optionKey.startsWith("pack:")) {
        // Legacy pack-only lines (including dried without color). Do not invent color.
        const id = optionKey.slice(5);
        const pack = packOptions.find((item) => item.id === id);
        if (pack) {
          optionLabel = pack.label;
        } else if (id in LOOSE_BLOOM_PACK_BLOOMS) {
          // Allow legacy loose pack lines still present in the submitted inquiry list.
          const storedLabel =
            typeof value.optionLabel === "string" ? value.optionLabel.trim() : "";
          optionLabel =
            storedLabel || LOOSE_BLOOM_LEGACY_PACK_LABELS[id] || `${id} Blooms`;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else if (optionKey !== "default") {
      return null;
    }

    // Always use the catalog unit — never trust a client-supplied unit.
    const unit = product.order.unit;
    if (typeof value.unit === "string" && value.unit.trim() && value.unit.trim() !== unit) {
      return null;
    }

    items.push({
      id: inquiryLineId(product.slug, optionKey),
      slug: product.slug,
      name: product.name,
      image: product.image,
      format: product.format,
      category: product.category,
      code,
      optionLabel,
      optionKey,
      sizeId,
      sizeLabel,
      lengthRange,
      colorId,
      colorLabel,
      quantity,
      unit,
    });
  }

  return items;
}

export function parseInquiryItemsFormField(raw: FormDataEntryValue | null): {
  ok: true;
  items: InquiryItem[];
} | {
  ok: false;
  error: string;
} {
  if (raw == null || raw === "") {
    return { ok: true, items: [] };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: "Inquiry list payload was invalid. Please try again." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, error: "Inquiry list payload was invalid. Please try again." };
  }

  const items = sanitizeInquirySubmission(parsed);
  if (items === null) {
    return {
      ok: false,
      error:
        "One or more inquiry items could not be verified. Please review your list and try again.",
    };
  }

  return { ok: true, items };
}
