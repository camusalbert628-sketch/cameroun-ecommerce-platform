import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  outputFileTracingIncludes: {
    "/**": ["./prisma/seed.db"],
  },
};

export default nextConfig;
