import { orchids, type ProductFormat } from "../data/orchids";

export const INQUIRY_STORAGE_KEY = "origin-blooms:inquiry-v2";

export type InquiryItem = {
  /** Stable key for merge: slug + optionKey */
  id: string;
  slug: string;
  name: string;
  image: string;
  format: ProductFormat;
  category: string;
  /** Display label for size / pack (e.g. "SS · 35–40 cm") */
  optionLabel: string;
  /** Internal key used to merge matching lines */
  optionKey: string;
  sizeId?: string;
  sizeLabel?: string;
  lengthRange?: string;
  quantity: number;
  unit: string;
};

export type InquiryDraft = {
  stemSizeId?: string;
  packOptionId?: string;
  quantity: number;
};

export type InquiryProductGroup = {
  slug: string;
  name: string;
  image: string;
  category: string;
  format: ProductFormat;
  lines: InquiryItem[];
  /** Sum of stem quantities in this product group (0 if no stem lines) */
  stemTotal: number;
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

function sizeOptionLabel(sizeLabel: string, lengthRange: string) {
  return `${sizeLabel} · ${lengthRange}`;
}

export function buildInquiryItem(
  slug: string,
  draft: InquiryDraft,
): InquiryItem | null {
  const product = orchids.find((item) => item.slug === slug);
  if (!product?.order?.unit) return null;
  if (!isPositiveInt(draft.quantity)) return null;

  let optionKey = "default";
  let optionLabel = "";
  let sizeId: string | undefined;
  let sizeLabel: string | undefined;
  let lengthRange: string | undefined;

  const stemSizes = product.order.stemSizes ?? [];
  if (stemSizes.length > 0) {
    const size = stemSizes.find((item) => item.id === draft.stemSizeId);
    if (!size) return null;
    optionKey = sizeOptionKey(size.id);
    optionLabel = sizeOptionLabel(size.label, size.lengthRange);
    sizeId = size.id;
    sizeLabel = size.label;
    lengthRange = size.lengthRange;
  } else if (product.format === "loose" && product.order.packOptions?.length) {
    const pack = product.order.packOptions.find((item) => item.id === draft.packOptionId);
    if (!pack) return null;
    optionKey = `pack:${pack.id}`;
    optionLabel = pack.label;
  }

  return {
    id: inquiryLineId(product.slug, optionKey),
    slug: product.slug,
    name: product.name,
    image: product.image,
    format: product.format,
    category: product.category,
    optionLabel,
    optionKey,
    sizeId,
    sizeLabel,
    lengthRange,
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

  const items: InquiryItem[] = [];
  for (const size of stemSizes) {
    const quantity = quantities[size.id] ?? 0;
    if (!isPositiveInt(quantity)) continue;
    const built = buildInquiryItem(slug, { stemSizeId: size.id, quantity });
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

  const optionKey = typeof value.optionKey === "string" ? value.optionKey : "default";
  let optionLabel = typeof value.optionLabel === "string" ? value.optionLabel : "";
  let sizeId = typeof value.sizeId === "string" ? value.sizeId : undefined;
  let sizeLabel = typeof value.sizeLabel === "string" ? value.sizeLabel : undefined;
  let lengthRange = typeof value.lengthRange === "string" ? value.lengthRange : undefined;

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
  }

  const unit =
    typeof value.unit === "string" && value.unit.trim()
      ? value.unit
      : product.order?.unit ?? "";
  if (!unit) return null;

  return {
    id: typeof value.id === "string" ? value.id : inquiryLineId(slug, optionKey),
    slug,
    name: product.name,
    image: product.image,
    format: product.format,
    category: product.category,
    optionLabel,
    optionKey,
    sizeId,
    sizeLabel,
    lengthRange,
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
  if (item.sizeLabel && item.lengthRange) {
    return `${item.name} — ${item.sizeLabel} (${item.lengthRange}): ${item.quantity} ${item.unit}`;
  }
  const option = item.optionLabel ? ` — ${item.optionLabel}` : "";
  return `${item.name}${option}: ${item.quantity} ${item.unit}`;
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
        format: item.format,
        lines: [],
        stemTotal: 0,
      };
      map.set(item.slug, group);
      order.push(item.slug);
    }
    group.lines.push(item);
    if (item.unit === "stems") {
      group.stemTotal += item.quantity;
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
  interestedIn: "Cut Orchids" | "Loose Blooms" | "Both" | "";
} {
  if (items.length === 0) {
    return { message: "", quantity: "", interestedIn: "" };
  }

  const groups = groupInquiryByProduct(items);
  const lines: string[] = [];
  for (const group of groups) {
    lines.push(`${group.name}:`);
    for (const item of group.lines) {
      if (item.sizeLabel && item.lengthRange) {
        lines.push(
          `  - ${item.sizeLabel} (${item.lengthRange}): ${item.quantity} ${item.unit}`,
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
  }

  const stems = totalStems(items);
  if (stems > 0) {
    lines.push("", `Total stems: ${stems}`);
  }

  const hasCut = items.some((item) => item.format === "cut");
  const hasLoose = items.some((item) => item.format === "loose");
  const interestedIn =
    hasCut && hasLoose ? "Both" : hasLoose ? "Loose Blooms" : "Cut Orchids";

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

    const optionKey =
      typeof value.optionKey === "string" && value.optionKey.trim()
        ? value.optionKey.trim()
        : "default";

    let optionLabel = "";
    let sizeId: string | undefined;
    let sizeLabel: string | undefined;
    let lengthRange: string | undefined;

    const stemSizes = product.order.stemSizes ?? [];
    const packOptions = product.order.packOptions ?? [];

    if (stemSizes.length > 0) {
      if (!optionKey.startsWith("size:")) return null;
      const id = optionKey.slice(5);
      const size = stemSizes.find((item) => item.id === id);
      if (!size) return null;
      sizeId = size.id;
      sizeLabel = size.label;
      lengthRange = size.lengthRange;
      optionLabel = sizeOptionLabel(size.label, size.lengthRange);
    } else if (packOptions.length > 0) {
      if (!optionKey.startsWith("pack:")) return null;
      const id = optionKey.slice(5);
      const pack = packOptions.find((item) => item.id === id);
      if (!pack) return null;
      optionLabel = pack.label;
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
      optionLabel,
      optionKey,
      sizeId,
      sizeLabel,
      lengthRange,
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
