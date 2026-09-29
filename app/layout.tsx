import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Origin Blooms | Thai Cut Orchids",
  description:
    "Explore fresh-cut Thai Dendrobium orchids for florists, event designers, and wholesale buyers.",
  icons: {
    icon: [{ url: "/images/logo/origin-blooms-monogram.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F0F6" },
    { media: "(prefers-color-scheme: dark)", color: "#F5F0F6" },
  ],
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className={plusJakartaSans.className}>{children}</body>
    </html>
  );
}
