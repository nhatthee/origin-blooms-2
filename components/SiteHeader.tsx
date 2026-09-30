"use client";

import Image from "next/image";
import {
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  type TransitionEvent,
} from "react";
import { usePathname } from "next/navigation";
import { CLOSE_MOBILE_NAV_EVENT, ProductsNavMenu } from "./ProductsNavLink";

type SiteHeaderProps = {
  /** When true, marks the home-page header anchor for in-page scroll. */
  homePage?: boolean;
};

const MOBILE_NAV_MQ = "(max-width: 760px)";
const MENU_MOTION_MS = 700;

function isCurrentPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function pageCurrent(pathname: string, href: string): "page" | undefined {
  return isCurrentPath(pathname, href) ? "page" : undefined;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isMobileNavViewport() {
  return window.matchMedia(MOBILE_NAV_MQ).matches;
}

function ProductsNavFallback({ ariaCurrent }: { ariaCurrent?: "page" }) {
  return (
    <div className="products-nav">
      <button
        type="button"
        className="products-nav-trigger"
        aria-expanded={false}
        aria-haspopup="menu"
        aria-current={ariaCurrent}
      >
        Products
        <span className="products-nav-caret" aria-hidden="true">
          ▾
        </span>
      </button>
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg
      className="mobile-menu-icon"
      width="28"
      height="24"
      viewBox="0 0 28 24"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="2" width="28" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="8" y="10.75" width="20" height="2.5" rx="1.25" fill="currentColor" />
      <rect x="0" y="19.5" width="28" height="2.5" rx="1.25" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="mobile-menu-icon mobile-menu-icon--close"
      width="28"
      height="24"
      viewBox="0 0 28 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M7 4.5 L21 19.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M21 4.5 L7 19.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function lockBodyScroll(scrollY: number) {
  const { body, documentElement } = document;
  documentElement.classList.add("mobile-nav-open");
  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
}

function unlockBodyScroll(scrollY: number) {
  const { body, documentElement } = document;
  documentElement.classList.remove("mobile-nav-open");
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  body.style.overflow = "";
  window.scrollTo(0, scrollY);
}

export function SiteHeader({ homePage = false }: SiteHeaderProps) {
  const pathname = usePathname() || "/";
  const productsCurrent = pageCurrent(pathname, "/products");
  const navId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelRevealed, setPanelRevealed] = useState(false);
  const scrollYRef = useRef(0);
  const closeTimerRef = useRef<number | null>(null);
  const lockedRef = useRef(false);
  const menuOpenRef = useRef(menuOpen);
  const panelRevealedRef = useRef(panelRevealed);

  menuOpenRef.current = menuOpen;
  panelRevealedRef.current = panelRevealed;

  const clearCloseTimer = () => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const releaseScrollLock = () => {
    if (!lockedRef.current) return;
    lockedRef.current = false;
    unlockBodyScroll(scrollYRef.current);
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onCloseRequest = () => setMenuOpen(false);
    window.addEventListener(CLOSE_MOBILE_NAV_EVENT, onCloseRequest);
    return () => window.removeEventListener(CLOSE_MOBILE_NAV_EVENT, onCloseRequest);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_NAV_MQ);
    const onViewportChange = () => {
      if (!mq.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onViewportChange);
    return () => mq.removeEventListener("change", onViewportChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    clearCloseTimer();

    if (menuOpen) {
      if (!isMobileNavViewport()) {
        setMenuOpen(false);
        return;
      }

      if (!lockedRef.current) {
        scrollYRef.current = Math.max(0, window.scrollY);
        lockBodyScroll(scrollYRef.current);
        lockedRef.current = true;
      }

      setPanelMounted(true);

      if (prefersReducedMotion()) {
        setPanelRevealed(true);
        return;
      }

      let outerFrame = 0;
      let innerFrame = 0;
      outerFrame = window.requestAnimationFrame(() => {
        innerFrame = window.requestAnimationFrame(() => setPanelRevealed(true));
      });
      return () => {
        window.cancelAnimationFrame(outerFrame);
        window.cancelAnimationFrame(innerFrame);
      };
    }

    setPanelRevealed(false);

    if (prefersReducedMotion()) {
      setPanelMounted(false);
      releaseScrollLock();
      return;
    }

    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setPanelMounted(false);
      releaseScrollLock();
    }, MENU_MOTION_MS);

    return clearCloseTimer;
  }, [menuOpen]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
      releaseScrollLock();
    };
  }, []);

  const onPanelTransitionEnd = (event: TransitionEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== "clip-path") return;
    if (menuOpenRef.current || panelRevealedRef.current) return;
    clearCloseTimer();
    setPanelMounted(false);
    releaseScrollLock();
  };

  return (
    <header className="site-header" id={homePage ? "top" : undefined}>
      <a className="logo" href="/" aria-label="Origin Blooms home">
        <Image
          className="logo-image"
          src="/images/logo/origin-blooms-purple.svg"
          alt="Origin Blooms"
          width={480}
          height={200}
          priority
          unoptimized
        />
      </a>
      <div className="desktop-header-actions">
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="/" aria-current={pageCurrent(pathname, "/")}>
            Home
          </a>
          <Suspense fallback={<ProductsNavFallback ariaCurrent={productsCurrent} />}>
            <ProductsNavMenu aria-current={productsCurrent} />
          </Suspense>
          <a href="/about-us" aria-current={pageCurrent(pathname, "/about-us")}>
            About Us
          </a>
          <a href="/contact" aria-current={pageCurrent(pathname, "/contact")}>
            Contact
          </a>
          <a href="/resources" aria-current={pageCurrent(pathname, "/resources")}>
            Resources
          </a>
        </nav>
        <a className="header-cta" href="/login" aria-current={pageCurrent(pathname, "/login")}>
          Login
        </a>
      </div>
      <div className="mobile-header-actions">
        <a
          className="mobile-join"
          href="/login"
          aria-current={pageCurrent(pathname, "/login")}
        >
          Join
        </a>
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls={navId}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((current) => !current)}
        >
          {menuOpen ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </div>
      {panelMounted ? (
        <nav
          id={navId}
          className={`mobile-menu-panel${panelRevealed ? " is-open" : ""}`}
          aria-label="Mobile navigation"
          aria-hidden={!panelRevealed}
          onTransitionEnd={onPanelTransitionEnd}
        >
          <div className="mobile-menu-panel-inner">
            <a href="/" aria-current={pageCurrent(pathname, "/")}>
              Home
            </a>
            <Suspense fallback={<ProductsNavFallback ariaCurrent={productsCurrent} />}>
              <ProductsNavMenu aria-current={productsCurrent} />
            </Suspense>
            <a href="/about-us" aria-current={pageCurrent(pathname, "/about-us")}>
              About Us
            </a>
            <a href="/contact" aria-current={pageCurrent(pathname, "/contact")}>
              Contact
            </a>
            <a href="/resources" aria-current={pageCurrent(pathname, "/resources")}>
              Resources
            </a>
            <a href="/login" aria-current={pageCurrent(pathname, "/login")}>
              Login
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
