/**
 * Recently viewed product slugs (localStorage only).
 * Identity is always `OrchidProduct.slug` — never invent IDs or couple to Inquiry.
 */

export const RECENTLY_VIEWED_STORAGE_KEY = "origin-blooms:recently-viewed";

/** Keep enough history so the current product can be excluded and still show 6. */
const MAX_STORED = 12;
export const RECENTLY_VIEWED_MAX_DISPLAY = 6;

function isSlugString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Parse a stored payload into unique slugs (most-recent first). */
export function parseStoredRecentlyViewed(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const slugs: string[] = [];
    for (const entry of parsed) {
      if (!isSlugString(entry)) continue;
      const slug = entry.trim();
      if (seen.has(slug)) continue;
      seen.add(slug);
      slugs.push(slug);
      if (slugs.length >= MAX_STORED) break;
    }
    return slugs;
  } catch {
    return [];
  }
}

export function readRecentlyViewedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return parseStoredRecentlyViewed(
      window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY),
    );
  } catch {
    return [];
  }
}

export function writeRecentlyViewedSlugs(slugs: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const unique: string[] = [];
    const seen = new Set<string>();
    for (const slug of slugs) {
      if (!isSlugString(slug)) continue;
      const next = slug.trim();
      if (seen.has(next)) continue;
      seen.add(next);
      unique.push(next);
      if (unique.length >= MAX_STORED) break;
    }
    window.localStorage.setItem(
      RECENTLY_VIEWED_STORAGE_KEY,
      JSON.stringify(unique),
    );
  } catch {
    // Quota / private mode — ignore; page still works without history.
  }
}

/** Move `slug` to the front (most recent). Dedupes and truncates. */
export function recordRecentlyViewedSlug(slug: string): string[] {
  if (!isSlugString(slug)) return readRecentlyViewedSlugs();
  const current = slug.trim();
  const previous = readRecentlyViewedSlugs().filter((item) => item !== current);
  const next = [current, ...previous].slice(0, MAX_STORED);
  writeRecentlyViewedSlugs(next);
  return next;
}
