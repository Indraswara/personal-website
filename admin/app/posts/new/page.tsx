"use client";

import MdxEditor, { type FieldSchema } from "@/components/MdxEditor";
import { savePost } from "@/lib/actions";

const FIELDS: FieldSchema[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "date", label: "Date (ISO)", type: "text" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "tags", label: "Tags", type: "tags" },
  { key: "category", label: "Category (optional)", type: "text" },
];

export default function NewPostPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-fg">New post</h1>
      <MdxEditor
        mode="new"
        slugLocked={false}
        initialSlug=""
        initialFrontmatter={{ date: new Date().toISOString().slice(0, 10) }}
        initialBody=""
        fields={FIELDS}
        backHref="/posts"
        onSave={savePost}
      />
    </div>
  );
}
