"use client";

import type { MouseEvent } from "react";

type ProductsNavLinkProps = {
  className?: string;
};

function stickyChromeOffset() {
  const chrome = document.querySelector<HTMLElement>(".site-chrome");
  if (chrome) {
    if (chrome.classList.contains("is-hidden")) return 0;
    const style = window.getComputedStyle(chrome);
    if (style.display === "none" || style.visibility === "hidden") return 0;
    const rect = chrome.getBoundingClientRect();
    if (rect.height <= 0 || rect.bottom <= 0) return 0;
    return Math.round(rect.bottom);
  }
  return 0;
}

export function scrollToProductCatalog(behavior: ScrollBehavior = "smooth") {
  const target = document.getElementById("product-catalog");
  if (!target) return false;

  const gap = 16;
  const top =
    window.scrollY + target.getBoundingClientRect().top - stickyChromeOffset() - gap;
  window.scrollTo({ top: Math.max(0, top), behavior });

  if (window.location.pathname === "/products" && window.location.hash !== "#product-catalog") {
    history.replaceState(null, "", "/products#product-catalog");
  }
  return true;
}

/** @deprecated Prefer scrollToProductCatalog; kept for homepage carousel hash. */
export function scrollToProducts(behavior: ScrollBehavior = "smooth") {
  const target = document.getElementById("products");
  if (!target) return false;

  const gap = 16;
  const top =
    window.scrollY + target.getBoundingClientRect().top - stickyChromeOffset() - gap;
  window.scrollTo({ top: Math.max(0, top), behavior });

  if (window.location.pathname === "/" && window.location.hash !== "#products") {
    history.replaceState(null, "", "/#products");
  }
  return true;
}

export function ProductsNavLink({ className }: ProductsNavLinkProps) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const path = window.location.pathname;
    const onProductsPage = path === "/products";
    const details = event.currentTarget.closest("details");

    if (onProductsPage) {
      event.preventDefault();
      if (details instanceof HTMLDetailsElement) details.open = false;
      scrollToProductCatalog("smooth");
      return;
    }

    // Navigate to /products; ProductsPageScroll aligns to the grid on load.
    if (details instanceof HTMLDetailsElement) details.open = false;
  };

  return (
    <a className={className} href="/products#product-catalog" onClick={onClick}>
      Products
    </a>
  );
}
