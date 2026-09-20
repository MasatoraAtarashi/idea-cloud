import { Form, Link, useActionData, useLoaderData, type LoaderFunctionArgs } from "react-router";
import { EmptyState, TagList } from "../../components/ui";
import { formatRelativeJa } from "../../lib/format";
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

export default function InspirationsPage() {
  const { items } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof createInspirationAction>();
  const error = actionData && "error" in actionData ? actionData.error : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-[52px] shrink-0 items-center border-b border-border px-4">
        <h1 className="ui-title text-[16px]">インスピレーション</h1>
        <span className="ml-2 font-mono text-[11px] text-muted-foreground">{items.length}</span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:grid md:grid-cols-[minmax(0,22rem)_1fr] md:gap-8 md:px-8">
        <section>
          <h2 className="text-[13.5px] font-medium">メモを残す</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">
            URL と短いメモだけです。画像アップロードはまだありません。
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
              placeholder="メモ"
              className="ui-input min-h-[6rem] py-2"
            />
            <label className="sr-only" htmlFor="inspiration-tags">
              タグ
            </label>
            <input
              id="inspiration-tags"
              name="tags"
              placeholder="タグ（任意）"
              className="ui-input"
            />
            <button type="submit" className="ui-btn w-full">
              追加
            </button>
            {error ? <p className="text-[12.5px] text-danger">{error}</p> : null}
          </Form>
        </section>
        <section className="mt-8 md:mt-0">
          {items.length === 0 ? (
            <EmptyState
              title="まだインスピレーションがありません"
              body="URL かメモを残して、あとでアイデアにします。"
            />
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/app/inspirations/${item.id}`}
                    prefetch="intent"
                    className="block py-3 no-underline"
                  >
                    <p className="ui-title text-[13.5px] text-foreground">{item.title}</p>
                    {item.url ? (
                      <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                        {item.url}
                      </p>
                    ) : null}
                    {item.memo ? (
                      <p className="mt-0.5 line-clamp-2 text-[12.5px] text-muted-foreground">
                        {item.memo}
                      </p>
                    ) : null}
                    <div className="mt-1 flex items-center gap-2">
                      <TagList tags={item.tags} emptyLabel="" />
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {formatRelativeJa(item.updatedAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
