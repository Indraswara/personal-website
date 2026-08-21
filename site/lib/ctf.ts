import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { CtfEventGroup, CtfFrontmatter, CtfWriteupMeta } from "./types";

const CTF_DIR = path.join(process.cwd(), "content/ctf");

function getAllWriteupsMeta(): CtfWriteupMeta[] {
  const files = fs.readdirSync(CTF_DIR).filter((f) => f.endsWith(".mdx"));
  return files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(CTF_DIR, file), "utf8");
    const { data } = matter(raw);
    return { slug, ...(data as CtfFrontmatter) };
  });
}

// Groups flat writeup files by `event` — mirrors the old nested content/ctf.js
// shape, but the event is inferred from frontmatter instead of maintained by
// hand in a second place.
export function getCtfEventGroups(): CtfEventGroup[] {
  const writeups = getAllWriteupsMeta();
  const groups = new Map<string, CtfEventGroup>();
  for (const w of writeups) {
    const key = `${w.event}::${w.eventDate}`;
    if (!groups.has(key)) {
      groups.set(key, { event: w.event, eventDate: w.eventDate, eventUrl: w.eventUrl, writeups: [] });
    }
    groups.get(key)!.writeups.push(w);
  }
  return Array.from(groups.values()).sort((a, b) => (a.eventDate < b.eventDate ? 1 : -1));
}

export function getWriteupSource(slug: string): { meta: CtfWriteupMeta; content: string } | null {
  const filePath = path.join(CTF_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return { meta: { slug, ...(data as CtfFrontmatter) }, content };
}
