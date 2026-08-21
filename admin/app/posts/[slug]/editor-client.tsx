"use client";

import MdxEditor, { type FieldSchema } from "@/components/MdxEditor";
import { savePost, removePost } from "@/lib/actions";

const FIELDS: FieldSchema[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "date", label: "Date (ISO)", type: "text" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "tags", label: "Tags", type: "tags" },
  { key: "category", label: "Category (optional)", type: "text" },
];

export default function PostEditorClient({
  slug,
  frontmatter,
  body,
}: {
  slug: string;
  frontmatter: Record<string, unknown>;
  body: string;
}) {
  return (
    <MdxEditor
      mode="edit"
      slugLocked
      initialSlug={slug}
      initialFrontmatter={frontmatter}
      initialBody={body}
      fields={FIELDS}
      backHref="/posts"
      onSave={savePost}
      onDelete={removePost}
    />
  );
}
