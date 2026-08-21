"use client";

import MdxEditor, { type FieldSchema } from "@/components/MdxEditor";
import { saveCtf } from "@/lib/actions";

const FIELDS: FieldSchema[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "event", label: "Event", type: "text" },
  { key: "eventDate", label: "Event date (ISO)", type: "text" },
  { key: "eventUrl", label: "Event URL (optional)", type: "text" },
  { key: "category", label: "Category (optional)", type: "text" },
  { key: "difficulty", label: "Difficulty (Easy/Medium/Hard)", type: "text" },
  { key: "points", label: "Points (optional)", type: "number" },
];

export default function NewCtfPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-fg">New CTF writeup</h1>
      <MdxEditor
        mode="new"
        slugLocked={false}
        initialSlug=""
        initialFrontmatter={{ eventDate: new Date().toISOString().slice(0, 10) }}
        initialBody=""
        fields={FIELDS}
        backHref="/ctf"
        onSave={saveCtf}
      />
    </div>
  );
}
