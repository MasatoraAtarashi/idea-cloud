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
import { formatDateJa } from "../../lib/format";
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
  const busy = brainstorm.state !== "idle";
  const { pending, hold } = useInstantPending(busy);

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-5 md:px-8">
      <header className="flex items-center justify-between gap-3">
        <Link
          to={INSPIRATIONS_PATH}
          className="text-[13.5px] text-muted-foreground no-underline hover:text-foreground"
        >
          棚
        </Link>
        <button
          type="button"
          onClick={() => setEditing((open) => !open)}
          className="ui-btn-secondary px-3"
        >
          {editing ? "閉じる" : "編集"}
        </button>
      </header>

      {editing ? (
        <Form method="post" className="mt-4 max-w-xl space-y-2">
          <input type="hidden" name="intent" value="edit" />
          <input name="title" defaultValue={item.title} className="ui-input" />
          <input name="url" type="url" defaultValue={item.url ?? ""} className="ui-input" />
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
          <h1 className="ui-title mt-4 text-[22px] leading-snug">{item.title}</h1>
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
            <p className="mt-3 max-w-2xl whitespace-pre-wrap text-[15px] leading-relaxed text-muted-foreground">
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
