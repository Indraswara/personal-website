import type { Metadata } from "next";
import { getHomelabServices, getHomelabStatus } from "@/lib/homelab";
import type { HomelabService } from "@/lib/types";
import PageContainer from "@/components/PageContainer";

export const metadata: Metadata = { title: "Homelab — Indraswara" };
export const revalidate = 60;

function groupByCategory(services: HomelabService[]) {
  const groups = new Map<string, HomelabService[]>();
  for (const s of services) {
    const list = groups.get(s.category) ?? [];
    list.push(s);
    groups.set(s.category, list);
  }
  return groups;
}

export default async function HomelabPage() {
  const services = getHomelabServices();
  const status = await getHomelabStatus();
  const statusBySubdomain = new Map((status ?? []).map((s) => [s.subdomain, s]));
  const groups = groupByCategory(services);

  return (
    <PageContainer>
      <h1 className="mb-2 text-2xl font-bold text-fg">Homelab</h1>
      <p className="mb-1 max-w-2xl text-sm text-fg-muted">
        Self-hosted services running on the same VPS as this site, reverse-proxied and reachable only over
        Tailscale — no public port. Everything below is a real, currently-running container, checked live.
      </p>
      <p className="mb-6 text-xs text-fg-subtle">
        {status ? "Refreshes every 60s." : "Live status is unavailable right now — showing the directory only."}
      </p>

      <div className="flex flex-col gap-8">
        {Array.from(groups.entries()).map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-3 text-xs font-bold tracking-widest text-fg-subtle uppercase">{category}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((svc) => {
                const live = statusBySubdomain.get(svc.subdomain);
                return (
                  <div
                    key={svc.subdomain}
                    className="rounded-lg border border-border bg-bg-elevated p-4 shadow-[var(--shadow)]"
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <h3 className="font-bold text-fg">{svc.name}</h3>
                      {live ? (
                        <span
                          className={`flex items-center gap-1.5 text-xs font-medium ${
                            live.online ? "text-accent" : "text-danger"
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${live.online ? "bg-accent" : "bg-danger"}`}
                            aria-hidden
                          />
                          {live.online ? "online" : "offline"}
                        </span>
                      ) : (
                        <span className="text-xs text-fg-subtle">status unknown</span>
                      )}
                    </div>
                    <p className="mb-2 text-sm text-fg-muted">{svc.description}</p>
                    <p className="font-mono text-xs text-fg-subtle">{svc.subdomain}</p>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
