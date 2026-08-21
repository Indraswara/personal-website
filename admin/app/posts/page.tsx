import Link from "next/link";
import { POSTS_DIR, listMdxSlugs, readMdx } from "@/lib/content";

export const dynamic = "force-dynamic"; // reads /repo, which only exists at runtime via the bind mount, not during docker build

export default function PostsListPage() {
  const slugs = listMdxSlugs(POSTS_DIR);
  const posts = slugs.map((slug) => ({ slug, doc: readMdx(POSTS_DIR, slug) }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-fg">Posts</h1>
        <Link href="/posts/new" className="rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-accent-fg">
          + New post
        </Link>
      </div>
      <ul className="flex flex-col gap-2">
        {posts.map(({ slug, doc }) => (
          <li key={slug}>
            <Link
              href={`/posts/${slug}`}
              className="flex items-center justify-between rounded-md border border-border bg-bg-elevated px-4 py-3 hover:border-accent"
            >
              <span className="font-medium text-fg">{String(doc?.frontmatter.title ?? slug)}</span>
              <span className="text-xs text-fg-subtle">{String(doc?.frontmatter.date ?? "")}</span>
            </Link>
          </li>
        ))}
        {posts.length === 0 && <p className="text-sm text-fg-subtle">No posts yet.</p>}
      </ul>
    </div>
  );
}
