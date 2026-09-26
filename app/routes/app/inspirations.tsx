import { useEffect, useMemo, useRef, useState } from "react";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  useOutletContext,
  type LoaderFunctionArgs,
} from "react-router";
import type { AppData } from "./layout";
import { useT } from "../../i18n/context";
import { dictionary } from "../../i18n/dictionary";
import { HeaderPlusButton } from "../../components/header-create";
import { IconSpinner } from "../../components/icons";
import {
  InspirationGallery,
  type InspirationGalleryItem,
} from "../../components/inspiration-gallery";
import { InspirationIdeaDialog, InspirationModal } from "../../components/inspiration-idea-dialog";
import { MobileScreenHeader } from "../../components/mobile-header";
import { SettingsIconLink } from "../../components/settings-link";
import { TagPill } from "../../components/ui";
import { createInspirationAction } from "../../lib/inspiration-action";
import { inspirationView, listInspirationRows } from "../../../db/inspirations";
import { appDb } from "../../lib/app-db";
import type { Route } from "./+types/inspirations";

export { createInspirationAction as action };

export function meta({ data }: Route.MetaArgs) {
  return [{ title: dictionary(data?.locale ?? "ja").inspiration.metaTitle }];
}

export async function loader({ context }: LoaderFunctionArgs) {
  const db = appDb(context);
  const items = (await listInspirationRows(db)).map(inspirationView);
  return { items, locale: context.locale };
}

function PasteUrlForm({ error }: { error?: string }) {
  const t = useT();
  const urlRef = useRef<HTMLInputElement>(null);
  const navigation = useNavigation();
  const saving = navigation.state !== "idle" && navigation.formData?.get("intent") == null;
  useEffect(() => {
    urlRef.current?.focus();
  }, []);

  return (
    <Form method="post" className="space-y-2.5 px-[18px] py-4">
      <p className="text-[12px] leading-relaxed text-muted-foreground">{t.inspiration.pasteHint}</p>
      <label className="sr-only" htmlFor="inspiration-url">
        {t.inspiration.urlLabel}
      </label>
      <input
        id="inspiration-url"
        name="url"
        type="text"
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        placeholder="https://"
        className="ui-input font-mono md:h-10"
        ref={urlRef}
      />
      <label className="sr-only" htmlFor="inspiration-title">
        {t.inspiration.titleLabel}
      </label>
      <input
        id="inspiration-title"
        name="title"
        placeholder={t.inspiration.titlePlaceholder}
        autoComplete="off"
        className="ui-input md:h-10"
      />
      <label className="sr-only" htmlFor="inspiration-memo">
        {t.inspiration.memoLabel}
      </label>
      <textarea
        id="inspiration-memo"
        name="memo"
        rows={3}
        placeholder={t.inspiration.memoPlaceholder}
        className="ui-input h-auto min-h-[5rem] py-2"
      />
      <label className="sr-only" htmlFor="inspiration-tags">
        {t.inspiration.tagsLabel}
      </label>
      <input
        id="inspiration-tags"
        name="tags"
        placeholder={t.inspiration.tagsPlaceholder}
        className="ui-input md:h-10"
      />
      <div className="flex items-center justify-end gap-2 pt-1">
        {error ? <p className="mr-auto text-[12.5px] text-danger">{error}</p> : null}
        <button type="submit" disabled={saving} className="ui-btn px-4 md:h-9 md:min-h-9">
          {saving ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
          {t.inspiration.add}
        </button>
      </div>
    </Form>
  );
}

function TagFilter({
  tags,
  selected,
  onChange,
}: {
  tags: string[];
  selected: string | null;
  onChange: (tag: string | null) => void;
}) {
  const t = useT();
  const ref = useRef<HTMLDetailsElement>(null);
  function pick(tag: string | null) {
    onChange(tag);
    ref.current?.removeAttribute("open");
  }
  return (
    <details ref={ref} className="ui-menu relative">
      <summary className="ui-btn-secondary cursor-pointer px-3 md:h-9 md:min-h-9">
        {selected ? (
          <>
            {t.inspiration.tagsLabel} <TagPill label={selected} />
          </>
        ) : (
          t.inspiration.tagsLabel
        )}
      </summary>
      <div className="ui-float absolute right-0 z-20 mt-1 w-56 p-2">
        {tags.length === 0 ? (
          <p className="px-1 py-1 text-[12px] text-muted-foreground">{t.inspiration.noTags}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => pick(selected === tag ? null : tag)}
                aria-pressed={selected === tag}
                className={`rounded-[6px] p-0.5 ${selected === tag ? "ring-2 ring-foreground" : ""}`}
              >
                <TagPill label={tag} />
              </button>
            ))}
          </div>
        )}
        {selected ? (
          <button
            type="button"
            onClick={() => pick(null)}
            className="mt-2 w-full rounded-[6px] px-2 py-1.5 text-left text-[12.5px] text-muted-foreground hover:bg-sunken"
          >
            {t.inspiration.clearFilter}
          </button>
        ) : null}
      </div>
    </details>
  );
}

export default function InspirationsPage() {
  const t = useT();
  const { items } = useLoaderData<typeof loader>();
  const { categories } = useOutletContext<AppData>();
  const actionData = useActionData<typeof createInspirationAction>();
  const error =
    actionData && "error" in actionData && actionData.intent === "create"
      ? actionData.error
      : undefined;
  const [pasteOpen, setPasteOpen] = useState(false);
  const [ideaFrom, setIdeaFrom] = useState<InspirationGalleryItem | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const allTags = useMemo(
    () => [...new Set(items.flatMap((item) => item.tags))].sort((a, b) => a.localeCompare(b, "ja")),
    [items],
  );
  const shown = tag ? items.filter((item) => item.tags.includes(tag)) : items;

  useEffect(() => {
    if (error) setPasteOpen(true);
  }, [error]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="hidden shrink-0 items-center gap-2.5 border-b border-border bg-card px-7 py-4 md:flex">
        <h1 className="text-[18px] font-medium tracking-[-0.01em] text-foreground">
          {t.inspiration.title}
        </h1>
        <span className="font-mono text-[12px] text-muted-foreground">{items.length}</span>
        <div className="ml-auto flex items-center gap-2">
          <TagFilter tags={allTags} selected={tag} onChange={setTag} />
          <button
            type="button"
            onClick={() => setPasteOpen(true)}
            className="ui-btn px-3.5 md:h-9 md:min-h-9"
          >
            ＋ {t.inspiration.pasteUrl}
          </button>
        </div>
      </header>
      <MobileScreenHeader
        title={
          <div className="flex min-w-0 items-baseline gap-2 px-1">
            <h1 className="truncate text-[18px] font-medium text-foreground">
              {t.inspiration.title}
            </h1>
            <span className="font-mono text-[11.5px] text-muted-foreground">{items.length}</span>
          </div>
        }
        trailing={
          <>
            <TagFilter tags={allTags} selected={tag} onChange={setTag} />
            <SettingsIconLink />
            <HeaderPlusButton label={t.inspiration.pasteUrl} onClick={() => setPasteOpen(true)} />
          </>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-7 md:py-[22px]">
        <InspirationGallery items={shown} onMakeIdea={setIdeaFrom} />
      </div>
      {pasteOpen ? (
        <InspirationModal
          title={t.inspiration.pasteUrl}
          width={480}
          onClose={() => setPasteOpen(false)}
        >
          <PasteUrlForm error={error} />
        </InspirationModal>
      ) : null}
      {ideaFrom ? (
        <InspirationIdeaDialog
          item={ideaFrom}
          categories={categories}
          onClose={() => setIdeaFrom(null)}
        />
      ) : null}
    </div>
  );
}
