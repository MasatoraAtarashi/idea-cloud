import { useMemo, useState } from "react";
import { Link, redirect, type LoaderFunctionArgs } from "react-router";
import { EmptyState } from "../../components/ui";
import { IDEAS, ideasByStage } from "../../data/mock";
import { useT } from "../../i18n/context";
import { dictionary } from "../../i18n/dictionary";
import type { Locale } from "../../i18n/locale";

export function meta({ data }: { data?: { locale?: Locale } }) {
  return [{ title: dictionary(data?.locale ?? "ja").ai.page.metaTitle }];
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const from = new URL(request.url).searchParams.get("from");
  if (from && /^\d+$/.test(from)) {
    return redirect(`/app/ideas/${from}#research`);
  }
  return { locale: context.locale };
}

export default function ResearchPage() {
  const t = useT();
  const selected = ideasByStage("selected");
  const [id, setId] = useState(selected[0]?.id ?? "");
  const [tab, setTab] = useState<"research" | "proto">("research");
  const idea = useMemo(() => IDEAS.find((item) => item.id === id), [id]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <h1 className="ui-title text-[16px] tracking-tight">{t.ai.page.title}</h1>
      {selected.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={t.ai.page.empty} />
        </div>
      ) : (
        <>
          <label className="block text-xs text-muted-foreground" htmlFor="idea-select">
            {t.ai.page.selectLabel}
          </label>
          <select
            id="idea-select"
            value={id}
            onChange={(event) => setId(event.target.value)}
            className="ui-input mt-2"
          >
            {selected.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          {idea && (
            <Link
              to={`/app/ideas/${idea.id}`}
              className="mt-2 inline-block text-xs text-muted-foreground no-underline hover:text-foreground"
            >
              {t.ai.page.openDetail}
            </Link>
          )}
          <div className="mt-6 flex gap-1 rounded-md border border-border bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setTab("research")}
              className={`rounded-sm px-3 py-1.5 text-sm ${
                tab === "research" ? "bg-card font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              {t.ai.page.tabResearch}
            </button>
            <button
              type="button"
              onClick={() => setTab("proto")}
              className={`rounded-sm px-3 py-1.5 text-sm ${
                tab === "proto" ? "bg-card font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              {t.ai.page.tabProto}
            </button>
          </div>
          <div className="ui-panel mt-3 p-4">
            {tab === "research" ? (
              <p className="text-sm text-muted-foreground">{t.ai.page.noNotes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t.ai.page.protoNote}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
