import { useState } from "react";
import {
  Form,
  Link,
  useActionData,
  useFetcher,
  useLoaderData,
  useOutletContext,
  type LoaderFunctionArgs,
} from "react-router";
import type { AppData } from "./layout";
import { EmptyState, TagList } from "../../components/ui";
import { IconSpinner } from "../../components/icons";
import { InspirationIdeaDialog } from "../../components/inspiration-idea-dialog";
import { InspirationDetailPreview } from "../../components/inspiration-preview";
import { formatDateJa } from "../../lib/format";
import { inspirationHeadline } from "../../lib/inspiration";
import { INSPIRATIONS_PATH, inspirationDetailAction } from "../../lib/inspiration-action";
import { confirmInspirationDelete } from "../../lib/inspiration-delete";
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
  const { categories } = useOutletContext<AppData>();
  const [editing, setEditing] = useState(false);
  const [making, setMaking] = useState(false);
  const refresh = useFetcher();
  const refreshing = refresh.state !== "idle";
  const { pending: refreshPending, hold: holdRefresh } = useInstantPending(refreshing);
  const deleteFetcher = useFetcher();
  const deleting = deleteFetcher.state !== "idle";
  const { pending: deletePending, hold: holdDelete } = useInstantPending(deleting);

  function handleDelete() {
    if (!confirmInspirationDelete(inspirationHeadline(item))) return;
    holdDelete();
    const data = new FormData();
    data.set("intent", "delete");
    void deleteFetcher.submit(data, { method: "post" });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-card">
      <header className="sticky top-0 z-20 shrink-0 border-b border-border bg-card/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:px-7">
        <div className="flex min-h-[56px] items-center gap-2">
          <Link
            to={INSPIRATIONS_PATH}
            className="flex min-h-11 items-center gap-1.5 pr-2 text-[13px] text-muted-foreground no-underline hover:text-foreground"
          >
            <span aria-hidden="true">←</span>
            <span className="hidden md:inline">インスピレーション</span>
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-center text-[14.5px] font-semibold md:hidden">
            {inspirationHeadline(item)}
          </h1>
          <div className="flex items-center gap-2 md:ml-auto">
            <button
              type="button"
              onClick={() => setEditing((open) => !open)}
              className="ui-btn-secondary px-3"
            >
              {editing ? "閉じる" : "編集"}
            </button>
            <button type="button" onClick={() => setMaking(true)} className="ui-btn px-3">
              ＋ アイデアにする
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deletePending}
              className="ui-btn-secondary px-3 text-danger"
            >
              {deletePending ? "削除中…" : "削除"}
            </button>
          </div>
        </div>
      </header>
      <div className="w-full max-w-3xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-7 md:py-2">
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
            <h1 className="mt-5 hidden text-[24px] leading-[1.45] font-semibold tracking-[-0.02em] md:block">
              {inspirationHeadline(item)}
            </h1>
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block break-all font-mono text-[12px] text-accent"
              >
                {item.url}
              </a>
            ) : null}
            {item.memo ? (
              <p className="mt-3 max-w-2xl whitespace-pre-wrap text-[14.5px] leading-[1.95] text-secondary">
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

        <p className="mt-6 font-mono text-[11.5px] text-muted-foreground">
          created {formatDateJa(item.createdAt)} · updated {formatDateJa(item.updatedAt)}
        </p>

        {error ? <p className="mt-2 text-[12.5px] text-danger">{error}</p> : null}
      </div>
      {making ? (
        <InspirationIdeaDialog
          item={item}
          categories={categories}
          onClose={() => setMaking(false)}
        />
      ) : null}
    </div>
  );
}
