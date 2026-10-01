import type { Metadata } from "next";
import Image from "next/image";
import { SiteChrome } from "../../components/SiteChrome";
import { SiteFooter } from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "Our Story | Origin Blooms",
  description:
    "Origin Blooms imports fresh-cut Dendrobium orchids from Thailand and distributes them across the United States for florists, event designers, and wholesale buyers.",
};

export default function OurStoryPage() {
  return (
    <>
      <SiteChrome />
      <main>
        <section className="about-story section-shell" aria-labelledby="about-story-title">
          <div className="about-story-grid">
            <p className="eyebrow about-story-eyebrow">THE ORIGIN STORY</p>
            <div className="about-story-copy">
              <h1 id="about-story-title">Where It Begins Matters</h1>
              <div className="about-story-body">
                <p>
                  Before an orchid becomes part of an arrangement, it belongs to a place. For Origin
                  Blooms, that place is Thailand.
                </p>
                <p>
                  We are a family-owned business based in Colorado Springs, Colorado. We import
                  fresh-cut Dendrobium orchids directly from farms in Thailand and distribute them
                  across the United States. Our connection to the growers is at the heart of our
                  name: we want the flowers&apos; origin to remain part of their story, even as they
                  find their way into new hands and new spaces.
                </p>
                <p>
                  Our collection includes the vivid color of Sonia Purple, the quiet elegance of
                  Sonia White, and loose blooms for intricate floral work. We serve florists, event
                  designers, and wholesale buyers who see more than a flower in each stem. They see
                  the beginning of an idea.
                </p>
                <p>
                  From the farms where the orchids are grown to the people who give them new
                  purpose, Origin Blooms brings both sides of that story together.
                </p>
                <p className="about-story-closing">
                  It begins in Thailand. What it becomes is yours to create.
                </p>
              </div>
            </div>
            <div className="about-story-visual photo-slot">
              <Image
                src="/images/about/orchid-packing-thailand.png"
                alt="Fresh-cut Dendrobium orchids being prepared for export in Thailand"
                fill
                sizes="(max-width: 760px) 100vw, (max-width: 1100px) 45vw, min(520px, 42vw)"
                style={{ objectFit: "cover", objectPosition: "center" }}
                priority
              />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
