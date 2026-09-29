import type { Metadata } from "next";
import { ComingSoonPage } from "../../components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Shipping | Origin Blooms",
  description: "Shipping information for Origin Blooms.",
};

export default function ShippingPage() {
  return <ComingSoonPage title="Shipping" description="Details coming soon" />;
}
