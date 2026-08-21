// Best-effort — never throws, never fails a save. If this doesn't land, the
// public site's own revalidate=60 on every content page (site/app/**)
// catches up within a minute regardless; this just makes a publish feel
// instant instead of making the writer wait.
export async function triggerRevalidate(pathToRevalidate: string): Promise<void> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return;
  const url = process.env.WEB_INTERNAL_URL ?? "http://egolab-web:3000";
  try {
    await fetch(`${url}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify({ path: pathToRevalidate }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // ignored — see comment above
  }
}
