import { useFetcher } from "react-router";
import type { MockIdea } from "../data/mock";
import { useT } from "../i18n/context";
import { canRunIdeaAi } from "../lib/idea-ai";
import { formatDateJa } from "../lib/format";
import { useInstantPending } from "../lib/use-instant-pending";
import {
  DEFAULT_RESEARCH_PRESET,
  researchPresetLabel,
  type ResearchPreset,
  presetFromModel,
} from "../lib/research-models";
import {
  hasResearchSourceLinks,
  researchSourcesForDisplay,
  sourceHostname,
  type ResearchSources,
} from "../lib/research-sources";
import type { ResearchIdeaActionData } from "../lib/idea-research-action";
import { IconSearch, IconSpinner } from "./icons";

export function isResearchSubmitting(formData: FormData | undefined) {
  return formData?.get("intent") === "research";
}

export function ResearchSourcesList({
  sources,
  heading,
}: {
  sources: ResearchSources | null | undefined;
  heading?: string;
}) {
  const t = useT();
  if (!sources) return null;
  const links = hasResearchSourceLinks(sources) ? sources.results : [];

  return (
    <section className="mt-3">
      <h4 className="text-[12px] font-semibold text-secondary">
        {heading ?? t.ai.research.sourcesHeading}
      </h4>
      {links.length > 0 ? (
        <ul className="mt-1.5 space-y-2">
          {links.map((source) => {
            const host = sourceHostname(source.url);
            return (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[12.5px] font-medium leading-snug text-foreground no-underline hover:underline"
                >
                  {source.title}
                </a>
                {host ? (
                  <p className="font-mono text-[10.5px] text-muted-foreground">{host}</p>
                ) : null}
                {source.snippet ? (
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                    {source.snippet}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          {t.ai.research.webSearchUnavailable}
        </p>
      )}
    </section>
  );
}

export function IdeaResearchControls({
  idea,
  error,
  preset,
}: {
  idea: MockIdea;
  error?: ResearchIdeaActionData["error"];
  /** Chosen in the AI 作業台 header. Falls back to the last research model. */
  preset?: ResearchPreset;
}) {
  const t = useT();
  const fetcher = useFetcher<ResearchIdeaActionData>({ key: `research-${idea.id}` });
  const busy = fetcher.state !== "idle";
  const { pending, hold } = useInstantPending(busy);
  const researchReady = canRunIdeaAi(idea.stage);
  const chosen = preset ?? presetFromModel(idea.researchModel) ?? DEFAULT_RESEARCH_PRESET;
  const fail = (fetcher.data && "error" in fetcher.data ? fetcher.data.error : undefined) ?? error;
  const ran = Boolean(idea.researchNotes || idea.researchedAt);

  if (!researchReady) {
    return (
      <div>
        <p id="research-gate" className="text-[12.5px] leading-relaxed text-muted-foreground">
          {t.ai.archive.research}
        </p>
        {fail ? <p className="mt-1.5 text-[12.5px] text-danger">{fail}</p> : null}
      </div>
    );
  }

  return (
    <fetcher.Form method="post" className="flex flex-col gap-1.5" onSubmit={hold}>
      <input type="hidden" name="intent" value="research" />
      <input type="hidden" name="preset" value={chosen} />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="ui-btn-secondary shrink-0 px-3"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? (
            <IconSpinner className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <IconSearch className="h-3.5 w-3.5" />
          )}
          {pending ? t.ai.research.running : ran ? t.ai.research.rerun : t.ai.research.run}
        </button>
        <p className="text-[11.5px] leading-snug text-muted-foreground">{t.ai.research.hint}</p>
      </div>
      {fail ? <p className="text-[12.5px] text-danger">{fail}</p> : null}
    </fetcher.Form>
  );
}

export function IdeaResearchNotes({ idea }: { idea: MockIdea }) {
  const t = useT();
  const preset = presetFromModel(idea.researchModel);
  const modelLabel = preset ? researchPresetLabel(t, preset) : idea.researchModel;
  const sources = researchSourcesForDisplay(idea);

  if (!(idea.researchNotes || idea.researchedAt)) {
    return (
      <p className="mt-4 text-[12.5px] text-muted-foreground">
        {canRunIdeaAi(idea.stage) ? t.ai.research.notRun : t.ai.research.emptyArchived}
      </p>
    );
  }

  return (
    <section className="mt-4 rounded-[10px] border border-border bg-card px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[12.5px] font-semibold">{t.ai.research.latest}</h3>
        <p className="font-mono text-[11px] text-muted-foreground">
          {[modelLabel, idea.researchedAt ? formatDateJa(t, idea.researchedAt) : ""]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <ResearchSourcesList sources={sources} />
      {idea.researchNotes ? (
        <div className="mt-3 border-t border-border pt-3">
          <h4 className="text-[12px] font-semibold text-secondary">{t.ai.research.comment}</h4>
          <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-[1.9] text-secondary">
            {idea.researchNotes}
          </p>
        </div>
      ) : null}
    </section>
  );
}
