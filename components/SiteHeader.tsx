import Image from "next/image";
import { ProductsNavLink } from "./ProductsNavLink";

type SiteHeaderProps = {
  /** When true, marks the home-page header anchor for in-page scroll. */
  homePage?: boolean;
};

export function SiteHeader({ homePage = false }: SiteHeaderProps) {
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
        <a href="/">Home</a>
        <ProductsNavLink />
        <a href="/our-story">About Us</a>
        <a href="/contact">Contact</a>
        <a href="/resources">Resources</a>
      </nav>
      <a className="header-cta" href="/login">
        Login
      </a>
      <details className="mobile-menu">
        <summary aria-label="Open navigation">
          Menu <span aria-hidden="true">☰</span>
        </summary>
        <nav aria-label="Mobile navigation">
          <a href="/">Home</a>
          <ProductsNavLink />
          <a href="/our-story">About Us</a>
          <a href="/contact">Contact</a>
          <a href="/resources">Resources</a>
          <a href="/login">Login</a>
        </nav>
      </details>
    </header>
  );
}
