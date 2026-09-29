"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { ProductsNavLink } from "./ProductsNavLink";

type SiteHeaderProps = {
  /** When true, marks the home-page header anchor for in-page scroll. */
  homePage?: boolean;
};

function isCurrentPath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function pageCurrent(pathname: string, href: string): "page" | undefined {
  return isCurrentPath(pathname, href) ? "page" : undefined;
}

export function SiteHeader({ homePage = false }: SiteHeaderProps) {
  const pathname = usePathname() || "/";

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
      <nav className="desktop-nav" aria-label="Main navigation">
        <a href="/" aria-current={pageCurrent(pathname, "/")}>
          Home
        </a>
        <ProductsNavLink aria-current={pageCurrent(pathname, "/products")} />
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
      <details className="mobile-menu">
        <summary aria-label="Open navigation">
          Menu <span aria-hidden="true">☰</span>
        </summary>
        <nav aria-label="Mobile navigation">
          <a href="/" aria-current={pageCurrent(pathname, "/")}>
            Home
          </a>
          <ProductsNavLink aria-current={pageCurrent(pathname, "/products")} />
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
        </nav>
      </details>
    </header>
  );
}
