"use client";

import { useEffect } from "react";
import { scrollToProducts } from "./ProductsNavLink";

/** Aligns hash navigation to #products with sticky-header-aware offset. */
export function ProductsHashScroll() {
  useEffect(() => {
    const align = () => {
      if (window.location.hash !== "#products") return;
      // Wait a frame so layout (images/carousel measure) can settle
      requestAnimationFrame(() => {
        scrollToProducts("auto");
      });
    };

    align();
    window.addEventListener("hashchange", align);
    return () => window.removeEventListener("hashchange", align);
  }, []);

  return null;
}
