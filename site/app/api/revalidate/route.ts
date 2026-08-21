import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Called by admin.egolab.top right after it writes+pushes a content change,
// so a publish feels instant instead of waiting out the 60s ISR window.
// Not reachable from the public internet in practice (no ingress route to
// this hostname's /api/revalidate is special-cased — it rides the same
// egolab.top origin as everything else) but the shared secret means a stray
// request still can't force-bust the cache.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { path } = await req.json().catch(() => ({ path: undefined }));
  if (typeof path !== "string" || !path.startsWith("/")) {
    return NextResponse.json({ error: "path must be an absolute route" }, { status: 400 });
  }

  revalidatePath(path);
  return NextResponse.json({ revalidated: true, path });
}
