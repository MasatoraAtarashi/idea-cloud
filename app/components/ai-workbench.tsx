import { useState } from "react";
import { useFetcher } from "react-router";
import type { IdeaChatMessageView } from "../../db/discussions";
import type { MockIdea } from "../data/mock";
import {
  IDEA_DETAIL_TAB_IDS,
  IDEA_DETAIL_TAB_LABEL,
  type IdeaDetailTab,
} from "../lib/idea-detail-tabs";
import {
  DEFAULT_DISCUSS_PRESET,
  RESEARCH_PRESET_LABEL,
  RESEARCH_PRESETS,
  type ResearchPreset,
} from "../lib/research-models";
import { shortModelName } from "./ai-format";
import {
  IdeaBrainstormControls,
  IdeaBrainstormNotes,
  type BrainstormEntry,
} from "./idea-brainstorm";
import { IdeaDiscussComposer, IdeaDiscussThread } from "./idea-discuss";
import { IdeaEvaluateControls, IdeaEvaluateNotes, IdeaScoreCard } from "./idea-evaluate";
import { IdeaResearchControls, IdeaResearchNotes } from "./idea-research";

const PRESETS = Object.keys(RESEARCH_PRESET_LABEL) as ResearchPreset[];

const TAB_FETCHER_KEY: Partial<Record<IdeaDetailTab, string>> = {
  discuss: "discuss",
  evaluate: "evaluate",
  research: "research",
  brainstorm: "brainstorm",
};

function useTabBusy(ideaId: string, tab: IdeaDetailTab): boolean {
  const key = TAB_FETCHER_KEY[tab];
  const fetcher = useFetcher({ key: `${key ?? "none"}-${ideaId}` });
  return key ? fetcher.state !== "idle" : false;
}

function TabButton({
  idea,
  tab,
  active,
  count,
  onTab,
}: {
  idea: MockIdea;
  tab: IdeaDetailTab;
  active: boolean;
  count: number | null;
  onTab: (tab: IdeaDetailTab) => void;
}) {
  const busy = useTabBusy(idea.id, tab);
  return (
    <button
      type="button"
      onClick={() => onTab(tab)}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-[8px] border px-3 text-[13px] md:min-h-0 md:py-[6px] lg:border-transparent ${
        active
          ? "border-transparent bg-border font-semibold text-foreground"
          : "border-border-control bg-card text-tertiary hover:text-foreground lg:bg-transparent"
      }`}
    >
      {IDEA_DETAIL_TAB_LABEL[tab]}
      {count != null && count > 0 ? (
        <span className="font-mono text-[12px] font-normal">{count}</span>
      ) : null}
      {busy ? (
        <span className="h-[6px] w-[6px] rounded-full bg-[#F79009]" aria-label="実行中" />
      ) : null}
    </button>
  );
}

export function AiWorkbench({
  idea,
  tab,
  onTab,
  discussions,
  brainstorms,
  researchError,
  brainstormError,
  evaluateError,
  discussError,
}: {
  idea: MockIdea;
  tab: IdeaDetailTab;
  onTab: (tab: IdeaDetailTab) => void;
  discussions: IdeaChatMessageView[];
  brainstorms: BrainstormEntry[];
  researchError?: string;
  brainstormError?: string;
  evaluateError?: string;
  discussError?: string;
}) {
  const [preset, setPreset] = useState<ResearchPreset>(DEFAULT_DISCUSS_PRESET);
  const counts: Record<IdeaDetailTab, number | null> = {
    discuss: null,
    evaluate: idea.aiScore ?? null,
    research: idea.researchNotes || idea.researchedAt ? 1 : 0,
    brainstorm: brainstorms.length || (idea.brainstormNotes ? 1 : 0),
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-2 px-4 pt-3 pb-2 lg:px-5 lg:pt-4 lg:pb-3">
        <span
          className="hidden h-[7px] w-[7px] rounded-full bg-accent lg:block"
          aria-hidden="true"
        />
        <h2 className="hidden text-[13.5px] font-semibold lg:block">AI 作業台</h2>
        <span
          className="ml-auto truncate font-mono text-[11.5px] text-muted-foreground"
          title={RESEARCH_PRESETS[preset]}
        >
          {shortModelName(RESEARCH_PRESETS[preset])}
        </span>
        <label className="relative shrink-0">
          <span className="sr-only">プリセット</span>
          <select
            value={preset}
            onChange={(event) => setPreset(event.target.value as ResearchPreset)}
            className="min-h-11 cursor-pointer appearance-none rounded-[7px] border border-border-control bg-card px-2.5 text-[12px] font-medium text-secondary outline-none hover:bg-sunken focus:border-ring md:h-7 md:min-h-7"
          >
            {PRESETS.map((item) => (
              <option key={item} value={item}>
                {RESEARCH_PRESET_LABEL[item]}
              </option>
            ))}
          </select>
        </label>
      </header>

      <nav
        className="flex shrink-0 gap-1.5 overflow-x-auto px-4 pb-3 lg:gap-1 lg:px-5"
        aria-label="AI 作業台"
      >
        {IDEA_DETAIL_TAB_IDS.map((id) => (
          <TabButton
            key={id}
            idea={idea}
            tab={id}
            active={tab === id}
            count={counts[id]}
            onTab={onTab}
          />
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 lg:px-5">
        <IdeaScoreCard idea={idea} preset={preset} />

        {tab === "discuss" ? (
          <IdeaDiscussThread idea={idea} messages={discussions} error={discussError} />
        ) : null}

        {tab === "evaluate" ? (
          <div className="mt-4">
            <IdeaEvaluateControls idea={idea} preset={preset} error={evaluateError} />
            <IdeaEvaluateNotes idea={idea} id="evaluate" />
          </div>
        ) : null}

        {tab === "research" ? (
          <div id="research" className="mt-4">
            <IdeaResearchControls idea={idea} preset={preset} error={researchError} />
            <IdeaResearchNotes idea={idea} />
          </div>
        ) : null}

        {tab === "brainstorm" ? (
          <div className="mt-4">
            <IdeaBrainstormControls idea={idea} preset={preset} error={brainstormError} />
            <IdeaBrainstormNotes idea={idea} entries={brainstorms} id="brainstorm" />
          </div>
        ) : null}
      </div>

      {tab === "discuss" ? (
        <div className="shrink-0 px-4 pt-1 pb-[max(1rem,env(safe-area-inset-bottom))] lg:px-5 lg:pb-5">
          <IdeaDiscussComposer idea={idea} preset={preset} />
        </div>
      ) : null}
    </div>
  );
}
