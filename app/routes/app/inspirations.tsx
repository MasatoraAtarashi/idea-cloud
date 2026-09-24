import { useEffect, useRef, useState } from "react";
import { Form, useActionData, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { HeaderPlusButton } from "../../components/header-create";
import { InspirationGallery } from "../../components/inspiration-gallery";
import { MobileScreenHeader } from "../../components/mobile-header";
import { SettingsIconLink } from "../../components/settings-link";
import { createInspirationAction } from "../../lib/inspiration-action";
import { createDb } from "../../../db/client";
import { inspirationView, listInspirationRows } from "../../../db/inspirations";

export { createInspirationAction as action };

export function meta() {
  return [{ title: "インスピレーション — アイデアクラウド" }];
}

export async function loader({ context }: LoaderFunctionArgs) {
  const db = createDb(context.cloudflare.env.DB);
  const items = (await listInspirationRows(db)).map(inspirationView);
  return { items };
}

function ComposeForm({ error, autoFocus = false }: { error?: string; autoFocus?: boolean }) {
  const urlRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) urlRef.current?.focus();
  }, [autoFocus]);

  return (
    <>
      <p className="text-[12px] text-muted-foreground">
        URLだけでも追加できます。タイトルは空で大丈夫です。プレビューが取れなくても保存されます。画像のアップロードはまだありません。
      </p>
      <Form method="post" className="mt-3 space-y-2">
        <label className="sr-only" htmlFor="inspiration-url">
          URL
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
          placeholder="http:// または https://"
          className="ui-input"
          ref={urlRef}
        />
        <label className="sr-only" htmlFor="inspiration-title">
          タイトル（任意）
        </label>
        <input
          id="inspiration-title"
          name="title"
          placeholder="タイトル（空でも可）"
          autoComplete="off"
          className="ui-input"
        />
        <label className="sr-only" htmlFor="inspiration-memo">
          メモ
        </label>
        <textarea
          id="inspiration-memo"
          name="memo"
          rows={4}
          placeholder="残したいこと"
          className="ui-input min-h-[6rem] py-2"
        />
        <label className="sr-only" htmlFor="inspiration-tags">
          タグ
        </label>
        <input id="inspiration-tags" name="tags" placeholder="タグ（任意）" className="ui-input" />
        <button type="submit" className="ui-btn w-full">
          追加
        </button>
        {error ? <p className="text-[12.5px] text-danger">{error}</p> : null}
      </Form>
    </>
  );
}

export default function InspirationsPage() {
  const { items } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof createInspirationAction>();
  const error = actionData && "error" in actionData ? actionData.error : undefined;
  const [composeOpen, setComposeOpen] = useState(items.length === 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="hidden h-[52px] shrink-0 items-center gap-2 border-b border-border px-4 md:flex">
        <h1 className="ui-title text-[16px]">インスピレーション</h1>
        <span className="font-mono text-[11px] text-muted-foreground">{items.length}</span>
        <div className="ml-auto flex items-center">
          <HeaderPlusButton label="インスピレーションを追加" onClick={() => setComposeOpen(true)} />
        </div>
      </header>
      <MobileScreenHeader
        title={
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="ui-title truncate text-[15px]">インスピレーション</h1>
            <span className="font-mono text-[11px] text-muted-foreground">{items.length}</span>
          </div>
        }
        trailing={
          <>
            {composeOpen ? (
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="flex min-h-11 items-center px-2 text-[13.5px] font-medium text-foreground"
              >
                閉じる
              </button>
            ) : null}
            <SettingsIconLink />
            <HeaderPlusButton
              label="インスピレーションを追加"
              onClick={() => setComposeOpen(true)}
            />
          </>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:grid md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-8 md:px-8 md:pb-5">
        <section className={composeOpen ? "block" : "hidden md:block"}>
          <h2 className="text-[13.5px] font-semibold">メモを残す</h2>
          <div className="mt-2">
            <ComposeForm error={error} autoFocus={composeOpen} />
          </div>
        </section>
        <section className="mt-6 md:mt-0">
          <InspirationGallery items={items} />
        </section>
      </div>
    </div>
  );
}
