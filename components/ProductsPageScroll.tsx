"use client";

import { useEffect } from "react";
import { scrollToProductCatalog } from "./ProductsNavLink";

/** Scrolls to the product grid below the fixed chrome on /products. */
export function ProductsPageScroll() {
  useEffect(() => {
    const align = () => {
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
