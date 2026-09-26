import type {
  EvaluateNextId,
  JevPursueLevel,
  JevScoreLevel,
} from "../../../../server/ai/jev-evaluate";
import type { Dictionary } from "../../dictionary";

export const ai: Dictionary["ai"] = {
  workbench: {
    title: "AI workbench",
    presetLabel: "Preset",
    running: "Running",
  },

  preset: {
    fast: "Fast & cheap",
    standard: "Standard",
    deep: "Thorough",
  },

  archive: {
    research: "Archived ideas can't be researched",
    brainstorm: "Archived ideas can't be brainstormed",
    evaluate: "Archived ideas can't be scored",
    discuss: "Archived ideas can't be discussed",
  },

  /** Bad or unknown idea id in an AI action. */

  failure: {
    research: "Research failed. Please try again in a moment.",
    brainstorm: "Brainstorm failed. Please try again in a moment.",
    evaluate: "AI evaluation failed. Please try again in a moment.",
    discuss: "The reply failed. Please try again in a moment.",
    noRoom:
      "It ran out of room while thinking and could not finish the answer. Try asking in smaller pieces.",
    badRequest: "Those settings are not valid. Pick a preset again.",
    empty: "Please write something",
    tooLong: "That is too long",
  },

  notFound: "Not found",

  menu: {
    actions: "Actions",
  },

  research: {
    run: "Run research",
    rerun: "Research again",
    running: "Running…",
    hint: "Pulls a few prior examples off the web and reads them against your note.",
    sourcesHeading: "Prior art",
    webSearchUnavailable: "No web results",
    latest: "Latest research",
    comment: "AI comment",
    notRun: "Not run yet.",
    emptyArchived: "No research notes yet. Archived ideas can't be researched",
  },

  brainstorm: {
    run: "Brainstorm",
    running: "Running…",
    hint: "Opens up angles, alternatives and next questions. Every run is kept.",
    latest: "Latest",
    previous: "Earlier",
    notRun: "Not run yet.",
    emptyArchived: "Nothing here yet. Archived ideas can't be brainstormed",
  },

  evaluate: {
    run: "Score with AI",
    rerun: "Score again",
    running: "Scoring…",
    hint: (scoreLabel: string) =>
      `Strengths, risks, novelty and the next move, plus a 1–5 ${scoreLabel}. Only the latest is kept.`,
    notScored: "not scored yet",
    inProgress: "evaluating…",
    fullTitle: "Full evaluation",
    noBody: "No text.",
    notRun: "Not scored yet.",
    emptyArchived: "No evaluation yet. Archived ideas can't be scored",
  },

  discuss: {
    link: "Talk to AI",
    intro:
      "Ask anything about this idea. It won't make legal calls. The questions below are a place to start.",
    saved: "Chats are saved",
    inputLabel: "Question for the AI",
    placeholder: "Ask about this idea",
    send: "Send",
    sending: "Sending…",
    starters: [
      { label: "As a landing page", body: "What would a landing page for this look like?" },
      { label: "Legal risks?", body: "Are there legal risks with this?" },
      { label: "Next move?", body: "What's the next move?" },
      { label: "Vs. competitors", body: "How does this stand apart from competitors?" },
    ],
  },

  premium: {
    title: "Premium only",
    body: "The AI workbench (chat, scoring, research, brainstorm) and auto-tagging are premium features.",
    cta: "Go premium",
    opening: "Opening…",
    note: "Payment is handled on Stripe's page. Creating, editing and commenting on ideas stays free.",
  },

  billing: {
    notReady: "Billing isn't ready yet.",
    failed: "Couldn't open the payment page. Please try again in a moment.",
  },

  /**
   * Stored Jev evaluation notes (`server/ai/jev-evaluate.ts`). Display copy only:
   * the four headings, the `スコア:` line and the Japanese values sent to / read
   * back from the Jev API stay Japanese, so old notes keep parsing.
   */
  jev: {
    /** Axis labels in the 強み / リスク bullets. */
    axis: {
      impact: "Value",
      feasibility: "Feasibility",
      clarity: "Clarity",
      risk: "Size",
      pursue: "Worth pursuing",
    },

    /** No legend value came back for an axis. */
    noJudgement: "Not rated",

    /** 進める価値, from the `pursue` noul. */
    pursue: {
      high: "High",
      normal: "Medium",
      low: "Low",
      unknown: "Unknown",
    } satisfies Record<JevPursueLevel, string>,

    /** Jev legend value (Japanese, the API contract) -> what the reader sees. */
    level: {
      既存の延長: "Incremental",
      一部新しい: "Partly new",
      明確に新しい: "Clearly new",
      大きく新しい: "Highly original",
      小さい: "Small",
      ある: "Some",
      大きい: "Large",
      非常に大きい: "Very large",
      かなり困難: "Very hard",
      難しいが可能: "Hard but doable",
      現実的: "Realistic",
      容易: "Easy",
      曖昧: "Vague",
      方向は見える: "Direction is clear",
      具体的: "Concrete",
      すぐ動ける: "Ready to start",
      低い: "Low",
      中程度: "Moderate",
      高い: "High",
      致命的: "Critical",
    } satisfies Record<JevScoreLevel, string>,

    /** 次の一手. Keyed by the choice id; the Japanese criteria text is unchanged. */
    next: {
      research: "Test the hypothesis with research",
      age: "Let it sit and mature",
      try: "Try it small",
      select: "Move it forward",
      archive: "Pass on it",
    } satisfies Record<EvaluateNextId, string>,
  },

  page: {
    metaTitle: "Research — Idea Cloud",
    title: "Research",
    empty: "Nothing here yet",
    selectLabel: "Selected ideas",
    openDetail: "Open detail",
    tabResearch: "Research",
    tabProto: "Prototype",
    noNotes: "No research notes yet.",
    protoNote: "Small experiments get written up once an idea is selected.",
  },
};
