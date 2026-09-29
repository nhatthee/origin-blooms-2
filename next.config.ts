import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow phone/LAN testing against this Mac's IP during `next dev`.
  // Without this, Next.js 15 warns (and may block) cross-origin /_next/* requests.
  allowedDevOrigins: ["10.20.3.224"],
  async redirects() {
    return [
      {
        source: "/our-story",
        destination: "/about-us",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
