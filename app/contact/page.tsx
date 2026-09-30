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
        <section className="contact-page section-shell" aria-label="Contact">
          {/* Intro is rendered inside ContactForm so it hides on Confirm / success. */}
          <ContactForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
