import Image from "next/image";
import { Arrow } from "../components/Arrow";
import { FeaturedOrchids } from "../components/FeaturedOrchids";
import { HomeProductsCarousel } from "../components/HomeProductsCarousel";
import { ProductsHashScroll } from "../components/ProductsHashScroll";
import { SiteChrome } from "../components/SiteChrome";
import { SiteFooter } from "../components/SiteFooter";
import { getOrchidBySlug, productDetailHref } from "../data/orchids";

/**
 * Home featured strip — fixed order from live catalog SKUs.
 * `label` is Featured-only display text; catalog product names stay unchanged.
 */
const FEATURED_ORCHIDS = [
  { slug: "sonia-purple", label: "Den. Sonia" },
  { slug: "big-white", label: "Den. Big White Form" },
  { slug: "mokara-pink-jubkuan", label: "Mok. Pink Jubkuan" },
  { slug: "vanda-patchara", label: "Van. Patchara" },
  { slug: "dyed-yellow-sonia", label: "Dyed Yellow Sonia" },
] as const;

const featuredOrchids = FEATURED_ORCHIDS.flatMap(({ slug, label }) => {
  const product = getOrchidBySlug(slug);
  if (!product) return [];
  return [
    {
      slug: product.slug,
      name: label,
      image: product.image,
      href: productDetailHref(product.slug, {
        format: product.format,
        family: product.family,
      }),
    },
  ];
});

/**
 * Home story cards — kept independent from catalog product codes (SN, BWF, …).
 * Copy and images are the existing Vision / Packing House / Growers content.
 */
const homeStoryCards = [
  {
    id: "01",
    title: "ABOUT US",
    lead: "Beauty begins at the source.",
    body: "We believe a flower’s story matters as much as the moment it creates. From Thai farms to floral professionals across the United States, we give every Dendrobium orchid a new place to inspire.",
    imageSrc: "/images/story/our-vision.png",
    href: "/about-us",
  },
  {
    id: "02",
    title: "PACKING HOUSE",
    lead: "Care between the farm and the destination.",
    body: "After harvest, the orchids are selected, prepared, and packed for their journey. Each step matters: protecting the blooms, preserving their beauty, and helping them arrive ready for the hands that will create with them.",
    imageSrc: "/images/story/packing-house.png",
    href: "/packing-house",
  },
  {
    id: "03",
    title: "OUR GROWERS",
    lead: "Rooted in the people behind the flowers.",
    body: "We work closely with our Thai grower network to select orchids that meet export quality standards. Careful harvesting, handling, and packing help each fresh-cut stem arrive in beautiful condition, ready for floral work.",
    imageSrc: "/images/story/growers.png",
    href: "/our-growers",
  },
];

export default function Home() {
  return (
    <>
      <ProductsHashScroll />
      <SiteChrome homePage />

      <main>
        <section className="hero-truck" aria-label="Origin Blooms">
          <Image
            src="/images/hero/origin-blooms-van.png"
            alt="Concept image of an Origin Blooms branded orchid delivery van"
            fill
            sizes="100vw"
            priority
            className="hero-truck-image"
          />
        </section>

        <div className="value-strip" aria-label="Our focus">
          <div className="value-strip-track">
            <div className="value-strip-group">
              <span>AUTHENTIC THAI CUT FLOWERS</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>FRESHLY CUT, EVERY DAY</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>FLOWN IN FRESH, EVERY WEEK</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>A STUDY IN PURPLE & WHITE</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>EACH STEM, A NEW BEGINNING</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
            </div>
            <div className="value-strip-group" aria-hidden="true">
              <span>AUTHENTIC THAI CUT FLOWERS</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>FRESHLY CUT, EVERY DAY</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>FLOWN IN FRESH, EVERY WEEK</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>A STUDY IN PURPLE & WHITE</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>EACH STEM, A NEW BEGINNING</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
            </div>
          </div>
        </div>

        <section className="collection section-shell" id="collection" aria-label="Products">
          <HomeProductsCarousel cards={homeStoryCards} />
        </section>

        <FeaturedOrchids items={featuredOrchids} />

        <section className="story" id="story" aria-labelledby="story-title">
          <div className="story-visual">
            <Image
              src="/images/story/thai-orchid-growers.png"
              alt="Thai orchid growers preparing fresh-cut Dendrobium orchids"
              fill
              sizes="(max-width: 760px) 100vw, 50vw"
              className="story-visual-image"
            />
            <div className="story-stamp">ROOTED IN<br /><em>Thailand</em></div>
          </div>
          <div className="story-copy"><h2 id="story-title">Where Every Stem Begins</h2><p>Before the design takes shape, the stem defines the standard. We partner with dedicated Thai farms to bring premium Dendrobiums straight to your studio—keeping every bloom vibrant, fresh, and authentically rooted in its origin.</p><a className="text-link" href="/contact">Start a conversation <Arrow diagonal /></a></div>
        </section>

        <section className="process section-shell" id="process" aria-labelledby="process-title">
          <div className="process-heading"><p className="eyebrow">HOW WE WORK</p><h2 id="process-title">Good things grow<br /><em>together.</em></h2></div>
          <div className="process-grid">
            <div>
              <span>01</span>
              <h3>Tell us what you need</h3>
              <p>
                Share your preferred varieties, quantities, format (stems or loose blooms), delivery
                location, and timing.
              </p>
            </div>
            <div>
              <span>02</span>
              <h3>Review availability</h3>
              <p>
                We&apos;ll confirm options and send a quote with packing, delivery, and payment
                details.
              </p>
            </div>
            <div>
              <span>03</span>
              <h3>Confirm your order</h3>
              <p>
                Approve the quote, and we&apos;ll coordinate your order with our growers in
                Thailand.
              </p>
            </div>
            <div>
              <span>04</span>
              <h3>Import &amp; distribution</h3>
              <p>
                We coordinate import from Thailand and arrange U.S. distribution after arrival and
                clearance.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
