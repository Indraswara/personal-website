import fs from "fs";
import path from "path";
import type { HomelabService, HomelabServiceStatus } from "./types";

const HOMELAB_PATH = path.join(process.cwd(), "content/homelab.json");
// Container name of the homelab-status sidecar (compose.yml) — reachable by
// name on the shared egolab_edge network, same in local dev and prod since
// both are just Docker's internal DNS. No published port, so this fetch
// only ever happens server-side.
const STATUS_URL = "http://egolab-homelab-status:8080/services";

export function getHomelabServices(): HomelabService[] {
  const raw = fs.readFileSync(HOMELAB_PATH, "utf-8");
  return (JSON.parse(raw).services ?? []) as HomelabService[];
}

// Never throws — the directory must render even when the sidecar is
// unreachable, same rule as the terminal's own /api/status badges.
export async function getHomelabStatus(): Promise<HomelabServiceStatus[] | null> {
  try {
    const res = await fetch(STATUS_URL, {
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as HomelabServiceStatus[];
  } catch {
    return null;
  }
}
