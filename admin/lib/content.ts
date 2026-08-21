import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// Same bind-mounted working tree lib/git.ts commits against — see
// compose.yml's admin service (`.:/repo` rw).
const REPO_DIR = "/repo";
export const POSTS_DIR = path.join(REPO_DIR, "site/content/posts");
export const CTF_DIR = path.join(REPO_DIR, "site/content/ctf");
export const REGISTRY_PATH = path.join(REPO_DIR, "content/registry.json");
export const SITE_DATA_PATH = path.join(REPO_DIR, "content/site-data.json");

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

// Slugs come straight from user input (form fields / URL segments) and get
// joined into filesystem paths below — reject anything that isn't a plain
// lowercase-kebab token before it ever touches path.join, rather than
// trusting Cloudflare Access + the JWT middleware alone to be the only line
// of defense against a crafted `../../etc/passwd`-style slug.
export function assertValidSlug(slug: string): void {
  if (!SLUG_RE.test(slug)) {
    throw new Error(`invalid slug "${slug}" — lowercase letters, numbers, and hyphens only`);
  }
}

export interface MdxDoc {
  slug: string;
  frontmatter: Record<string, unknown>;
  body: string;
}

export function listMdxSlugs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function readMdx(dir: string, slug: string): MdxDoc | null {
  assertValidSlug(slug);
  const file = path.join(dir, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf-8");
  const { data, content } = matter(raw);
  return { slug, frontmatter: data, body: content };
}

// Returns the path written, repo-relative — callers pass this straight to
// git.commitAndPush so the commit only ever touches the file it meant to.
export function writeMdx(dir: string, slug: string, frontmatter: Record<string, unknown>, body: string): string {
  assertValidSlug(slug);
  const file = path.join(dir, `${slug}.mdx`);
  fs.writeFileSync(file, matter.stringify(body.trim() + "\n", frontmatter), "utf-8");
  return path.relative(REPO_DIR, file);
}

export function deleteMdx(dir: string, slug: string): string {
  assertValidSlug(slug);
  const file = path.join(dir, `${slug}.mdx`);
  fs.unlinkSync(file);
  return path.relative(REPO_DIR, file);
}

export function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

export function writeJson(file: string, data: unknown): string {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf-8");
  return path.relative(REPO_DIR, file);
}
