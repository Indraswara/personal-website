import { notFound } from "next/navigation";
import { CTF_DIR, readMdx } from "@/lib/content";
import CtfEditorClient from "./editor-client";

export const dynamic = "force-dynamic";

export default async function EditCtfPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = readMdx(CTF_DIR, slug);
  if (!doc) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-fg">Edit writeup</h1>
      <CtfEditorClient slug={slug} frontmatter={doc.frontmatter} body={doc.body} />
    </div>
  );
}
