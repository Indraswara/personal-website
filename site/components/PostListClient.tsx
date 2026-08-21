"use client";

import { useState } from "react";
import Link from "next/link";
import type { PostMeta } from "@/lib/types";
import { formatDisplayDate, capitalize } from "@/lib/format";
import Tags from "./Tags";

export default function PostListClient({ posts }: { posts: PostMeta[] }) {
  const categories = Array.from(new Set(["all", ...posts.map((p) => p.category || "article")]));
  const [active, setActive] = useState("all");

  const filtered = active === "all" ? posts : posts.filter((p) => (p.category || "article") === active);

  return (
    <section>
      <h1 className="mb-7 border-b-2 border-fg pb-2.5 text-xl font-bold">Posts</h1>

      {categories.length > 2 && (
        <div className="mb-7 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`rounded-sm border px-3.5 py-1.5 text-xs transition-colors ${
                active === cat
                  ? "border-fg bg-fg text-bg"
                  : "border-border text-fg-muted hover:border-fg hover:text-fg"
              }`}
            >
              {cat === "all" ? "All" : capitalize(cat) + "s"}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-fg-subtle">No items yet</p>
      ) : (
        <div className="flex flex-col gap-10">
          {filtered.map((post) => (
            <div key={post.slug} className="border-l-2 border-border pl-5 transition-colors hover:border-fg">
              <div className="flex items-start justify-between gap-3">
                <h2 className="mb-1 text-lg font-bold">{post.title}</h2>
                <span className="text-xs whitespace-nowrap text-fg-subtle">
                  {formatDisplayDate(post.date)}
                </span>
              </div>
              <p className="mb-2.5 text-sm text-fg-muted">{post.description}</p>
              <Tags tags={post.tags} />
              <div className="mt-3.5">
                <Link
                  href={`/post/${post.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border px-4 py-2 text-[13px] text-fg transition-colors hover:bg-bg-inset"
                >
                  Read More
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
