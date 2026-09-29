import type { Metadata } from "next";
import { ComingSoonPage } from "../../components/ComingSoonPage";

export const metadata: Metadata = {
  title: "Payment | Origin Blooms",
  description: "Payment information for Origin Blooms.",
};

export default function PaymentPage() {
  return <ComingSoonPage title="Payment" description="Details coming soon" />;
}
