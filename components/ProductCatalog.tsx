"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PRODUCT_FAMILIES,
  filterOrchids,
  normalizeProductFamily,
  normalizeProductFormat,
  productsHref,
  type OrchidProduct,
  type ProductFamily,
} from "../data/orchids";

type ProductCatalogProps = {
  products: OrchidProduct[];
};

export function ProductCatalog({ products }: ProductCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const format = normalizeProductFormat(searchParams.get("format"));
  const family = normalizeProductFamily(searchParams.get("category"));
  const eyebrow = format === "loose" ? "FRESH LOOSE BLOOMS" : "FRESH CUT ORCHIDS";

  const visible = useMemo(() => {
    const allowed = new Set(filterOrchids(format, family).map((item) => item.number));
    return products.filter((item) => allowed.has(item.number));
  }, [family, format, products]);

  const setFamily = (next: ProductFamily) => {
    router.push(productsHref(format, next), { scroll: false });
  };

  return (
    <section
      className="products-catalog section-shell"
      aria-labelledby="products-title"
    >
      <header className="products-intro">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="products-title">Made for What You Create.</h1>
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
                onClick={() => setFamily(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {visible.length === 0 ? (
          <p className="products-coming-soon" role="status">
            Coming soon
          </p>
        ) : (
          <div className="products-grid" role="list">
            {visible.map((orchid) => (
              <article
                className="product-card catalog-card catalog-card-minimal"
                key={orchid.number}
                role="listitem"
              >
                <a
                  className={`product-photo photo-slot has-photo ${orchid.imageClass}`}
                  href="/contact"
                  aria-label={`Ask about ${orchid.name}`}
                >
                  <Image
                    src={orchid.image}
                    alt={orchid.name}
                    fill
                    sizes="(max-width: 760px) 92vw, min(420px, 36vw)"
                    className="product-photo-media"
                  />
                  <span className="product-index">{orchid.number} / 04</span>
                </a>
                <div className="product-info">
                  <div>{orchid.category ? <p>{orchid.category}</p> : null}</div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
