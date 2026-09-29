"use client";

import { useEffect } from "react";
import { scrollToProductCatalog } from "./ProductsNavLink";

/**
 * Only honors legacy `/products#product-catalog` deep links.
 * Plain `/products` (including the header Products link) stays at the top
 * so the intro eyebrow + headline stay visible under the fixed chrome.
 */
export function ProductsPageScroll() {
  useEffect(() => {
    const align = () => {
      if (window.location.hash !== "#product-catalog") {
        if (!window.location.hash) {
          window.scrollTo({ top: 0, behavior: "auto" });
        }
        return;
      }
      requestAnimationFrame(() => {
        scrollToProductCatalog("auto");
      });
    };

    align();
    window.addEventListener("hashchange", align);
    return () => window.removeEventListener("hashchange", align);
  }, []);

  return null;
}
