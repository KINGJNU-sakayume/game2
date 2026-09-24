import type { NextConfig } from "next";

// GitHub Pages hosts this repository as a project site. Keep development at `/`
// while emitting production URLs beneath the repository path.
const isProduction = process.env.NODE_ENV === "production";
const basePath = isProduction ? "/game2" : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // A trailing slash lets Pages resolve routes to their exported index.html files.
  trailingSlash: true,
  // Pages cannot run Next.js' on-demand image optimizer.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
