/**
 * Suspense fallback for ProductCatalog — keeps page height so the footer
 * cannot jump up while searchParams resolve on category soft-navigation.
 * Hero frame uses the same 4/1 aspect-ratio CSS as the live catalog.
 */
export function ProductsCatalogFallback() {
  return (
    <div className="products-page">
      <div className="products-category-hero" aria-hidden="true">
        <div className="products-category-hero-frame" />
      </div>
      <section
        className="products-catalog section-shell"
        aria-busy="true"
        aria-labelledby="products-eyebrow"
      >
        <header className="products-intro">
          <p className="eyebrow" id="products-eyebrow">
            FRESH CUT ORCHIDS
          </p>
          <div className="products-toolbar" aria-hidden="true">
            <span className="products-search" />
            <span className="products-color-filter" />
            <span className="products-result-count" />
          </div>
        </header>
      </section>
    </div>
  );
}
