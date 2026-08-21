export default function Figure({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="my-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="mx-auto block rounded-sm shadow-[var(--shadow)]" />
      {caption && <figcaption className="mt-2.5 text-xs text-fg-subtle">{caption}</figcaption>}
    </figure>
  );
}
