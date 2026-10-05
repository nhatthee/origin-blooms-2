import type { Metadata } from "next";
import { SignupForm } from "../../components/SignupForm";
import { SiteChrome } from "../../components/SiteChrome";
import { SiteFooter } from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "Sign up | Origin Blooms",
  description: "Create an Origin Blooms account.",
};

export default function SignupPage() {
  return (
    <>
      <SiteChrome />
      <main>
        <section className="account-page section-shell" aria-labelledby="signup-title">
          <header className="account-page-intro">
            <p className="eyebrow">ACCOUNT</p>
            <h1 id="signup-title">Create your account</h1>
          </header>
          <SignupForm />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
