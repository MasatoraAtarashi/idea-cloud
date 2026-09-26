import { useState } from "react";
import { useT } from "../i18n/context";
import {
  inspirationGlyph,
  inspirationHeadline,
  inspirationHostname,
  inspirationSiteLabel,
} from "../lib/inspiration";

export type InspirationPreviewItem = {
  title: string;
  url: string | null;
  memo: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  ogSiteName: string;
};

export function InspirationFallbackArt({
  item,
  className,
}: {
  item: Pick<InspirationPreviewItem, "title" | "url">;
  className?: string;
}) {
  const host = inspirationHostname(item.url);
  return (
    <div
      className={`flex flex-col items-center justify-center bg-muted text-grey-dot ${className ?? ""}`}
    >
      <span className="font-mono text-[26px] leading-none">
        {inspirationGlyph(item).toLowerCase()}
      </span>
      {host ? (
        <span className="mt-2 font-mono text-[11px] text-muted-foreground">{host}</span>
      ) : null}
    </div>
  );
}

export function InspirationCardMedia({
  item,
  className,
}: {
  item: InspirationPreviewItem;
  className?: string;
}) {
  const t = useT();
  const headline = inspirationHeadline(t, item);
  const [imageFailed, setImageFailed] = useState(false);
  if (item.ogImageUrl && !imageFailed) {
    return (
      <div className={`relative overflow-hidden bg-muted ${className ?? ""}`}>
        <img
          src={item.ogImageUrl}
          alt={headline}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="aspect-[4/3] h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
      </div>
    );
  }
  return <InspirationFallbackArt item={item} className={`aspect-[4/3] ${className ?? ""}`} />;
}

export function InspirationDetailPreview({ item }: { item: InspirationPreviewItem }) {
  const t = useT();
  const headline = inspirationHeadline(t, item);
  const site = inspirationSiteLabel(item);
  const snippet = item.ogDescription.trim();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(item.ogImageUrl) && !imageFailed;
  const inner = showImage ? (
    <img
      src={item.ogImageUrl}
      alt={headline}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setImageFailed(true)}
      className="max-h-[380px] w-full object-cover"
    />
  ) : (
    <InspirationFallbackArt item={item} className="min-h-[11rem] w-full" />
  );

  const media = item.url ? (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-[10px] border border-border-card no-underline"
    >
      {inner}
    </a>
  ) : (
    <div className="overflow-hidden rounded-[10px] border border-border-card">{inner}</div>
  );

  return (
    <section className="mt-4">
      {media}
      <div className="mt-3">
        {site ? <p className="font-mono text-[11px] text-muted-foreground">{site}</p> : null}
        {item.ogTitle && item.ogTitle !== headline ? (
          <p className="mt-1 text-[13.5px] text-muted-foreground">{item.ogTitle}</p>
        ) : null}
        {snippet ? (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
            {snippet}
          </p>
        ) : null}
      </div>
    </section>
  );
}
