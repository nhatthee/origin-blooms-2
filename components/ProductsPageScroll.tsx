"use client";

import { useEffect } from "react";
import { scrollToProductCatalog, SHOW_SITE_CHROME_EVENT } from "./ProductsNavLink";
import { useLocationSearch } from "./useLocationSearch";

/**
 * Align products page scroll after mount and whenever catalog query changes.
 * Legacy `/products#product-catalog` still scrolls to the catalog block;
 * plain category soft-nav returns to the top so Announcement, Header, and Hero stay in view.
 * Uses location-aware search so scroll tracks the destination URL in the same beat as the catalog.
 */
export function ProductsPageScroll() {
  const searchParams = useLocationSearch();
  const queryKey = searchParams.toString();

  useEffect(() => {
    const align = () => {
      if (window.location.hash === "#product-catalog") {
        requestAnimationFrame(() => {
          scrollToProductCatalog("auto");
        });
        return;
      }
      if (!window.location.hash) {
        window.dispatchEvent(new Event(SHOW_SITE_CHROME_EVENT));
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    };

    align();
    window.addEventListener("hashchange", align);
    return () => window.removeEventListener("hashchange", align);
  }, [queryKey]);

  return null;
}
