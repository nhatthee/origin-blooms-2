"use client";

import Image from "next/image";
import { useDeferredValue, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  filterOrchids,
  getAvailableColors,
  normalizeProductFamily,
  normalizeProductFormat,
  productDetailHref,
  productsHref,
  searchOrchids,
  type OrchidProduct,
  type ProductFamily,
  type ProductFormat,
} from "../data/orchids";
import {
  productCategoryOverlayTitle,
  productCategoryOverlayTone,
  productNavMegaItemForCatalog,
  type ProductCategoryOverlayId,
} from "../data/productNavMega";
import { useLocationSearch } from "./useLocationSearch";

type ProductCatalogProps = {
  products: OrchidProduct[];
};

/** Remount the view on category change so the previous hero/list unmount together. */
export function ProductCatalog({ products }: ProductCatalogProps) {
  const searchParams = useLocationSearch();
  const format = normalizeProductFormat(searchParams.get("format"));
  const family = normalizeProductFamily(searchParams.get("category"));
  return (
    <ProductCatalogView
      key={`${format}:${family}`}
      products={products}
      searchParams={searchParams}
      format={format}
      family={family}
    />
  );
}

function ProductCatalogView({
  products,
  searchParams,
  format,
  family,
}: ProductCatalogProps & {
  searchParams: URLSearchParams;
  format: ProductFormat;
  family: ProductFamily;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const colorParam = searchParams.get("color") ?? "";
  const qParam = searchParams.get("q") ?? "";
  const deferredQ = useDeferredValue(qParam);
  const eyebrow =
    format === "loose"
      ? "FRESH LOOSE BLOOMS"
      : format === "bouquet"
        ? "FRESH ORCHID'S BOUQUETS"
        : "FRESH CUT ORCHIDS";

  const categoryProducts = useMemo(() => {
    const allowed = new Set(filterOrchids(format, family).map((item) => item.slug));
    return products.filter((item) => allowed.has(item.slug));
  }, [family, format, products]);

  const colors = useMemo(
    () => getAvailableColors(format, family),
    [format, family],
  );

  const visible = useMemo(
    () =>
      searchOrchids(categoryProducts, {
        q: deferredQ,
        color: colorParam || null,
      }),
    [categoryProducts, deferredQ, colorParam],
  );

  const pushQuery = (next: { color?: string; q?: string }) => {
    const nextColor = next.color === undefined ? colorParam : next.color;
    const nextQ = next.q === undefined ? qParam : next.q;
    startTransition(() => {
      router.push(
        productsHref(format, family, {
          color: nextColor || null,
          q: nextQ || null,
        }),
        { scroll: false },
      );
    });
  };

  const catalogQuery = {
    format,
    family,
    color: colorParam || null,
    q: qParam || null,
  };

  const emptyCategory = categoryProducts.length === 0;
  const emptyResults = !emptyCategory && visible.length === 0;
  const desktopHeroByFamily = {
    dendrobium: {
      src: "/images/products/dendrobium/dendrobium-hero.png",
      alt: "Dendrobium orchids",
      width: 1983,
      height: 793,
    },
    "mokara-aranda": {
      src: "/images/products/mokara/mokara-hero.png",
      alt: "Mokara orchids",
      width: 1983,
      height: 793,
    },
    vanda: {
      src: "/images/products/vanda/vanda-hero.png",
      alt: "Vanda orchids",
      width: 1983,
      height: 793,
    },
    oncidium: {
      src: "/images/products/oncidium/oncidium-hero.png",
      alt: "Oncidium orchids",
      width: 1983,
      height: 793,
    },
    dyed: {
      src: "/images/products/dyed-orchids/dyed-orchid-hero.png",
      alt: "Dyed Orchids",
      width: 1983,
      height: 793,
    },
  } as const;
  const desktopHeroByFormat = {
    bouquet: {
      src: "/images/products/bouquet/bouquet-hero-marble-v2.png",
      alt: "Orchid Bouquets",
      width: 1983,
      height: 793,
    },
    loose: {
      src: "/images/products/loose-blooms/loose-blooms-hero.png",
      alt: "Loose Blooms",
      width: 1983,
      height: 793,
    },
  } as const;
  const megaItem = productNavMegaItemForCatalog(format, family);
  const overlayId = (megaItem?.id ?? null) as ProductCategoryOverlayId | null;
  const desktopHero =
    format === "cut"
      ? (desktopHeroByFamily[family] ?? null)
      : format === "bouquet" || format === "loose"
        ? desktopHeroByFormat[format]
        : null;
  const mobileHeroSrc = megaItem?.imageSrc ?? null;
  const heroTitle = overlayId
    ? productCategoryOverlayTitle(overlayId)
    : null;
  const heroTone = overlayId ? productCategoryOverlayTone(overlayId) : null;
  const heroAlt =
    desktopHero?.alt ??
    (megaItem ? `${megaItem.label} orchids` : "Product category");
  const showHero = Boolean(desktopHero || mobileHeroSrc);
  const mobileOnlyHero = Boolean(mobileHeroSrc && !desktopHero);

  return (
    <div className="products-page">
      {showHero ? (
        <div
          className={`products-category-hero${mobileOnlyHero ? " products-category-hero--mobile-only" : ""}`}
        >
          <div className="products-category-hero-frame">
            {desktopHero ? (
              <Image
                key={`desktop-${desktopHero.src}`}
                src={desktopHero.src}
                alt={heroAlt}
                width={desktopHero.width}
                height={desktopHero.height}
                className="products-category-hero-media products-category-hero-media--desktop"
                sizes="(max-width: 760px) 0px, calc(100vw - clamp(44px, 10vw, 200px))"
                priority
              />
            ) : null}
            {mobileHeroSrc ? (
              <Image
                key={`mobile-${mobileHeroSrc}`}
                src={mobileHeroSrc}
                alt={heroAlt}
                fill
                className="products-category-hero-media products-category-hero-media--mobile"
                sizes="(max-width: 760px) calc(100vw - clamp(32px, 10.8vw, 200px)), 0px"
                priority
              />
            ) : null}
            {heroTitle && heroTone ? (
              <p
                className={`products-banner-title products-banner-title--hero products-banner-title--${heroTone}`}
              >
                {heroTitle}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <section
        className="products-catalog section-shell"
        aria-labelledby="products-eyebrow"
      >
        <header className="products-intro">
          <p className="eyebrow" id="products-eyebrow">
            {eyebrow}
          </p>
          <div className="products-toolbar">
            <label className="products-search">
              <span className="visually-hidden">Search for varieties</span>
              <input
                type="search"
                name="q"
                placeholder="Search for…"
                value={qParam}
                onChange={(event) => pushQuery({ q: event.target.value })}
                autoComplete="off"
              />
            </label>
            {!emptyCategory ? (
              <>
                <label className="products-color-filter">
                  <span className="visually-hidden">Color</span>
                  <select
                    value={colorParam}
                    aria-label="Color"
                    onChange={(event) => pushQuery({ color: event.target.value })}
                  >
                    <option value="">All colors</option>
                    {colors.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="products-result-count" role="status" aria-live="polite">
                  {visible.length} {visible.length === 1 ? "variety" : "varieties"}
                </p>
              </>
            ) : null}
          </div>
        </header>

        <div className="products-catalog-layout" id="product-catalog">
          <div className="products-main">
            {emptyCategory ? (
              <p className="products-coming-soon" role="status">
                Coming soon
              </p>
            ) : emptyResults ? (
              <p className="products-empty" role="status">
                No varieties match your search. Try another name or color.
              </p>
            ) : (
              <div className="products-grid" role="list">
                {visible.map((orchid, index) => {
                  const href = productDetailHref(orchid.slug, catalogQuery);
                  const lazy = index >= 10;
                  return (
                    <article
                      className="product-card catalog-card catalog-card-minimal"
                      key={orchid.slug}
                      role="listitem"
                    >
                      <a
                        className={`product-photo photo-slot has-photo ${orchid.imageClass}`}
                        href={href}
                        aria-label={`View ${orchid.name}`}
                      >
                        <Image
                          src={orchid.image}
                          alt={orchid.name}
                          fill
                          sizes="(max-width: 760px) 22vw, (max-width: 1100px) 28vw, min(280px, 18vw)"
                          className="product-photo-media"
                          loading={lazy ? "lazy" : undefined}
                          priority={!lazy && index < 5}
                        />
                      </a>
                      <div className="product-info">
                        <div>
                          <h3>
                            <a className="product-name-link" href={href}>
                              {orchid.name}
                            </a>
                          </h3>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
