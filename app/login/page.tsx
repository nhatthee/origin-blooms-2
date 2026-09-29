import type { Metadata } from "next";
import { SiteChrome } from "../../components/SiteChrome";
import { SiteFooter } from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "Login | Origin Blooms",
  description: "Origin Blooms account login.",
};

export default function LoginPage() {
  return (
    <>
      <SiteChrome />
      <main>
        <section className="placeholder-page section-shell" aria-labelledby="login-title">
          <p className="eyebrow">ACCOUNT</p>
          <h1 id="login-title">Login</h1>
          <p className="placeholder-page-copy">Login coming soon</p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
