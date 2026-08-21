import type { Metadata } from "next";
import Link from "next/link";
import { getCtfEventGroups } from "@/lib/ctf";
import Tags from "@/components/Tags";
import PageContainer from "@/components/PageContainer";

export const metadata: Metadata = { title: "CTF Writeups — Indraswara" };
export const revalidate = 60;

export default function CtfListPage() {
  const groups = getCtfEventGroups();

  const byYear = new Map<string, typeof groups>();
  for (const g of groups) {
    const year = Number.isNaN(new Date(g.eventDate).getFullYear())
      ? "Other"
      : String(new Date(g.eventDate).getFullYear());
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(g);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => (a < b ? 1 : -1));

  return (
    <PageContainer>
    <section>
      <h1 className="mb-7 border-b-2 border-fg pb-2.5 text-xl font-bold">CTF Writeups</h1>
      {groups.length === 0 ? (
        <p className="py-10 text-center text-sm text-fg-subtle">No writeups yet</p>
      ) : (
        years.map((year) => (
          <div key={year} className="mb-10">
            <h2 className="mb-5 border-b border-border pb-2 text-sm font-bold tracking-[2px] text-fg-subtle uppercase">
              {year}
            </h2>
            {byYear.get(year)!.map((event) => (
              <div key={event.event} className="mb-6 border-l-2 border-border pl-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold">
                    {event.eventUrl ? (
                      <a href={event.eventUrl} target="_blank" rel="noopener noreferrer" className="hover:opacity-70">
                        {event.event}
                      </a>
                    ) : (
                      event.event
                    )}
                  </h3>
                  <span className="text-xs whitespace-nowrap text-fg-subtle">{event.eventDate}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {event.writeups.map((wu, i) => (
                    <Link
                      key={wu.slug}
                      href={`/ctf/${wu.slug}`}
                      className="flex items-center gap-2 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
                    >
                      <span className="shrink-0 text-fg-subtle select-none">
                        {i === event.writeups.length - 1 ? "└─" : "├─"}
                      </span>
                      <span>{wu.title}</span>
                      {wu.category && <Tags tags={[wu.category]} />}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </section>
    </PageContainer>
  );
}
