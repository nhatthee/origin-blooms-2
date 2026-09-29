import type { Metadata } from "next";
import { ContactForm } from "../../components/ContactForm";
import { SiteChrome } from "../../components/SiteChrome";
import { SiteFooter } from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "Contact | Origin Blooms",
  description:
    "Tell Origin Blooms what you’re looking for—cut orchids, loose blooms, quantities, and delivery needs—and we’ll get back to you.",
};

export default function ContactPage() {
  return (
    <>
      <SiteChrome />
      <main>
        <section className="contact-page section-shell" aria-labelledby="contact-page-title">
          <div className="contact-page-intro">
            <p className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" />
              WHOLESALE INQUIRY
            </p>
            <h1 id="contact-page-title">Let&apos;s talk orchids.</h1>
            <p className="contact-page-lead">
              Tell us what you&apos;re looking for, and we&apos;ll get back to you.
            </p>
          </div>
          <ContactForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
