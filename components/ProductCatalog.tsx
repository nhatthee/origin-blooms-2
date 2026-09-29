"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { filterOrchids, type OrchidProduct, type ProductFilter } from "../data/orchids";

type ProductCatalogProps = {
  products: OrchidProduct[];
};

const filters: { id: ProductFilter; label: string }[] = [
  { id: "cut", label: "Cut Orchids" },
  { id: "loose", label: "Loose Blooms" },
];

export function ProductCatalog({ products }: ProductCatalogProps) {
  const [filter, setFilter] = useState<ProductFilter>("cut");

  const visible = useMemo(() => {
    const allowed = new Set(filterOrchids(filter).map((item) => item.number));
    return products.filter((item) => allowed.has(item.number));
  }, [filter, products]);

  return (
    <section
      className="products-catalog section-shell"
      aria-labelledby="products-title"
    >
      <header className="products-intro">
        <p className="eyebrow">GROWN IN THAILAND</p>
        <h1 id="products-title">Made for What You Create.</h1>
      </header>
      <div className="products-catalog-layout" id="product-catalog">
        <nav className="products-categories" aria-label="Product categories">
          {filters.map((item) => {
            const selected = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`products-category-btn${selected ? " is-selected" : ""}`}
                aria-pressed={selected}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="products-grid" role="list">
          {visible.map((orchid) => (
            <article
              className="product-card catalog-card catalog-card-minimal"
              key={orchid.number}
              role="listitem"
            >
              <a
                className={`product-photo photo-slot has-photo ${orchid.imageClass}`}
                href="/#contact"
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
                <div>
                  {orchid.category ? <p>{orchid.category}</p> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
