import Link from "next/link";

const CARDS = [
  { href: "/posts", title: "Posts", desc: "Blog posts (MDX), rendered at egolab.top/post" },
  { href: "/ctf", title: "CTF Writeups", desc: "Writeups (MDX), rendered at egolab.top/ctf" },
  { href: "/projects", title: "Projects", desc: "Title/date/description/tags on existing project cards" },
  { href: "/experience", title: "Experience", desc: "Timeline entries at egolab.top/experience" },
  { href: "/education", title: "Education", desc: "Timeline entries at egolab.top/education" },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-fg">egolab.top admin</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-lg border border-border bg-bg-elevated p-4 transition-colors hover:border-accent"
          >
            <h2 className="mb-1 font-bold text-fg">{c.title}</h2>
            <p className="text-sm text-fg-muted">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
