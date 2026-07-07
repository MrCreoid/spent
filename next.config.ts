import type { NextConfig } from "next";

// Set by the GitHub Pages workflow (e.g. "/spent"); empty for local/root deploys
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
