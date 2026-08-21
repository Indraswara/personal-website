import fs from "fs";
import path from "path";
import type { TimelineItem } from "./types";

// Same reasoning as lib/registry.ts: fs.readFileSync at request time, not a
// static import — keeps this admin-editable at runtime without a rebuild.
const SITE_DATA_PATH = path.join(process.cwd(), "content/site-data.json");

function readSiteData(): { experience: TimelineItem[]; education: TimelineItem[] } {
  const raw = fs.readFileSync(SITE_DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

export function getExperience(): TimelineItem[] {
  return readSiteData().experience ?? [];
}

export function getEducation(): TimelineItem[] {
  return readSiteData().education ?? [];
}
