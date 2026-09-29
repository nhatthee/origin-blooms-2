import type { Metadata } from "next";
import { ComingSoonPage } from "../../components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Returns | Origin Blooms",
  description: "Returns information for Origin Blooms.",
};

export default function ReturnsPage() {
  return <ComingSoonPage title="Returns" description="Details coming soon" />;
}
