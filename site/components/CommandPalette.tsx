"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CV_PATH, SSH_COMMAND } from "@/lib/content";

interface Command {
  label: string;
  hint: string;
  action: () => void;
}

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    { label: "Home", hint: "go", action: () => router.push("/") },
    { label: "Experience", hint: "go", action: () => router.push("/experience") },
    { label: "Projects", hint: "go", action: () => router.push("/project") },
    { label: "Posts", hint: "go", action: () => router.push("/post") },
    { label: "CTF Writeups", hint: "go", action: () => router.push("/ctf") },
    { label: "Education", hint: "go", action: () => router.push("/education") },
    { label: "Homelab", hint: "go", action: () => router.push("/homelab") },
    { label: "HTML Checker", hint: "go", action: () => router.push("/html-checker") },
    { label: "Playground", hint: "go", action: () => router.push("/playground") },
    { label: "Download CV", hint: "open", action: () => window.open(CV_PATH, "_blank") },
    {
      label: "SSH into the lab",
      hint: "copy",
      action: () => {
        navigator.clipboard?.writeText(SSH_COMMAND).catch(() => {});
      },
    },
    {
      label: "Toggle dark mode",
      hint: "do",
      action: () => document.querySelector<HTMLButtonElement>(".theme-toggle-btn")?.click(),
    },
    { label: "GitHub", hint: "open", action: () => window.open("https://github.com/indraswara", "_blank") },
  ];

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[selected];
        if (cmd) {
          setOpen(false);
          cmd.action();
        }
      }
    }
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [open, filtered, selected]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(filtered.length - 1, 0)));
  }, [query, filtered.length]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 pt-[12vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-label="Command palette"
        className="w-[min(560px,92vw)] overflow-hidden rounded-lg border border-border bg-bg-elevated shadow-[var(--shadow)]"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command or search…"
          autoComplete="off"
          className="w-full border-b border-border bg-transparent px-4 py-3.5 text-[15px] text-fg outline-none"
        />
        <ul className="max-h-80 list-none overflow-y-auto">
          {filtered.map((cmd, i) => (
            <li
              key={cmd.label}
              onClick={() => {
                setOpen(false);
                cmd.action();
              }}
              onMouseEnter={() => setSelected(i)}
              className={`flex cursor-pointer justify-between px-4 py-2.5 text-sm ${
                i === selected ? "bg-bg-inset text-fg" : "text-fg-muted"
              }`}
            >
              <span>{cmd.label}</span>
              <span className="text-xs tracking-wider text-fg-subtle uppercase">{cmd.hint}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
