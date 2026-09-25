import { useState } from "react";
import { Link } from "react-router";
import { useT } from "../i18n/context";
import {
  inspirationGlyph,
  inspirationHeadline,
  inspirationHostname,
  inspirationMediaHeight,
} from "../lib/inspiration";
import type { InspirationPreviewItem } from "./inspiration-preview";
import { EmptyState } from "./ui";

export type InspirationGalleryItem = InspirationPreviewItem & {
  id: string;
  tags: string[];
  updatedAt: string;
  ogStatus?: "none" | "ok" | "failed";
};

export function InspirationGallery({
  items,
  onMakeIdea,
}: {
  items: InspirationGalleryItem[];
  onMakeIdea: (item: InspirationGalleryItem) => void;
}) {
  const t = useT();
  if (items.length === 0) {
    return <EmptyState title={t.inspiration.emptyTitle} body={t.inspiration.emptyBody} />;
  }

  return (
    <ul className="columns-1 gap-[18px] sm:columns-2 lg:columns-3">
      {items.map((item) => (
        <li key={item.id} className="mb-[18px] break-inside-avoid">
          <InspirationCard item={item} onMakeIdea={onMakeIdea} />
        </li>
      ))}
    </ul>
  );
}

function CardMedia({ item }: { item: InspirationGalleryItem }) {
  const [failed, setFailed] = useState(false);
  const height = inspirationMediaHeight(item.id);
  if (item.ogImageUrl && !failed) {
    return (
      <img
        src={item.ogImageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="block w-full bg-muted object-cover"
        style={{ height }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex w-full items-center justify-center bg-muted font-mono text-[26px] text-grey-dot"
      style={{ height }}
    >
      {inspirationGlyph(item).toLowerCase()}
    </span>
  );
}

function InspirationCard({
  item,
  onMakeIdea,
}: {
  item: InspirationGalleryItem;
  onMakeIdea: (item: InspirationGalleryItem) => void;
}) {
  const t = useT();
  const headline = inspirationHeadline(t, item);
  const host = inspirationHostname(item.url) || item.ogSiteName;

  return (
    <div className="group">
      <div className="relative overflow-hidden rounded-[10px] border border-border-card bg-card transition-[border-color,box-shadow] duration-150 group-hover:border-border-control group-hover:shadow-[var(--shadow-hover)]">
        <Link
          to={`/app/inspirations/${item.id}`}
          prefetch="intent"
          aria-label={headline}
          className="block no-underline"
        >
          <CardMedia item={item} />
        </Link>
        <button
          type="button"
          onClick={() => onMakeIdea(item)}
          className="absolute right-2.5 transition-opacity focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 bottom-2.5 flex min-h-11 items-center gap-1 rounded-[6px] bg-foreground px-2.5 text-[11.5px] font-semibold text-white md:min-h-[30px]"
        >
          ＋ {t.inspiration.makeIdea}
        </button>
      </div>
      <Link
        to={`/app/inspirations/${item.id}`}
        prefetch="intent"
        className="mt-2 block px-0.5 no-underline"
      >
        <p className="line-clamp-2 text-[12.5px] leading-[1.6] font-medium text-foreground">
          {headline}
        </p>
        {host ? (
          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
            {host}
            {item.ogStatus === "failed" ? (
              <span className="font-sans"> · {t.inspiration.fetchFailedShort}</span>
            ) : null}
          </p>
        ) : null}
      </Link>
    </div>
  );
}
