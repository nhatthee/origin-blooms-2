import { SiteChrome } from "./SiteChrome";
import { SiteFooter } from "./SiteFooter";

type ComingSoonPageProps = {
  title: string;
  description: string;
};

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <>
      <SiteChrome />
      <main>
        <section className="placeholder-page section-shell" aria-labelledby="page-title">
          <h1 id="page-title">{title}</h1>
          <p className="placeholder-page-copy">{description}</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
