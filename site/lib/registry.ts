// content/registry.json lives at the repo root and is the single source of
// truth read by the website, the terminal backend's TUI (Go), and
// scripts/*.sh (jq) — do not duplicate its contents, and do not move the
// canonical file. Read via fs (not a static import) because Turbopack
// doesn't follow the site/content/registry.json -> ../../content/registry.json
// symlink used for local dev; the Docker build instead copies the real file
// to this same relative path, so this code path is identical in both.
import fs from "node:fs";
import path from "node:path";
import type { ProjectItem, RegistryLabEntry } from "./types";

const REGISTRY_PATH = path.join(process.cwd(), "content/registry.json");

function readRegistry(): RegistryLabEntry[] {
  const raw = fs.readFileSync(REGISTRY_PATH, "utf8");
  return (JSON.parse(raw).projects ?? []) as RegistryLabEntry[];
}

export function getAllProjects(): ProjectItem[] {
  return readRegistry().map((p) => ({
    title: p.title,
    date: p.date,
    description: p.description,
    tags: p.tags ?? [],
    link: p.repo,
    slug: p.slug,
    web: p.web,
    lab: p.lab,
    site: p.site,
  }));
}

export function getLabRegistry(): RegistryLabEntry[] {
  return readRegistry();
}
