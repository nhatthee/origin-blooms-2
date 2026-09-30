import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "../../../components/ProductDetail";
import { SiteChrome } from "../../../components/SiteChrome";
import { SiteFooter } from "../../../components/SiteFooter";
import {
  getOrchidBySlug,
  normalizeProductFamily,
  normalizeProductFormat,
  orchids,
} from "../../../data/orchids";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function generateStaticParams() {
  return orchids.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getOrchidBySlug(slug);
  if (!product) {
    return { title: "Product | Origin Blooms" };
  }
  return {
    title: `${product.name} | Origin Blooms`,
    description: product.description,
  };
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const product = getOrchidBySlug(slug);
  if (!product) notFound();

  const format = normalizeProductFormat(firstParam(query.format) ?? product.format);
  const family = normalizeProductFamily(firstParam(query.category) ?? product.family);
  const color = firstParam(query.color);
  const q = firstParam(query.q);

  return (
    <>
      <SiteChrome />
      <main>
        <ProductDetail
          product={product}
          catalogQuery={{ format, family, color, q }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
