"use client";

import type { MouseEvent } from "react";

type ProductsNavLinkProps = {
  className?: string;
  "aria-current"?: "page";
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

/** Used only for legacy `/products#product-catalog` deep links. */
export function scrollToProductCatalog(behavior: ScrollBehavior = "smooth") {
  const target = document.getElementById("product-catalog");
  if (!target) return false;

  const gap = 16;
  const top =
    window.scrollY + target.getBoundingClientRect().top - stickyChromeOffset() - gap;
  window.scrollTo({ top: Math.max(0, top), behavior });
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

function scrollProductsPageToTop(behavior: ScrollBehavior = "auto") {
  if (window.location.hash) {
    history.replaceState(null, "", "/products");
  }
  window.scrollTo({ top: 0, behavior });
}

export function ProductsNavLink({
  className,
  "aria-current": ariaCurrent,
}: ProductsNavLinkProps) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const path = window.location.pathname;
    const onProductsPage = path === "/products";
    const details = event.currentTarget.closest("details");

    if (details instanceof HTMLDetailsElement) details.open = false;

    if (onProductsPage) {
      event.preventDefault();
      scrollProductsPageToTop("smooth");
    }
  };

  return (
    <a className={className} href="/products" aria-current={ariaCurrent} onClick={onClick}>
      Products
    </a>
  );
}
