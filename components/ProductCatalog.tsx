"use client";

import Image from "next/image";
import { useDeferredValue, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PRODUCT_FAMILIES,
  filterOrchids,
  getAvailableColors,
  normalizeProductFamily,
  normalizeProductFormat,
  productDetailHref,
  productsHref,
  searchOrchids,
  type OrchidProduct,
  type ProductFamily,
} from "../data/orchids";

type ProductCatalogProps = {
  products: OrchidProduct[];
};

export function ProductCatalog({ products }: ProductCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const format = normalizeProductFormat(searchParams.get("format"));
  const family = normalizeProductFamily(searchParams.get("category"));
  const colorParam = searchParams.get("color") ?? "";
  const qParam = searchParams.get("q") ?? "";
  const deferredQ = useDeferredValue(qParam);
  const eyebrow = format === "loose" ? "FRESH LOOSE BLOOMS" : "FRESH CUT ORCHIDS";

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

  const pushQuery = (next: {
    family?: ProductFamily;
    color?: string;
    q?: string;
  }) => {
    const nextFamily = next.family ?? family;
    const nextColor = next.color === undefined ? colorParam : next.color;
    const nextQ = next.q === undefined ? qParam : next.q;
    startTransition(() => {
      router.push(
        productsHref(format, nextFamily, {
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

  return (
    <section
      className="products-catalog section-shell"
      aria-labelledby="products-title"
    >
      <header className="products-intro">
        <p className="eyebrow">{eyebrow}</p>
        <div className="products-intro-row">
          <h1 id="products-title">Made for What You Create.</h1>
          <div className="products-toolbar">
            <label className="products-search">
              <span className="visually-hidden">Search variety name</span>
              <input
                type="search"
                name="q"
                placeholder="Search variety"
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
        </div>
      </header>

      <div className="products-catalog-layout" id="product-catalog">
        <nav className="products-categories" aria-label="Product categories">
          {PRODUCT_FAMILIES.map((item) => {
            const selected = family === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`products-category-btn${selected ? " is-selected" : ""}`}
                aria-pressed={selected}
                onClick={() => pushQuery({ family: item.id })}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

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
                const lazy = index >= 8;
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
                        sizes="(max-width: 760px) 46vw, (max-width: 1100px) 30vw, min(240px, 20vw)"
                        className="product-photo-media"
                        loading={lazy ? "lazy" : undefined}
                        priority={!lazy && index < 4}
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
  );
}
