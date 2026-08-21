import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPostsMeta, getPostSource } from "@/lib/posts";
import { formatDisplayDate } from "@/lib/format";
import MdxContent from "@/components/MdxContent";
import PageContainer from "@/components/PageContainer";

export const revalidate = 60;
export const dynamicParams = true;

export function generateStaticParams() {
  return getAllPostsMeta().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostSource(slug);
  if (!post) return { title: "Post not found — Indraswara" };
  return { title: `${post.meta.title} — Indraswara` };
}

export default async function PostDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostSource(slug);
  if (!post) notFound();

  return (
    <PageContainer>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="mb-2 border-b-2 border-fg pb-2.5 text-xl font-bold">{post.meta.title}</h1>
          <p className="-mt-2.5 text-[13px] text-fg-subtle">
            {formatDisplayDate(post.meta.date)} · {post.meta.tags.join(", ")}
          </p>
        </div>
        <MdxContent source={post.content} />
        <div>
          <Link
            href="/post"
            className="inline-flex items-center gap-1.5 rounded-sm border border-border px-4 py-2 text-[13px] text-fg transition-colors hover:bg-bg-inset"
          >
            ← Back to Posts
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
