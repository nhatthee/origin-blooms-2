import type { Metadata } from "next";
import { InquiryList } from "../../components/InquiryList";
import { SiteChrome } from "../../components/SiteChrome";
import { SiteFooter } from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "Inquiry List | Origin Blooms",
  description:
    "Review the orchid varieties you’ve selected and request a wholesale quote from Origin Blooms.",
};

export default function InquiryPage() {
  return (
    <>
      <SiteChrome />
      <main>
        <InquiryList />
      </main>
      <SiteFooter />
    </>
  );
}
