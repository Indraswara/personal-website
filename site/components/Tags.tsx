export default function Tags({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className="mt-2.5 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag} className="rounded-sm bg-bg-inset px-2.5 py-1 text-xs text-fg-muted">
          {tag}
        </span>
      ))}
    </div>
  );
}
