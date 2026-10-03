"use client";

import Image from "next/image";
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
import {
  PRODUCT_NAV_MEGA_ITEMS,
  productNavMegaHref,
  type ProductNavMegaItem,
} from "../data/productNavMega";

type ProductsNavMenuProps = {
  className?: string;
  "aria-current"?: "page";
};

const HOVER_NAV_MQ = "(hover: hover) and (pointer: fine) and (min-width: 761px)";
const HOVER_CLOSE_DELAY_MS = 140;
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

function isMegaItemActive(
  item: ProductNavMegaItem,
  onProductsPage: boolean,
  activeFormat: ProductFormat | null,
  activeFamily: ReturnType<typeof normalizeProductFamily>,
): boolean {
  if (!onProductsPage || activeFormat === null) return false;
  if (item.kind === "format") return activeFormat === item.id;
  return activeFormat === "cut" && activeFamily === item.id;
}

export function ProductsNavMenu({
  className,
  "aria-current": ariaCurrent,
}: ProductsNavMenuProps) {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dropdownMenuId = useId();
  const megaMenuId = useId();
  const hoverNav = useHoverNav();
  const hoverCloseTimerRef = useRef<number | null>(null);

  const onProductsPage = pathname === "/products";
  const activeFormat: ProductFormat | null = onProductsPage
    ? normalizeProductFormat(searchParams.get("format"))
    : null;
  const activeFamily = normalizeProductFamily(searchParams.get("category"));

  const clearHoverCloseTimer = () => {
    if (hoverCloseTimerRef.current != null) {
      window.clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  };

  const scheduleHoverClose = () => {
    clearHoverCloseTimer();
    hoverCloseTimerRef.current = window.setTimeout(() => {
      hoverCloseTimerRef.current = null;
      setOpen(false);
    }, HOVER_CLOSE_DELAY_MS);
  };

  useEffect(() => {
    return () => clearHoverCloseTimer();
  }, []);

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
    if (hoverNav) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen((prev) => !prev);
  };

  const onRootMouseEnter = () => {
    clearHoverCloseTimer();
    if (hoverNav) setOpen(true);
  };

  const onRootMouseLeave = () => {
    if (hoverNav) scheduleHoverClose();
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

  const navClassName = [
    "products-nav",
    open ? "is-open" : "",
    hoverNav ? "products-nav--desktop-mega" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={navClassName}
      ref={rootRef}
      onMouseEnter={onRootMouseEnter}
      onMouseLeave={onRootMouseLeave}
      onBlur={onRootBlur}
    >
      <button
        type="button"
        className="products-nav-trigger"
        aria-expanded={open}
        aria-controls={hoverNav ? megaMenuId : dropdownMenuId}
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

      {hoverNav ? (
        <div
          className="products-nav-mega"
          id={megaMenuId}
          role="menu"
          aria-label="Product categories"
          hidden={!open}
          onMouseEnter={clearHoverCloseTimer}
          onMouseLeave={scheduleHoverClose}
        >
          <div className="products-nav-mega-shell section-shell">
            <div className="products-nav-mega-grid">
              {PRODUCT_NAV_MEGA_ITEMS.map((item) => {
                const selected = isMegaItemActive(
                  item,
                  onProductsPage,
                  activeFormat,
                  activeFamily,
                );
                const href = productNavMegaHref(item);
                return (
                  <a
                    key={`${item.kind}-${item.id}`}
                    role="menuitem"
                    className={`products-nav-mega-item${selected ? " is-active" : ""}`}
                    href={href}
                    aria-current={selected ? "true" : undefined}
                    onClick={onOptionClick}
                  >
                    <span className="products-nav-mega-banner">
                      {item.imageSrc ? (
                        item.imageFit === "contain" &&
                        item.imageWidth &&
                        item.imageHeight ? (
                          <Image
                            src={item.imageSrc}
                            alt=""
                            width={item.imageWidth}
                            height={item.imageHeight}
                            sizes="(min-width: 1200px) 280px, (min-width: 761px) 22vw, 0px"
                            className="products-nav-mega-media products-nav-mega-media--contain"
                          />
                        ) : (
                          <Image
                            src={item.imageSrc}
                            alt=""
                            fill
                            sizes="(min-width: 1200px) 280px, (min-width: 761px) 22vw, 0px"
                            className="products-nav-mega-media"
                          />
                        )
                      ) : (
                        <span className="products-nav-mega-media-placeholder" aria-hidden="true" />
                      )}
                    </span>
                    <span className="products-nav-mega-label">{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="products-nav-dropdown"
        id={dropdownMenuId}
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
