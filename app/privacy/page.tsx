import type { Metadata } from "next";
import { ComingSoonPage } from "../../components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Privacy | Origin Blooms",
  description: "Privacy information for Origin Blooms.",
};

export default function PrivacyPage() {
  return <ComingSoonPage title="Privacy" description="Details coming soon" />;
}
