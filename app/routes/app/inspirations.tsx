import { useState } from "react";
import { Form, useActionData, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { HeaderPlusButton } from "../../components/header-create";
import { InspirationGallery } from "../../components/inspiration-gallery";
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
  return (
    <>
      <p className="text-[12px] text-muted-foreground">
        URL を入れるとプレビューが付きます。画像のアップロードはまだありません。
      </p>
      <Form method="post" className="mt-3 space-y-2">
        <label className="sr-only" htmlFor="inspiration-title">
          タイトル
        </label>
        <input
          id="inspiration-title"
          name="title"
          placeholder="タイトル"
          className="ui-input"
          autoFocus={autoFocus}
        />
        <label className="sr-only" htmlFor="inspiration-url">
          URL
        </label>
        <input
          id="inspiration-url"
          name="url"
          type="url"
          placeholder="https://"
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
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4 md:h-[52px]">
        <h1 className="ui-title text-[16px]">インスピレーション</h1>
        <span className="font-mono text-[11px] text-muted-foreground">{items.length}</span>
        <div className="ml-auto flex items-center">
          <SettingsIconLink className="md:hidden" />
          <HeaderPlusButton label="インスピレーションを追加" onClick={() => setComposeOpen(true)} />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:grid md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:gap-8 md:px-8">
        <section className={composeOpen ? "block" : "hidden md:block"}>
          <h2 className="text-[13.5px] font-medium">メモを残す</h2>
          <div className="mt-2">
            <ComposeForm error={error} autoFocus={composeOpen && items.length > 0} />
          </div>
        </section>
        <section className="mt-6 md:mt-0">
          <InspirationGallery items={items} />
        </section>
      </div>
    </div>
  );
}
