import {
  Form,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { EmptyState } from "../../components/ui";
import { createRootDb } from "../../../db/client";
import {
  acceptInvite,
  getMembership,
  lookupInvite,
  type InviteStatus,
} from "../../../db/workspaces";
import { workspaceCookieHeader } from "../../../server/tenant/workspace";
import { LIST_PATH } from "../../lib/home-path";

export function meta() {
  return [{ title: "ワークスペースに参加 — アイデアクラウド" }];
}

const STATUS_MESSAGE: Record<Exclude<InviteStatus, "ok">, string> = {
  missing: "この招待リンクは見つかりません。",
  expired: "この招待リンクは期限切れです。",
  revoked: "この招待リンクは無効化されています。",
  exhausted: "この招待リンクは使用回数の上限に達しました。",
};

/** The page gate has already forced a sign-in, so `userEmail` is set here. */
export async function loader({ params, context }: LoaderFunctionArgs) {
  const db = createRootDb(context.cloudflare.env.DB);
  const found = await lookupInvite(db, params.token ?? "");
  if (found.status !== "ok" || !found.workspace) {
    return { status: found.status, workspaceName: null, alreadyMember: false };
  }
  const alreadyMember = context.userEmail
    ? Boolean(await getMembership(db, found.workspace.id, context.userEmail))
    : false;
  return { status: "ok" as const, workspaceName: found.workspace.name, alreadyMember };
}

export async function action({ params, request, context }: ActionFunctionArgs) {
  const email = context.userEmail;
  if (!email) return redirect(LIST_PATH);
  const db = createRootDb(context.cloudflare.env.DB);
  const result = await acceptInvite(db, params.token ?? "", email);
  if (result.status !== "ok" || !result.workspaceId) return { status: result.status };
  return redirect(LIST_PATH, {
    headers: { "set-cookie": workspaceCookieHeader(result.workspaceId, request.url) },
  });
}

export default function JoinPage() {
  const { status, workspaceName, alreadyMember } = useLoaderData<typeof loader>();
  if (status !== "ok" || !workspaceName) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <EmptyState
          title="参加できません"
          body={STATUS_MESSAGE[status as Exclude<InviteStatus, "ok">]}
        />
      </div>
    );
  }
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="ui-panel w-full max-w-md p-6">
        <p className="text-[12px] text-muted-foreground">ワークスペースへの招待</p>
        <h1 className="mt-1 text-[18px] font-semibold">{workspaceName}</h1>
        <p className="mt-3 text-[13px] text-muted-foreground">
          {alreadyMember
            ? "すでにこのワークスペースのメンバーです。切り替えて開きます。"
            : "参加すると、このワークスペースのアイデアとインスピレーションを閲覧・編集できます。"}
        </p>
        <Form method="post" className="mt-5">
          <button type="submit" className="ui-btn px-4">
            {alreadyMember ? "開く" : "参加する"}
          </button>
        </Form>
      </div>
    </div>
  );
}
