import Image from "next/image";
import { Arrow } from "./Arrow";

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

export function SiteFooter() {
  return (
    <footer className="contact" id="contact" aria-labelledby="contact-title">
      <div className="contact-inner">
        <Image
          className="contact-logo"
          src="/images/logo/origin-blooms-white.svg"
          alt="Origin Blooms"
          width={480}
          height={200}
          unoptimized
        />
        <p className="eyebrow">FOR FLORISTS, DESIGNERS & BUYERS</p>
        <div className="contact-company">
          <address>
            <span className="contact-address-line">1025 N Academy Blvd.</span>
            <span className="contact-address-line">Colorado Springs, CO 80909</span>
          </address>
          <p>
            Tel:{" "}
            <a href="tel:+17194185454">(719) 418-5454</a>
          </p>
          <p>
            Cell:{" "}
            <a href="tel:+17192467656">(719) 246-7656</a>
          </p>
          <p>
            E:{" "}
            <a href="mailto:sales@originblooms.com">sales@originblooms.com</a>
          </p>
        </div>
        <h2 id="contact-title">
          Let&apos;s make something <em>beautiful.</em>
        </h2>
        <p>Tell us about your floral needs and we&apos;ll start the conversation.</p>
        {contactEmail ? (
          <a
            className="button button-light"
            href={`mailto:${contactEmail}?subject=Origin%20Blooms%20Wholesale%20Inquiry`}
          >
            Request a quote <Arrow diagonal />
          </a>
        ) : null}
        <p className="contact-copyright">
          © {new Date().getFullYear()} Origin Blooms LLC
        </p>
      </div>
    </footer>
  );
}
