import Image from "next/image";
import { Arrow } from "../components/Arrow";
import { HomeProductsCarousel } from "../components/HomeProductsCarousel";
import { ProductsHashScroll } from "../components/ProductsHashScroll";
import { SiteChrome } from "../components/SiteChrome";
import { SiteFooter } from "../components/SiteFooter";
import { orchids } from "../data/orchids";

const homeOrchids = orchids.filter((orchid) => orchid.number !== "04");

const homeCardCopy: Record<
  string,
  { title: string; lead: string; body: string }
> = {
  "01": {
    title: "Our Vision",
    lead: "Beauty begins at the source.",
    body: "We believe a flower’s story matters as much as the moment it creates. From Thai farms to floral professionals across the United States, we give every Dendrobium orchid a new place to inspire.",
  },
  "02": {
    title: "Packing House",
    lead: "Care between the farm and the destination.",
    body: "After harvest, the orchids are selected, prepared, and packed for their journey. Each step matters: protecting the blooms, preserving their beauty, and helping them arrive ready for the hands that will create with them.",
  },
  "03": {
    title: "Our Growers",
    lead: "Rooted in the people behind the flowers.",
    body: "We work closely with our Thai grower network to select orchids that meet export quality standards. Careful harvesting, handling, and packing help each fresh-cut stem arrive in beautiful condition, ready for floral work.",
  },
};

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
              <span>THAI ORIGIN</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>A STUDY IN PURPLE & WHITE</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>EACH STEM, A START</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>A LITTLE DRAMA, NATURALLY</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>FOR FLORISTS & EVENT DESIGNERS</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
            </div>
            <div className="value-strip-group" aria-hidden="true">
              <span>THAI ORIGIN</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>A STUDY IN PURPLE & WHITE</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>EACH STEM, A START</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>A LITTLE DRAMA, NATURALLY</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
              <span>FOR FLORISTS & EVENT DESIGNERS</span>
              <Image src="/icons/spark-orange.svg" alt="" aria-hidden="true" width={16} height={16} className="strip-mark" unoptimized />
            </div>
          </div>
        </div>

        <section className="collection section-shell" id="collection" aria-label="Products">
          <HomeProductsCarousel products={homeOrchids} copyByNumber={homeCardCopy} />
        </section>

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
          <div className="story-copy"><h2 id="story-title">The Hands Behind<br /><em>the Blooms</em></h2><p>Beautiful floral work begins with the flowers themselves. We bring fresh-cut Dendrobium orchids directly from growers in Thailand to florists and event designers across the United States—keeping the connection to their origin at the heart of what we do.</p><a className="text-link" href="/contact">Start a conversation <Arrow diagonal /></a></div>
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
