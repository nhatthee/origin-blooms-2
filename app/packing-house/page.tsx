import type { Metadata } from "next";
import { PackingHouseSlideshow } from "../../components/PackingHouseSlideshow";
import { SiteChrome } from "../../components/SiteChrome";
import { SiteFooter } from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "Packing House | Origin Blooms",
  description:
    "A closer look at how fresh-cut orchids are prepared and packed before they travel to their next destination.",
};

const PACKING_HOUSE_IMAGES = [
  {
    src: "/images/packing-house/packing-house-3.png",
    alt: "Fresh-cut orchids prepared and packed for their journey",
  },
  {
    src: "/images/packing-house/packing-house-1.png",
    alt: "Packed orchid stems arranged for transport",
  },
  {
    src: "/images/packing-house/packing-house-2.png",
    alt: "Fresh-cut orchids in packing house preparation",
  },
];

export default function PackingHousePage() {
  return (
    <>
      <SiteChrome />
      <main>
        <section className="about-story section-shell" aria-labelledby="packing-house-title">
          <div className="about-story-grid">
            <p className="eyebrow about-story-eyebrow">PACKING HOUSE</p>
            <div className="about-story-copy">
              <h1 id="packing-house-title">Prepared with care.</h1>
              <div className="about-story-body">
                <p>
                  Every orchid&apos;s journey continues beyond the farm. This page offers a closer look
                  at the preparation and packing of fresh-cut orchids before they travel to their next
                  destination.
                </p>
                <p>
                  From cut stems to finished bouquets and loose blooms, packing is an important part
                  of presenting each product for the floral work ahead.
                </p>
                <p>
                  Explore our product details for the packing options available for each variety, and
                  include your requirements when requesting a quote.
                </p>
                <p className="about-story-closing">From their origin to your next creation.</p>
                <div className="about-story-gmp">
                  <h2 className="about-story-gmp-title">GMP Certified Packing House</h2>
                  <p>
                    Our packing house is GMP certified, reflecting our commitment to good
                    manufacturing practices in the preparation and packing of fresh-cut orchids.
                  </p>
                  <p className="about-story-closing">
                    Care in every step. From preparation to packing.
                  </p>
                </div>
              </div>
            </div>
            <div className="about-story-visual packing-house-visual">
              <PackingHouseSlideshow images={PACKING_HOUSE_IMAGES} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
