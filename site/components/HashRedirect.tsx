"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The old site was a hash router (#/project, #/post/slug, ...). Hash
// fragments never reach the server, so any link to those URLs floating
// around (bookmarks, old shares) needs a client-side shim to land on the
// real route instead of just showing the homepage with a dead fragment.
export default function HashRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!window.location.hash.startsWith("#/")) return;
    const target = window.location.hash.slice(1) || "/";
    history.replaceState(null, "", window.location.pathname + window.location.search);
    router.replace(target);
  }, [router]);

  return null;
}
