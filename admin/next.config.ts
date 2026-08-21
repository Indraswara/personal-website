import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // shared/mdx-pipeline.ts lives at the repo root, outside admin/ — see
  // site/next.config.ts for the full explanation (same reasoning here).
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
