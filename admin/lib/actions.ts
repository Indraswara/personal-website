"use server";

import { revalidatePath } from "next/cache";
import fs from "node:fs";
import path from "node:path";
import {
  POSTS_DIR,
  CTF_DIR,
  REGISTRY_PATH,
  SITE_DATA_PATH,
  IMAGES_DIR,
  assertValidSlug,
  writeMdx,
  deleteMdx,
  readJson,
  writeJson,
} from "./content";
import { commitAndPush } from "./git";
import { triggerRevalidate } from "./revalidate";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// ---- Posts ----

export async function savePost(
  slug: string,
  frontmatter: Record<string, unknown>,
  body: string,
): Promise<ActionResult> {
  try {
    assertValidSlug(slug);
    const file = writeMdx(POSTS_DIR, slug, frontmatter, body);
    await commitAndPush([file], `post: update ${slug}`);
    await triggerRevalidate("/post");
    await triggerRevalidate(`/post/${slug}`);
    revalidatePath("/posts");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function removePost(slug: string): Promise<ActionResult> {
  try {
    const file = deleteMdx(POSTS_DIR, slug);
    const result = await commitAndPush([file], `post: remove ${slug}`);
    if (!result.committed) {
      // The file is gone from disk either way (deleteMdx already ran) —
      // but git saw nothing to stage, which for a *delete* specifically
      // means the file was never tracked in the first place. Silently
      // reporting success here is how a real deletion went unrecorded
      // once already; surface it loudly instead.
      throw new Error(
        `deleted from disk, but git had nothing to commit (the file was never tracked) — this delete is NOT recorded in git history`,
      );
    }
    await triggerRevalidate("/post");
    await triggerRevalidate(`/post/${slug}`);
    revalidatePath("/posts");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ---- CTF writeups ----

export async function saveCtf(
  slug: string,
  frontmatter: Record<string, unknown>,
  body: string,
): Promise<ActionResult> {
  try {
    assertValidSlug(slug);
    const file = writeMdx(CTF_DIR, slug, frontmatter, body);
    await commitAndPush([file], `ctf: update ${slug}`);
    await triggerRevalidate("/ctf");
    await triggerRevalidate(`/ctf/${slug}`);
    revalidatePath("/ctf");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function removeCtf(slug: string): Promise<ActionResult> {
  try {
    const file = deleteMdx(CTF_DIR, slug);
    const result = await commitAndPush([file], `ctf: remove ${slug}`);
    if (!result.committed) {
      throw new Error(
        `deleted from disk, but git had nothing to commit (the file was never tracked) — this delete is NOT recorded in git history`,
      );
    }
    await triggerRevalidate("/ctf");
    await triggerRevalidate(`/ctf/${slug}`);
    revalidatePath("/ctf");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ---- Projects (content/registry.json) ----
// Deliberately narrow: admin can only edit title/date/description/tags on
// an *existing* entry, or delete one outright. repo/web/lab/site are
// infra-wiring set up alongside a real Docker service + DNS + Cloudflare
// ingress when a project was deployed — editing those here without doing
// that work would just silently break the project's live status badge or
// its playground command, so the form never exposes them.

interface RegistryEntry {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  repo?: string;
  web?: unknown;
  lab?: unknown;
  site?: string;
}

export async function updateProjectMeta(
  slug: string,
  fields: { title: string; date: string; description: string; tags: string[] },
): Promise<ActionResult> {
  try {
    const data = readJson<{ projects: RegistryEntry[] }>(REGISTRY_PATH);
    const entry = data.projects.find((p) => p.slug === slug);
    if (!entry) return { ok: false, error: `no project with slug "${slug}"` };
    Object.assign(entry, fields);
    const file = writeJson(REGISTRY_PATH, data);
    await commitAndPush([file], `projects: update ${slug}`);
    await triggerRevalidate("/project");
    revalidatePath("/projects");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function addProject(fields: {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  repo?: string;
}): Promise<ActionResult> {
  try {
    assertValidSlug(fields.slug);
    const data = readJson<{ projects: RegistryEntry[] }>(REGISTRY_PATH);
    if (data.projects.some((p) => p.slug === fields.slug)) {
      return { ok: false, error: `a project with slug "${fields.slug}" already exists` };
    }
    // No web/lab/site here on purpose (see the comment above) — a project
    // added from here is a portfolio card only, same as this repo's own
    // hand-written entries with no live demo. Wiring a real subdomain/
    // playground command needs an actual deploy, done outside this app.
    const entry: RegistryEntry = {
      slug: fields.slug,
      title: fields.title,
      date: fields.date,
      description: fields.description,
      tags: fields.tags,
      ...(fields.repo ? { repo: fields.repo } : {}),
    };
    data.projects.push(entry);
    const file = writeJson(REGISTRY_PATH, data);
    await commitAndPush([file], `projects: add ${fields.slug}`);
    await triggerRevalidate("/project");
    revalidatePath("/projects");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function removeProject(slug: string): Promise<ActionResult> {
  try {
    const data = readJson<{ projects: RegistryEntry[] }>(REGISTRY_PATH);
    const before = data.projects.length;
    data.projects = data.projects.filter((p) => p.slug !== slug);
    if (data.projects.length === before) return { ok: false, error: `no project with slug "${slug}"` };
    const file = writeJson(REGISTRY_PATH, data);
    await commitAndPush([file], `projects: remove ${slug}`);
    await triggerRevalidate("/project");
    revalidatePath("/projects");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ---- Experience / Education (content/site-data.json) ----

interface TimelineItem {
  title: string;
  date: string;
  description: string;
  tags: string[];
}

interface SiteData {
  experience: TimelineItem[];
  education: TimelineItem[];
}

export async function saveTimeline(
  section: "experience" | "education",
  items: TimelineItem[],
): Promise<ActionResult> {
  try {
    const data = readJson<SiteData>(SITE_DATA_PATH);
    data[section] = items;
    const file = writeJson(SITE_DATA_PATH, data);
    await commitAndPush([file], `${section}: update`);
    await triggerRevalidate(`/${section}`);
    revalidatePath(`/${section}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ---- Image upload (site/public/posts/images) ----

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export interface UploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

// Committed immediately on upload (its own small commit), not deferred to
// the post's own save — simpler than tracking "images pending this editing
// session" across the editor, at the cost of an extra commit if a writer
// uploads an image but abandons the post. Acceptable trade for a solo-use
// internal tool.
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "no file provided" };
    if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "image too large (max 8MB)" };
    const ext = ALLOWED_EXT[file.type];
    if (!ext) return { ok: false, error: `unsupported image type: ${file.type || "unknown"}` };

    fs.mkdirSync(IMAGES_DIR, { recursive: true });
    const base = path
      .basename(file.name, path.extname(file.name))
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image";
    const filename = `${Date.now()}-${base}.${ext}`;
    const dest = path.join(IMAGES_DIR, filename);

    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(dest, buf);

    const relFile = path.relative("/repo", dest);
    await commitAndPush([relFile], `assets: add ${filename}`);

    return { ok: true, url: `/posts/images/${filename}` };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
