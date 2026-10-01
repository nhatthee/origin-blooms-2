"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  PRODUCT_FORMATS,
  normalizeProductFamily,
  normalizeProductFormat,
  productsHref,
  type ProductFormat,
} from "../data/orchids";

type ProductsNavMenuProps = {
  className?: string;
  "aria-current"?: "page";
};

const HOVER_NAV_MQ = "(hover: hover) and (pointer: fine) and (min-width: 761px)";
export const CLOSE_MOBILE_NAV_EVENT = "originblooms:close-mobile-nav";
export const SHOW_SITE_CHROME_EVENT = "originblooms:show-site-chrome";

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

function useHoverNav() {
  const [hoverNav, setHoverNav] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(HOVER_NAV_MQ);
    const sync = () => setHoverNav(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return hoverNav;
}

export function ProductsNavMenu({
  className,
  "aria-current": ariaCurrent,
}: ProductsNavMenuProps) {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const hoverNav = useHoverNav();

  const onProductsPage = pathname === "/products";
  const activeFormat: ProductFormat | null = onProductsPage
    ? normalizeProductFormat(searchParams.get("format"))
    : null;
  const activeFamily = normalizeProductFamily(searchParams.get("category"));

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        rootRef.current?.querySelector<HTMLButtonElement>(".products-nav-trigger")?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname, searchParams]);

  const onTriggerClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    // Desktop hover nav opens on mouseenter; keep click for touch / coarse pointers.
    if (hoverNav) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen((prev) => !prev);
  };

  const onRootMouseEnter = () => {
    if (hoverNav) setOpen(true);
  };

  const onRootMouseLeave = () => {
    if (hoverNav) setOpen(false);
  };

  const onTriggerFocus = () => {
    setOpen(true);
  };

  const onRootBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && rootRef.current?.contains(next)) return;
    setOpen(false);
  };

  const onOptionClick = () => {
    setOpen(false);
    window.dispatchEvent(new Event(CLOSE_MOBILE_NAV_EVENT));
  };

  return (
    <div
      className={`products-nav${open ? " is-open" : ""}${className ? ` ${className}` : ""}`}
      ref={rootRef}
      onMouseEnter={onRootMouseEnter}
      onMouseLeave={onRootMouseLeave}
      onBlur={onRootBlur}
    >
      <button
        type="button"
        className="products-nav-trigger"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        aria-current={ariaCurrent}
        onClick={onTriggerClick}
        onFocus={onTriggerFocus}
      >
        Products
        <span className="products-nav-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      <div
        className="products-nav-dropdown"
        id={menuId}
        role="menu"
        aria-label="Product formats"
        hidden={!open}
      >
        {PRODUCT_FORMATS.map((item) => {
          const selected = activeFormat === item.id;
          const navLabel =
            item.id === "cut" ? "Orchids" : item.id === "bouquet" ? "Bouquets" : "Loose Blooms";
          return (
            <a
              key={item.id}
              role="menuitem"
              className={`products-nav-option${selected ? " is-selected" : ""}`}
              href={productsHref(item.id, onProductsPage ? activeFamily : "dendrobium")}
              aria-current={selected ? "true" : undefined}
              onClick={onOptionClick}
            >
              {navLabel}
            </a>
          );
        })}
      </div>
    </div>
  );
}

/** @deprecated Use ProductsNavMenu */
export const ProductsNavLink = ProductsNavMenu;
