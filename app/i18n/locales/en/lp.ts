import type { Dictionary } from "../../dictionary";

export const lp: Dictionary["lp"] = {
  metaTitle: "Idea Cloud — a shelf where ideas rest until they ripen",
  metaDescription:
    "Catch a thought the moment it lands, deliberately forget it, and come back once it has ripened. A team workspace built around the incubation method of The Science of Thought Organization.",
  skipToContent: "Skip to content",

  hero: {
    eyebrow: "An incubation method, turned into a tool",
    title: "Good ideas show themselves\nafter you leave them alone.",
    body: "Catch the thought on the spot. Then deliberately don't touch it. You hear about it again only once it has ripened — and then you decide: advance it, merge it, or drop it.",
    note: "No credit card. Start with a Google account.",
  },

  /** Copy for the product shot in the hero. Not real data — a staged shelf. */
  preview: {
    nav: { ideas: "Ideas", inspiration: "Inspiration", analytics: "Analytics" },
    search: "Search",
    filter: "Ripe",
    columns: { idea: "Idea", stage: "Stage", score: "Score", updated: "Updated" },
    rows: [
      {
        title: "Turn meeting audio into minutes on its own",
        stage: "ripe",
        score: "82",
        updated: "2d ago",
      },
      {
        title: "Rent an empty shop on the high street for a day",
        stage: "aging",
        score: "—",
        updated: "3w ago",
      },
      {
        title: "A shelf that passes finished books along",
        stage: "spark",
        score: "—",
        updated: "Today",
      },
      {
        title: "A map with only the places you actually go",
        stage: "selected",
        score: "91",
        updated: "Last week",
      },
    ],
    ai: {
      title: "AI evaluation",
      axes: [
        { label: "Novelty", value: 78 },
        { label: "Impact", value: 86 },
        { label: "Feasibility", value: 64 },
      ],
      verdictLabel: "Verdict",
      verdict: "Worth pursuing",
      nextLabel: "Next move",
      next: "Check the price of three near competitors",
    },
  },
  ritual: {
    title: "Only three moves",
    body: "Not a place to write, but a shelf for time. What grows here is the resting period, not the feature list.",
    steps: [
      {
        step: "01",
        title: "Catch",
        body: "Open your phone and the field is already there. Leave the tags empty — AI fills them in later.",
      },
      {
        step: "02",
        title: "Rest",
        body: "A spark moves straight to aging. The urge to polish it is stopped by the product, not by willpower.",
      },
      {
        step: "03",
        title: "Review",
        body: "Ripe ideas surface on their own. Advance, merge, or discard — decided in one pass.",
      },
    ],
  },

  features: {
    title: "You are not alone after the wait",
    body: "AI sits in only when you review. While you are writing, it stays quiet.",
    items: [
      {
        title: "AI evaluation",
        body: "Novelty, impact and feasibility, returned as one conviction score and a concrete next move.",
      },
      {
        title: "Research",
        body: "Searches the web for prior art. When it finds nothing, it says so instead of inventing citations.",
      },
      {
        title: "Brainstorm",
        body: "Angles, alternatives and the next question — a way out when one idea has stalled.",
      },
      {
        title: "Discuss",
        body: "A chat scoped to a single idea. No need to re-explain the whole context.",
      },
      {
        title: "Inspirations",
        body: "Pin an article or an image you liked, and it lines up as seed material.",
      },
      {
        title: "Analytics",
        body: "How much you caught, how much actually ripened. You watch the pile, not the effort.",
      },
    ],
  },

  stages: {
    title: "Five stages",
    body: "Not progress — states of time.",
    items: [
      { label: "Spark", body: "Just captured. Do not polish." },
      { label: "Aging", body: "Resting. Forgetting is allowed." },
      { label: "Ripe", body: "Your cue to review." },
      { label: "Selected", body: "You decided to act on it." },
      { label: "Archived", body: "Kept as a record." },
    ],
  },

  team: {
    title: "Solo or as a team",
    body: "Works as your own shelf and shares with a team unchanged. Comments stack up chronologically, like a Zenn scrap.",
  },

  cta: {
    title: "Hand today's thought\nto yourself six months from now.",
    body: "Sign in with Google and put your first idea on the shelf.",
  },

  footer: {
    tagline: "A workspace where ideas rest and ripen",
    copyright: (year: number) => `© ${year} Idea Cloud`,
  },
};
