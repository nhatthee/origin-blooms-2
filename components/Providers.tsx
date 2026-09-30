"use client";

import { InquiryProvider } from "./InquiryProvider";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <InquiryProvider>{children}</InquiryProvider>;
}
