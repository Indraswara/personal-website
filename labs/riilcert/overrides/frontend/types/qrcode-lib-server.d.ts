// app/verify/page.tsx imports `toBuffer` from this undocumented deep path
// (see the comment above that import) because the top-level `qrcode` types
// don't cover Node's Buffer-returning server API. @types/qrcode doesn't
// declare this submodule either, so `next build`'s type check fails on it
// even though `next dev` never runs full type-checking and happily lets it
// through — this declaration is what upstream was silently missing.
declare module 'qrcode/lib/server' {
  export function toBuffer(
    text: string,
    options?: Record<string, unknown>
  ): Promise<Buffer>;
}
