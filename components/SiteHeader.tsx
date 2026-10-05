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
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useInquiry } from "./InquiryProvider";
import {
  CLOSE_MOBILE_NAV_EVENT,
  ProductsNavCaret,
  ProductsNavMenu,
} from "./ProductsNavLink";

type SiteHeaderProps = {
  /** When true, marks the home-page header anchor for in-page scroll. */
  homePage?: boolean;
};

const MOBILE_NAV_MQ = "(max-width: 760px)";

type MenuPhase = "closed" | "opening" | "open" | "closing";

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
        <span className="products-nav-trigger-label">Products</span>
        <ProductsNavCaret />
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

function LoginPersonIcon() {
  return (
    <svg
      className="header-icon-svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5.25 19.25c.9-3.35 3.2-5 6.75-5s5.85 1.65 6.75 5"
        stroke="currentColor"
        strokeWidth="1.75"
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
  const inquiryCurrent = pageCurrent(pathname, "/inquiry");
  const { count: inquiryCount, ready: inquiryReady } = useInquiry();
  const navId = useId();
  const inquiryLabel =
    inquiryReady && inquiryCount > 0
      ? `Inquiry (${inquiryCount})`
      : "Inquiry";
  const [phase, setPhase] = useState<MenuPhase>("closed");
  const [showCloseIcon, setShowCloseIcon] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const scrollYRef = useRef(0);
  const lockedRef = useRef(false);
  const phaseRef = useRef<MenuPhase>(phase);
  const showCloseIconRef = useRef(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const logoRowRef = useRef<HTMLDivElement | null>(null);

  phaseRef.current = phase;
  showCloseIconRef.current = showCloseIcon;

  const menuExpanded = phase !== "closed";
  const panelMounted = phase !== "closed";
  // Busy while the panel is mid-open or mid-close; X only appears after open settles.
  const toggleBusy =
    phase === "opening" || phase === "closing" || (phase === "open" && !showCloseIcon);

  const syncMobileMenuTop = () => {
    const row = logoRowRef.current;
    if (!row) return;
    const top = Math.round(row.getBoundingClientRect().bottom);
    document.documentElement.style.setProperty("--mobile-menu-top", `${top}px`);
  };

  const clearMobileMenuTop = () => {
    document.documentElement.style.removeProperty("--mobile-menu-top");
  };

  const releaseScrollLock = () => {
    if (!lockedRef.current) return;
    lockedRef.current = false;
    unlockBodyScroll(scrollYRef.current);
  };

  const ensureScrollLock = () => {
    if (lockedRef.current) return;
    scrollYRef.current = Math.max(0, window.scrollY);
    lockBodyScroll(scrollYRef.current);
    lockedRef.current = true;
  };

  const finishClose = () => {
    const panel = panelRef.current;
    if (panel) {
      // Hide before resetting to -100% so the next open never flashes.
      panel.style.visibility = "hidden";
      panel.style.pointerEvents = "none";
      panel.style.transition = "none";
      panel.style.transform = "translate3d(0, -100%, 0)";
      void panel.offsetHeight;
    }
    setShowCloseIcon(false);
    showCloseIconRef.current = false;
    setPhase("closed");
    clearMobileMenuTop();
    releaseScrollLock();
  };

  const requestClose = () => {
    const current = phaseRef.current;
    if (current !== "open" || !showCloseIconRef.current) return;

    if (prefersReducedMotion()) {
      finishClose();
      return;
    }

    setPhase("closing");
  };

  const requestOpen = () => {
    if (!isMobileNavViewport()) return;

    const current = phaseRef.current;
    if (current !== "closed") return;

    ensureScrollLock();
    syncMobileMenuTop();
    setShowCloseIcon(false);
    showCloseIconRef.current = false;

    if (prefersReducedMotion()) {
      setPhase("open");
      setShowCloseIcon(true);
      showCloseIconRef.current = true;
      return;
    }

    setPhase("opening");
  };

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (phaseRef.current !== "closed") finishClose();
  }, [pathname]);

  useEffect(() => {
    const onCloseRequest = () => {
      if (phaseRef.current === "open") requestClose();
      else if (phaseRef.current !== "closed") finishClose();
    };
    window.addEventListener(CLOSE_MOBILE_NAV_EVENT, onCloseRequest);
    return () => window.removeEventListener(CLOSE_MOBILE_NAV_EVENT, onCloseRequest);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_NAV_MQ);
    const onViewportChange = () => {
      if (!mq.matches && phaseRef.current !== "closed") finishClose();
    };
    mq.addEventListener("change", onViewportChange);
    return () => mq.removeEventListener("change", onViewportChange);
  }, []);

  useEffect(() => {
    if (phase !== "open") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase]);

  useEffect(() => {
    if (phase !== "opening") return;

    let outerFrame = 0;
    let innerFrame = 0;
    outerFrame = window.requestAnimationFrame(() => {
      innerFrame = window.requestAnimationFrame(() => {
        if (phaseRef.current === "opening") setPhase("open");
      });
    });
    return () => {
      window.cancelAnimationFrame(outerFrame);
      window.cancelAnimationFrame(innerFrame);
    };
  }, [phase]);

  useEffect(() => {
    if (!panelMounted) return;

    syncMobileMenuTop();
    const onViewportAlign = () => syncMobileMenuTop();
    window.addEventListener("resize", onViewportAlign);
    window.addEventListener("orientationchange", onViewportAlign);
    return () => {
      window.removeEventListener("resize", onViewportAlign);
      window.removeEventListener("orientationchange", onViewportAlign);
    };
  }, [panelMounted]);

  useEffect(() => {
    return () => {
      clearMobileMenuTop();
      releaseScrollLock();
    };
  }, []);

  const onPanelTransitionEnd = (event: TransitionEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== "transform") return;

    if (phaseRef.current === "closing") {
      finishClose();
      return;
    }

    // Open slide finished: swap hamburger → X in the same toggle.
    if (phaseRef.current === "open") {
      showCloseIconRef.current = true;
      setShowCloseIcon(true);
    }
  };

  const closeMenu = () => requestClose();

  return (
    <header className="site-header" id={homePage ? "top" : undefined}>
      <div className="site-header-top" ref={logoRowRef}>
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
            <a
              href="/inquiry"
              className="inquiry-nav-link"
              aria-current={inquiryCurrent}
            >
              {inquiryLabel}
            </a>
            <a href="/contact" aria-current={pageCurrent(pathname, "/contact")}>
              Contact
            </a>
          </nav>
          <div className="header-icon-actions" aria-label="Account">
            <a
              className="header-icon-link"
              href="/login"
              aria-label="Login"
              aria-current={pageCurrent(pathname, "/login")}
            >
              <LoginPersonIcon />
            </a>
          </div>
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
            aria-expanded={menuExpanded}
            aria-controls={navId}
            aria-label={showCloseIcon ? "Close navigation" : "Open navigation"}
            aria-busy={toggleBusy || undefined}
            onClick={() => {
              if (toggleBusy) return;
              if (phase === "open") requestClose();
              else requestOpen();
            }}
          >
            {showCloseIcon ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </div>
      <nav className="mobile-primary-nav" aria-label="Primary">
        <a href="/" aria-current={pageCurrent(pathname, "/")}>
          Home
        </a>
        <Suspense fallback={<ProductsNavFallback ariaCurrent={productsCurrent} />}>
          <ProductsNavMenu aria-current={productsCurrent} />
        </Suspense>
        <a
          href="/inquiry"
          className="inquiry-nav-link"
          aria-current={inquiryCurrent}
        >
          {inquiryLabel}
        </a>
        <a href="/contact" aria-current={pageCurrent(pathname, "/contact")}>
          Contact
        </a>
      </nav>
      {portalReady && panelMounted
        ? createPortal(
            <>
              <div
                className={`mobile-menu-backdrop${
                  phase === "opening" || phase === "open" ? " is-open" : ""
                }`}
                aria-hidden="true"
                onClick={closeMenu}
              />
              <div className="mobile-menu-shell" data-phase={phase}>
                <nav
                  ref={panelRef}
                  id={navId}
                  className="mobile-menu-panel"
                  data-phase={phase}
                  aria-label="Mobile navigation"
                  aria-hidden={!menuExpanded}
                  inert={phase === "closing" ? true : undefined}
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
                    <a href="/login" aria-current={pageCurrent(pathname, "/login")}>
                      Login
                    </a>
                  </div>
                </nav>
              </div>
            </>,
            document.body,
          )
        : null}
    </header>
  );
}
