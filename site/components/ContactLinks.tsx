import { CONTACT_LINKS } from "@/lib/content";

export default function ContactLinks() {
  const links = CONTACT_LINKS.filter((l) => l.url);
  if (links.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="text-xs tracking-[2px] text-fg-subtle uppercase">Connect</p>
      <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
        {links.map((link) => {
          const isMail = link.url.startsWith("mailto:");
          return (
            <a
              key={link.id}
              href={link.url}
              target={isMail ? "_self" : "_blank"}
              rel={isMail ? undefined : "noopener noreferrer"}
              className="group flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg-elevated text-fg shadow-[var(--shadow)] transition-colors hover:bg-fg hover:text-bg"
            >
              {link.iconPath ? (
                // Icons carry their own brand colors/background chip — no
                // theme-based invert filter, that only makes sense for flat
                // single-color glyphs.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={link.iconPath} alt="" className="h-7 w-7 rounded-md" />
              ) : (
                <span className="text-base font-bold">{link.label.charAt(0)}</span>
              )}
              <span className="sr-only">{link.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
