import { useState, type KeyboardEvent } from "react";
import {
  Form,
  Link,
  useActionData,
  useNavigation,
  useOutletContext,
  useSearchParams,
} from "react-router";
import { CategoryField } from "./category-field";
import type { AppData } from "../routes/app/layout";
import { useT } from "../i18n/context";
import type { CreateIdeaActionData } from "../lib/idea-action";
import { LIST_PATH, SETTINGS_PATH } from "../lib/home-path";
import { isSubmitShortcut } from "../lib/shortcuts";
import { useInstantPending } from "../lib/use-instant-pending";
import { IconSettings, IconSpinner } from "./icons";

/** `/app` compose. Mobile is the designed screen; desktop normally opens the modal instead. */
export function CaptureView({ autofocus = false }: { autofocus?: boolean }) {
  const { categories } = useOutletContext<AppData>();
  const t = useT();
  const actionData = useActionData() as CreateIdeaActionData | undefined;
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const submitting = navigation.state !== "idle";
  const { pending, hold } = useInstantPending(submitting);
  const [title, setTitle] = useState(actionData?.title ?? searchParams.get("title") ?? "");
  const [draft, setDraft] = useState(actionData?.body ?? "");
  const [tags, setTags] = useState("");
  const canSubmit = Boolean((title.trim() || draft.trim()) && !pending);

  function onComposeKeyDown(event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
    if (!isSubmitShortcut(event)) return;
    event.preventDefault();
    if (!canSubmit) return;
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <Form
      method="post"
      className="flex min-h-0 flex-1 flex-col bg-card md:mx-auto md:my-8 md:w-full md:max-w-[640px] md:flex-none md:rounded-[12px] md:border md:border-border-card"
      onSubmit={hold}
    >
      <input type="hidden" name="stage" value="spark" />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pt-[env(safe-area-inset-top)] md:px-7 md:pt-5">
        <div className="-mx-2 flex items-center justify-between">
          <Link
            to={LIST_PATH}
            className="flex min-h-11 min-w-11 items-center px-2 text-[14px] text-secondary no-underline"
          >
            {t.nav.items.ideasShort}
          </Link>
          <Link
            to={SETTINGS_PATH}
            aria-label={t.nav.items.settings}
            className="flex h-11 w-11 items-center justify-center text-muted-foreground no-underline md:hidden"
          >
            <IconSettings className="h-[18px] w-[18px]" />
          </Link>
        </div>

        <h1 className="mt-4 text-[23px] leading-[1.4] font-semibold tracking-[-0.02em] text-foreground">
          {t.compose.heading}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted-foreground">{t.compose.subheading}</p>

        <label htmlFor="idea-mobile-title" className="sr-only">
          {t.compose.titlePlaceholder}
        </label>
        <input
          id="idea-mobile-title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={onComposeKeyDown}
          autoFocus={autofocus}
          autoComplete="off"
          placeholder={t.compose.titlePlaceholder}
          className="mt-6 w-full border-0 bg-transparent pb-3 text-[19px] leading-snug font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="h-px bg-border" />
        <label htmlFor="idea-mobile" className="sr-only">
          {t.compose.placeholder}
        </label>
        <textarea
          id="idea-mobile"
          name="body"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onComposeKeyDown}
          placeholder={t.compose.placeholder}
          className="mt-3 min-h-[10rem] w-full flex-1 resize-none border-0 bg-transparent text-[14.5px] leading-[1.9] text-secondary outline-none placeholder:text-muted-foreground md:min-h-[14rem]"
        />

        <div className="pt-3 pb-4">
          <p className="text-[12.5px] font-medium text-tertiary">{t.compose.category.optional}</p>
          <div className="mt-2">
            <CategoryField categories={categories} idPrefix="idea-mobile" />
          </div>
          <label className="mt-3 flex min-h-[52px] items-center gap-2 rounded-[10px] border border-border-control bg-card px-3.5">
            <span className="sr-only">{t.compose.tags}</span>
            <input
              id="idea-mobile-tags"
              name="tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder={t.compose.tags}
              autoComplete="off"
              className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
            />
            <span className="shrink-0 rounded-[5px] bg-[#eef4ff] px-2 py-1 text-[11.5px] font-medium text-[#3538cd]">
              {t.compose.tagHint}
            </span>
          </label>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
            {t.compose.urlHint}
          </p>
          {actionData?.error ? (
            <p className="mt-2 text-[12.5px] text-danger">{actionData.error}</p>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-border bg-card px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-7 md:pb-5">
        <button
          type="submit"
          disabled={!canSubmit}
          aria-busy={pending}
          className="ui-btn h-[50px] w-full rounded-[10px] text-[15px] md:h-[50px]"
        >
          {pending ? <IconSpinner className="h-4 w-4 animate-spin" /> : null}
          {pending ? t.compose.submitting : t.compose.submitWide}
        </button>
      </div>
    </Form>
  );
}
