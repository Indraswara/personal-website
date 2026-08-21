import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import { getWriteupSource } from "@/lib/ctf";
import MdxContent from "@/components/MdxContent";
import PageContainer from "@/components/PageContainer";

export const revalidate = 60;
export const dynamicParams = true;

export function generateStaticParams() {
  const dir = path.join(process.cwd(), "content/ctf");
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => ({ slug: f.replace(/\.mdx$/, "") }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const wu = getWriteupSource(slug);
  if (!wu) return { title: "Writeup not found — Indraswara" };
  return { title: `${wu.meta.title} — Indraswara` };
}

export default async function CtfDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const wu = getWriteupSource(slug);
  if (!wu) notFound();

  return (
    <PageContainer>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="mb-2 border-b-2 border-fg pb-2.5 text-xl font-bold">{wu.meta.title}</h1>
          <p className="-mt-2.5 text-[13px] text-fg-subtle">
            {wu.meta.event}
            {wu.meta.category ? ` · ${wu.meta.category}` : ""}
            {wu.meta.difficulty ? ` · ${wu.meta.difficulty}` : ""}
            {wu.meta.points !== undefined ? ` · ${wu.meta.points} pts` : ""}
          </p>
        </div>
        <MdxContent source={wu.content} />
        <div>
          <Link
            href="/ctf"
            className="inline-flex items-center gap-1.5 rounded-sm border border-border px-4 py-2 text-[13px] text-fg transition-colors hover:bg-bg-inset"
          >
            ← Back to CTF Writeups
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
