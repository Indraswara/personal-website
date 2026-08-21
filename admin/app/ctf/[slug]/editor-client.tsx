"use client";

import MdxEditor, { type FieldSchema } from "@/components/MdxEditor";
import { saveCtf, removeCtf } from "@/lib/actions";

const FIELDS: FieldSchema[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "event", label: "Event", type: "text" },
  { key: "eventDate", label: "Event date (ISO)", type: "text" },
  { key: "eventUrl", label: "Event URL (optional)", type: "text" },
  { key: "category", label: "Category (optional)", type: "text" },
  { key: "difficulty", label: "Difficulty (Easy/Medium/Hard)", type: "text" },
  { key: "points", label: "Points (optional)", type: "number" },
];

export default function CtfEditorClient({
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
      backHref="/ctf"
      onSave={saveCtf}
      onDelete={removeCtf}
    />
  );
}
