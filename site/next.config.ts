import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // shared/mdx-pipeline.ts lives at the repo root, outside site/ — Turbopack
  // refuses to resolve anything outside its project root by default, so
  // this widens it. Set once here rather than symlinking shared/ into
  // site/, which hits the same "points out of the filesystem root" failure
  // content/registry.json's symlink already ran into (see lib/registry.ts).
  turbopack: {
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
