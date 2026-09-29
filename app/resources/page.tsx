import type { Metadata } from "next";
import { SiteChrome } from "../../components/SiteChrome";
import { SiteFooter } from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "Resources | Origin Blooms",
  description: "Resources for Origin Blooms florists, event designers, and wholesale buyers.",
};

export default function ResourcesPage() {
  return (
    <>
      <SiteChrome />
      <main>
        <section className="placeholder-page section-shell" aria-labelledby="resources-title">
          <p className="eyebrow">RESOURCES</p>
          <h1 id="resources-title">Resources</h1>
          <p className="placeholder-page-copy">This page is coming soon.</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
