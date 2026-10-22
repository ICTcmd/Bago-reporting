import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true, // Workaround for Next.js type validation
  },
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint during build
  },
};

export default nextConfig;
