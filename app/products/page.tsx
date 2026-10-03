import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductCatalog } from "../../components/ProductCatalog";
import { ProductsCatalogFallback } from "../../components/ProductsCatalogFallback";
import { ProductsPageScroll } from "../../components/ProductsPageScroll";
import { SiteChrome } from "../../components/SiteChrome";
import { SiteFooter } from "../../components/SiteFooter";
import { orchids } from "../../data/orchids";

export const metadata: Metadata = {
  title: "Products | Origin Blooms",
  description:
    "Browse Origin Blooms cut Dendrobium orchid stems and loose blooms for florists, event designers, and wholesale buyers.",
};

export default function ProductsPage() {
  return (
    <>
      <Suspense fallback={null}>
        <ProductsPageScroll />
      </Suspense>
      <SiteChrome />
      <main>
        <Suspense fallback={<ProductsCatalogFallback />}>
          <ProductCatalog products={orchids} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
