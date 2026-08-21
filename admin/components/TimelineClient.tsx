"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveTimeline } from "@/lib/actions";

interface TimelineItem {
  title: string;
  date: string;
  description: string;
  tags: string[];
}

function blank(): TimelineItem {
  return { title: "", date: "", description: "", tags: [] };
}

export default function TimelineClient({
  section,
  initialItems,
}: {
  section: "experience" | "education";
  initialItems: TimelineItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<TimelineItem[]>(initialItems);
  const [tagInputs, setTagInputs] = useState<string[]>(initialItems.map((i) => i.tags.join(", ")));
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  function update(i: number, patch: Partial<TimelineItem>) {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }

  function updateTags(i: number, raw: string) {
    setTagInputs((prev) => prev.map((t, idx) => (idx === i ? raw : t)));
    update(i, { tags: raw.split(",").map((t) => t.trim()).filter(Boolean) });
  }

  function addItem() {
    setItems((prev) => [...prev, blank()]);
    setTagInputs((prev) => [...prev, ""]);
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    setTagInputs((prev) => prev.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setTagInputs((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function saveAll() {
    startTransition(async () => {
      setStatus("saving…");
      const result = await saveTimeline(section, items);
      setStatus(result.ok ? "saved & pushed" : `error: ${result.error}`);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-border bg-bg-elevated p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex gap-1">
              <button
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded border border-border px-2 py-0.5 text-xs text-fg-muted disabled:opacity-30"
              >
                ↑
              </button>
              <button
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                className="rounded border border-border px-2 py-0.5 text-xs text-fg-muted disabled:opacity-30"
              >
                ↓
              </button>
            </div>
            <button onClick={() => removeItem(i)} className="text-xs text-danger hover:underline">
              remove
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-fg-muted">Title</span>
              <input
                value={item.title}
                onChange={(e) => update(i, { title: e.target.value })}
                className="rounded-md border border-border bg-bg-inset px-2 py-1.5 text-fg"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-fg-muted">Date</span>
              <input
                value={item.date}
                onChange={(e) => update(i, { date: e.target.value })}
                placeholder="MM/YYYY - Present"
                className="rounded-md border border-border bg-bg-inset px-2 py-1.5 text-fg"
              />
            </label>
          </div>
          <label className="mt-3 flex flex-col gap-1 text-sm">
            <span className="text-fg-muted">Description</span>
            <textarea
              value={item.description}
              onChange={(e) => update(i, { description: e.target.value })}
              rows={2}
              className="rounded-md border border-border bg-bg-inset px-2 py-1.5 text-fg"
            />
          </label>
          <label className="mt-3 flex flex-col gap-1 text-sm">
            <span className="text-fg-muted">Tags (comma-separated)</span>
            <input
              value={tagInputs[i]}
              onChange={(e) => updateTags(i, e.target.value)}
              className="rounded-md border border-border bg-bg-inset px-2 py-1.5 text-fg"
            />
          </label>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button onClick={addItem} className="rounded-md border border-border px-3 py-1.5 text-sm text-fg hover:border-accent">
          + Add entry
        </button>
        <button
          onClick={saveAll}
          disabled={isPending}
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-bold text-accent-fg disabled:opacity-50"
        >
          Save & publish
        </button>
        <span className="text-xs text-fg-subtle">{status}</span>
      </div>
    </div>
  );
}
