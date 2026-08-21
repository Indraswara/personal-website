import type { TimelineItem } from "@/lib/types";
import Tags from "./Tags";

export default function TimelineSection({ title, items }: { title: string; items: TimelineItem[] }) {
  return (
    <section>
      <h1 className="mb-7 border-b-2 border-fg pb-2.5 text-xl font-bold">{title}</h1>
      {items.length === 0 ? (
        <p className="py-10 text-center text-sm text-fg-subtle">No items yet</p>
      ) : (
        <div className="flex flex-col gap-10">
          {items.map((item, i) => (
            <div key={i} className="border-l-2 border-border pl-5 transition-colors hover:border-fg">
              <div className="flex items-start justify-between gap-3">
                <h2 className="mb-1 text-lg font-bold">{item.title}</h2>
                <span className="text-xs whitespace-nowrap text-fg-subtle">{item.date}</span>
              </div>
              <p className="mb-2.5 text-sm text-fg-muted">{item.description}</p>
              <Tags tags={item.tags} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
