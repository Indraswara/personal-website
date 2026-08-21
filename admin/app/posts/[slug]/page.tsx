import { notFound } from "next/navigation";
import { POSTS_DIR, readMdx } from "@/lib/content";
import PostEditorClient from "./editor-client";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = readMdx(POSTS_DIR, slug);
  if (!doc) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-fg">Edit post</h1>
      <PostEditorClient slug={slug} frontmatter={doc.frontmatter} body={doc.body} />
    </div>
  );
}
