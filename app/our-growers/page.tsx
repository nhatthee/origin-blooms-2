import type { Metadata } from "next";
import { PackingHouseSlideshow } from "../../components/PackingHouseSlideshow";
import { SiteChrome } from "../../components/SiteChrome";
import { SiteFooter } from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "Our Growers | Origin Blooms",
  description:
    "Meet the Thai growers behind Origin Blooms orchids—and how GAP-certified practices support careful cultivation from farm to harvest.",
};

const OUR_GROWERS_IMAGES = [
  {
    src: "/images/growers/growers-1.png",
    alt: "Thai orchid growers tending Dendrobium plants on the farm",
  },
  {
    src: "/images/growers/growers-2.png",
    alt: "Careful growing and handling of orchids in Thailand",
  },
  {
    src: "/images/growers/growers-3.png",
    alt: "Fresh-cut orchids harvested with care by our growers",
  },
];

export default function OurGrowersPage() {
  return (
    <>
      <SiteChrome />
      <main>
        <section className="about-story section-shell" aria-labelledby="our-growers-title">
          <div className="about-story-grid">
            <p className="eyebrow about-story-eyebrow">OUR GROWERS</p>
            <div className="about-story-copy">
              <h1 id="our-growers-title" className="our-growers-title">
                Great flowers begin with thoughtful growing.
              </h1>
              <div className="about-story-body">
                <p>
                  Our orchids begin their journey with growers in Thailand. Their care and attention
                  at the farm shape the flowers that florists, designers, and wholesale buyers turn
                  into something beautiful.
                </p>
                <div className="about-story-gmp">
                  <h2 className="about-story-gmp-title">GAP Certified Growers</h2>
                  <p>
                    We work with GAP-certified growers who follow Good Agricultural Practices in
                    orchid cultivation. These practices support responsible farm management and
                    careful attention to growing and handling flowers.
                  </p>
                  <p>
                    For our customers, that means a connection to growers who value the work behind
                    every stem—from the growing environment to the moment of harvest.
                  </p>
                  <p className="about-story-closing">
                    Rooted in care. Ready for your next creation.
                  </p>
                </div>
              </div>
            </div>
            <div className="about-story-visual packing-house-visual">
              <PackingHouseSlideshow images={OUR_GROWERS_IMAGES} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
