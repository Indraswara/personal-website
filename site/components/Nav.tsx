"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/experience", label: "Experience" },
  { href: "/project", label: "Projects" },
  { href: "/post", label: "Posts" },
  { href: "/ctf", label: "CTF" },
  { href: "/education", label: "Education" },
  { href: "/homelab", label: "Homelab" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="mb-10 flex items-center justify-between border-b border-border pb-5">
      <Link href="/" className="text-xl font-bold tracking-widest text-fg">
        <span className="text-accent">$</span> indraswara
      </Link>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle navigation"
        aria-expanded={open}
        className="z-10 flex h-8 w-8 items-center justify-center sm:hidden"
      >
        <span className="relative block h-0.5 w-5 bg-fg before:absolute before:-top-1.5 before:h-0.5 before:w-5 before:bg-fg after:absolute after:top-1.5 after:h-0.5 after:w-5 after:bg-fg" />
      </button>

      {open && (
        <button
          aria-hidden
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[4] bg-black/40 sm:hidden"
        />
      )}

      <div
        className={`fixed top-0 right-0 z-[5] flex h-full w-64 flex-col gap-0 border-l border-border bg-bg px-8 py-20 shadow-[var(--shadow)] transition-[right] duration-300 sm:static sm:z-auto sm:h-auto sm:w-auto sm:flex-row sm:items-center sm:gap-6 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none ${
          open ? "right-0" : "-right-full sm:right-0"
        }`}
      >
        <ul className="flex flex-col gap-0 sm:flex-row sm:items-center sm:gap-8">
          {LINKS.map((link) => (
            <li key={link.href} className="border-b border-border sm:border-0">
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className={`relative block py-3.5 text-sm sm:py-0 ${
                  isActive(link.href) ? "font-bold text-fg" : "text-fg opacity-80 hover:opacity-100"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute -bottom-1 left-0 hidden h-0.5 w-full bg-fg sm:block" />
                )}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-5 sm:mt-0">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
