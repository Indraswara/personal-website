import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "admin — egolab.top" };

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/posts", label: "Posts" },
  { href: "/ctf", label: "CTF" },
  { href: "/projects", label: "Projects" },
  { href: "/experience", label: "Experience" },
  { href: "/education", label: "Education" },
];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <nav className="flex items-center gap-6 border-b border-border px-6 py-4">
          <Link href="/" className="font-bold text-fg">
            <span className="text-accent">$</span> admin
          </Link>
          <ul className="flex gap-5 text-sm">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-fg-muted hover:text-fg">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="w-full px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
