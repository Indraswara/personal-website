import Link from "next/link";
import { CTF_DIR, listMdxSlugs, readMdx } from "@/lib/content";

export const dynamic = "force-dynamic"; // reads /repo, which only exists at runtime via the bind mount, not during docker build

export default function CtfListPage() {
  const slugs = listMdxSlugs(CTF_DIR);
  const writeups = slugs.map((slug) => ({ slug, doc: readMdx(CTF_DIR, slug) }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-fg">CTF Writeups</h1>
        <Link href="/ctf/new" className="rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-accent-fg">
          + New writeup
        </Link>
      </div>
      <ul className="flex flex-col gap-2">
        {writeups.map(({ slug, doc }) => (
          <li key={slug}>
            <Link
              href={`/ctf/${slug}`}
              className="flex items-center justify-between rounded-md border border-border bg-bg-elevated px-4 py-3 hover:border-accent"
            >
              <span className="font-medium text-fg">{String(doc?.frontmatter.title ?? slug)}</span>
              <span className="text-xs text-fg-subtle">{String(doc?.frontmatter.event ?? "")}</span>
            </Link>
          </li>
        ))}
        {writeups.length === 0 && <p className="text-sm text-fg-subtle">No writeups yet.</p>}
      </ul>
    </div>
  );
}
