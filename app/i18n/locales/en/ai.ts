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
