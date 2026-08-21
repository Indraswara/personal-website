// Mirrors site/components/Figure.tsx exactly (kept in sync by hand, not
// shared/ — it's the one MDX component with a public-site asset dependency,
// not pure rendering logic). Preview images resolve against the live site's
// own public/ host since admin has no copy of site/public/posts/images/.
export default function Figure({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  const resolvedSrc = src.startsWith("http") ? src : `https://egolab.top${src.startsWith("/") ? "" : "/"}${src}`;
  return (
    <figure className="my-6">
      {/* eslint-disable-next-line @next/next/no-img-element -- preview-only, resolves against the live site's own asset host */}
      <img src={resolvedSrc} alt={alt} className="w-full rounded-md border border-border" />
      {caption && <figcaption className="mt-2 text-center text-sm text-fg-subtle">{caption}</figcaption>}
    </figure>
  );
}
