import type { ReactNode } from "react";

// Full viewport width (not a fixed reading column) — every page uses this,
// by explicit user request.
export default function PageContainer({ children }: { children: ReactNode }) {
  return <div className="w-full flex-1 px-6 py-5 sm:px-8">{children}</div>;
}
