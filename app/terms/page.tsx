import type { Metadata } from "next";
import { ComingSoonPage } from "../../components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Terms | Origin Blooms",
  description: "Terms information for Origin Blooms.",
};

export default function TermsPage() {
  return <ComingSoonPage title="Terms" description="Details coming soon" />;
}
