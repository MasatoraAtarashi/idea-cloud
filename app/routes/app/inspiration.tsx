import { useState } from "react";
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { EmptyState, TagList } from "../../components/ui";
import { IconSpinner } from "../../components/icons";
import { InspirationDetailPreview } from "../../components/inspiration-preview";
import { formatDateJa } from "../../lib/format";
import { inspirationHeadline } from "../../lib/inspiration";
import { INSPIRATIONS_PATH, inspirationDetailAction } from "../../lib/inspiration-action";
import { useInstantPending } from "../../lib/use-instant-pending";
import { createDb } from "../../../db/client";
import { getInspirationRow, inspirationView } from "../../../db/inspirations";

export { inspirationDetailAction as action };

export function meta() {
  return [{ title: "インスピレーション — アイデアクラウド" }];
}

export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = createDb(context.cloudflare.env.DB);
  const numeric = Number(params.inspirationId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return { item: undefined };
  }
  const row = await getInspirationRow(db, numeric);
  return { item: row ? inspirationView(row) : undefined };
}

export default function InspirationPage() {
  const { item } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof inspirationDetailAction>();
  const error = actionData && "error" in actionData ? actionData.error : undefined;

  if (!item) {
    return (
      <div className="px-6 py-6">
        <EmptyState title="まだありません" />
        <Link
          to={INSPIRATIONS_PATH}
          className="mt-4 inline-block text-[13.5px] text-muted-foreground no-underline"
        >
          棚へ
        </Link>
      </div>
    );
  }

  return <InspirationDetail item={item} error={error} />;
}

function InspirationDetail({
  item,
  error,
}: {
  item: NonNullable<Awaited<ReturnType<typeof loader>>["item"]>;
  error?: string;
}) {
  const [editing, setEditing] = useState(false);
  const brainstorm = useFetcher();
  const refresh = useFetcher();
  const busy = brainstorm.state !== "idle";
  const refreshing = refresh.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  const { pending: refreshPending, hold: holdRefresh } = useInstantPending(refreshing);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.25rem,env(safe-area-inset-top))] md:px-8 md:py-5">
      <header className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
        <div className="flex items-center justify-between gap-3 py-1 md:py-0">
          <Link
            to={INSPIRATIONS_PATH}
            className="flex min-h-11 items-center text-[13.5px] font-medium text-foreground no-underline hover:text-foreground"
          >
            戻る
          </Link>
          <h1 className="idea-title-wrap ui-title min-w-0 flex-1 truncate text-center text-[15px] md:hidden">
            {inspirationHeadline(item)}
          </h1>
          <button
            type="button"
            onClick={() => setEditing((open) => !open)}
            className="ui-btn-secondary min-w-[4.5rem] px-3"
          >
            {editing ? "閉じる" : "編集"}
          </button>
        </div>
      </header>

      {editing ? (
        <Form method="post" className="mt-4 max-w-xl space-y-2">
          <input type="hidden" name="intent" value="edit" />
          <input
            name="title"
            defaultValue={item.title}
            placeholder="タイトル（空でも可）"
            className="ui-input"
          />
          <input
            name="url"
            type="text"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="off"
            placeholder="http:// または https://"
            defaultValue={item.url ?? ""}
            className="ui-input"
          />
          <textarea
            name="memo"
            defaultValue={item.memo}
            rows={5}
            className="ui-input min-h-[7rem] py-2"
          />
          <input name="tags" defaultValue={item.tags.join("、")} className="ui-input" />
          <button type="submit" className="ui-btn">
            保存
          </button>
        </Form>
      ) : (
        <>
          <InspirationDetailPreview item={item} />
          <h1 className="ui-title mt-4 hidden text-[22px] leading-snug md:block">
            {inspirationHeadline(item)}
          </h1>
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block break-all font-mono text-[12px] text-primary"
            >
              {item.url}
            </a>
          ) : null}
          {item.memo ? (
            <p className="mt-3 max-w-2xl whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-foreground">
              {item.memo}
            </p>
          ) : (
            <p className="mt-3 text-[13px] text-muted-foreground">メモはまだありません</p>
          )}
          <div className="mt-3">
            <TagList tags={item.tags} emptyLabel="" />
          </div>
        </>
      )}

      {item.url ? (
        <refresh.Form method="post" className="mt-5" onSubmit={holdRefresh}>
          <input type="hidden" name="intent" value="refresh-ogp" />
          <button type="submit" disabled={refreshPending} className="ui-btn-secondary px-3">
            {refreshPending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
            {refreshPending ? "取得中…" : "再取得"}
          </button>
          {item.ogStatus === "failed" ? (
            <p className="mt-2 text-[12px] text-muted-foreground">
              プレビューを取得できませんでした。再取得できます。
            </p>
          ) : null}
        </refresh.Form>
      ) : null}

      <dl className="mt-6 space-y-2 text-[13px] text-muted-foreground">
        <div>
          作成 <span className="font-mono text-[11.5px]">{formatDateJa(item.createdAt)}</span>
        </div>
        <div>
          更新 <span className="font-mono text-[11.5px]">{formatDateJa(item.updatedAt)}</span>
        </div>
      </dl>

      <brainstorm.Form method="post" className="mt-6" onSubmit={hold}>
        <input type="hidden" name="intent" value="brainstorm" />
        <button type="submit" disabled={pending} className="ui-btn">
          {pending ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : null}
          {pending ? "実行中…" : "AIブレスト"}
        </button>
        <p className="mt-2 max-w-sm text-[12px] text-muted-foreground">
          タイトル・URL・メモを種にして新しいアイデアを作り、既存のブレストを実行します。
        </p>
      </brainstorm.Form>
      {error ? <p className="mt-2 text-[12.5px] text-danger">{error}</p> : null}
    </div>
  );
}
