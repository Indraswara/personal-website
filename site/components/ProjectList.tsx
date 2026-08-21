"use client";

import { useEffect, useState } from "react";
import type { ProjectItem } from "@/lib/types";
import Tags from "./Tags";

const LAB_STATUS_URL = "https://term.egolab.top/api/status";

interface StatusEntry {
  slug: string;
  live: boolean;
}

export default function ProjectList({ projects }: { projects: ProjectItem[] }) {
  const [statusBySlug, setStatusBySlug] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(LAB_STATUS_URL, { cache: "no-store" });
        if (!res.ok) return;
        const data: StatusEntry[] = await res.json();
        if (!cancelled) {
          setStatusBySlug(Object.fromEntries(data.map((d) => [d.slug, d.live])));
        }
      } catch {
        // leave the previous map intact — badges just stay as they were
      }
    }

    poll();
    const interval = setInterval(poll, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <section>
      <h1 className="mb-7 border-b-2 border-fg pb-2.5 text-xl font-bold">Projects</h1>
      {projects.length === 0 ? (
        <p className="py-10 text-center text-sm text-fg-subtle">No items yet</p>
      ) : (
        <div className="flex flex-col gap-10">
          {projects.map((item, i) => {
            const live = item.web ? statusBySlug[item.slug ?? ""] : undefined;
            return (
              <div key={i} className="border-l-2 border-border pl-5 transition-colors hover:border-fg">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="mb-1 text-lg font-bold">
                    {item.title}
                    {item.web && live !== undefined && (
                      <span
                        className={`ml-2 align-middle text-[11px] font-normal ${
                          live ? "text-accent" : "text-fg-subtle"
                        }`}
                      >
                        ● {live ? "live" : "down"}
                      </span>
                    )}
                  </h2>
                  <span className="text-xs whitespace-nowrap text-fg-subtle">{item.date}</span>
                </div>
                <p className="mb-2.5 text-sm text-fg-muted">{item.description}</p>
                <Tags tags={item.tags} />
                <div className="mt-3.5 flex flex-wrap items-center gap-3">
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-sm border border-border px-4 py-2 text-[13px] text-fg transition-colors hover:bg-bg-inset"
                    >
                      View Project
                    </a>
                  )}
                  {item.web && (
                    <a
                      href={`https://${item.web.subdomain}.egolab.top`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-sm border border-border px-4 py-2 text-[13px] text-fg transition-colors hover:bg-bg-inset"
                    >
                      Try it live →
                    </a>
                  )}
                  {item.site && (
                    <a
                      href={`/${item.site}`}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-border px-4 py-2 text-[13px] text-fg transition-colors hover:bg-bg-inset"
                    >
                      Try it on this page →
                    </a>
                  )}
                  {item.lab && (
                    <span className="inline-flex items-center text-[13px] text-fg-muted">
                      run{" "}
                      <code className="mx-1.5 rounded-sm bg-bg-inset px-1.5 py-0.5">{item.lab.cmd}</code>{" "}
                      in the{" "}
                      <a href="/playground" className="ml-1 underline">
                        playground
                      </a>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
