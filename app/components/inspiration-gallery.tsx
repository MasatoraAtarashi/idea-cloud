import { Link } from "react-router";
import { formatRelativeJa } from "../lib/format";
import { inspirationHeadline, inspirationSiteLabel, inspirationSnippet } from "../lib/inspiration";
import { InspirationCardMedia, type InspirationPreviewItem } from "./inspiration-preview";
import { EmptyState, TagList } from "./ui";

export type InspirationGalleryItem = InspirationPreviewItem & {
  id: string;
  tags: string[];
  updatedAt: string;
};

export function InspirationGallery({ items }: { items: InspirationGalleryItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="まだインスピレーションがありません"
        body="URL かメモを残して、あとでアイデアにします。"
      />
    );
  }

  return (
    <ul className="inspiration-masonry">
      {items.map((item) => (
        <li key={item.id} className="break-inside-avoid">
          <InspirationCard item={item} />
        </li>
      ))}
    </ul>
  );
}

function InspirationCard({ item }: { item: InspirationGalleryItem }) {
  const headline = inspirationHeadline(item);
  const site = inspirationSiteLabel(item);
  const snippet = inspirationSnippet(item);

  return (
    <Link
      to={`/app/inspirations/${item.id}`}
      prefetch="intent"
      className="inspiration-card group mb-3 block overflow-hidden rounded-[12px] border border-border bg-card no-underline"
    >
      <InspirationCardMedia item={item} />
      <div className="px-3 py-2.5">
        {site ? (
          <p className="truncate font-mono text-[11px] text-muted-foreground">{site}</p>
        ) : null}
        <p className="ui-title mt-0.5 line-clamp-2 text-[14px] text-foreground">{headline}</p>
        {snippet ? (
          <p className="mt-1 line-clamp-3 text-[12.5px] leading-relaxed text-muted-foreground">
            {snippet}
          </p>
        ) : null}
        <div className="mt-2 flex items-center justify-between gap-2">
          <TagList tags={item.tags} emptyLabel="" limit={2} />
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
            {formatRelativeJa(item.updatedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
