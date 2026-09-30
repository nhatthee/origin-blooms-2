"use client";

import { InquiryMobileBar } from "./InquiryMobileBar";
import { InquiryProvider } from "./InquiryProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <InquiryProvider>
      {children}
      <InquiryMobileBar />
    </InquiryProvider>
  );
}
