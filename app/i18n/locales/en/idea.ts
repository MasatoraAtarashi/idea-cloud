import type { Dictionary } from "../../dictionary";

export const idea: Dictionary["idea"] = {
  metaTitle: "Idea — Idea Cloud",
  heading: "Idea",
  empty: "Nothing yet",
  listLink: "All ideas",
  backToList: "Back to the list",
  editButton: "Edit",
  aiTab: "AI bench",
  agedDaysShort: (days) => `${days}d`,
  noAutoTags: "No auto tags",

  nextStage: "Next stage",
  nextStageTo: (stage) => `Next stage (${stage})`,
  nextStageArchived: "Archived ideas can't move on",
  nextStageLast: "Last stage",
  updating: "Saving…",
  moreActions: "More actions",
  changeStage: "Change stage",
  mergeWithOther: "Merge with another idea",
  archive: "Archive",
  untitled: "Untitled",

  selfReview: {
    heading: "Your score and reflection",
    open: "Open",
    score: (score) => `Your score ${score}`,
    hasReflection: "Reflection saved",
  },

  merge: {
    metaTitle: "Merge — Idea Cloud",
    heading: "Merge",
    detail: "Detail",
    selected: (count) => `${count} selected`,
    submit: "Merge",
    hint: "Pick two or more and the merged line shows up here.",
    result: (titles) => `${titles} will be folded into one.`,
  },

  edit: {
    title: "Title",
    body: "Body",
    tags: "Tags",
    tagsPlaceholder: "Separate with commas",
    category: "Category",
    stage: "Stage",
    saving: "Saving…",
  },

  comments: {
    heading: "Comments",
    empty: "No comments yet. Add them a little at a time.",
    placeholder: "Note what you noticed later",
    sendLabel: "Post comment",
    addAs: (name) => `Post as ${name} (⌘Enter)`,
    send: "Post",
    sending: "Posting…",
  },

  actions: {
    menuLabel: "Actions",
    delete: "Delete",
    deleting: "Deleting…",
  },

  copy: {
    label: "Copy",
    aria: "Copy with details",
    result: "Copy result",
    ok: "Copied",
    fail: "Couldn't copy",
    stageField: "Stage",
    categoryField: "Category",
    tagsField: "Tags",
  },

  swipe: {
    ai: "AI",
    merge: "Merge",
  },

  score: {
    heading: "Score",
    hint: "A 1–5 score. A short note is optional.",
    noteLabel: "Score note",
    notePlaceholder: "Short note (optional)",
    human: (score) => `You ${score}`,
    ai: (score) => `AI ${score}`,
  },

  review: {
    heading: "Review",
    hint: "After it has rested, decide whether to move on or pause.",
    current: (status) => ` Currently ${status}.`,
    reviewed: "Reviewed",
    hold: "Hold",
    discard: "Let go",
    discardPrompt: "Archive it off the shelf, or delete it for good.",
    rested: (days) => `Rested ${days} days. How does it read now?`,
    archive: "Archive it",
    delete: "Delete it",
    cancel: "Never mind",
  },

  reflection: {
    heading: "Reflection",
    hint: "Just the outcome after you tried it. Not used by AI yet.",
    outcomeLabel: "What happened",
    outcomePlaceholder: "What happened",
    notesLabel: "Reflection notes",
    notesPlaceholder: "Notes (optional)",
    submit: "Save reflection",
    saving: "Saving…",
    status: {
      none: "Blank",
      tried: "Tried",
      hold: "Hold",
      dropped: "Dropped",
    },
  },

  tabs: {
    discuss: "Talk",
    evaluate: "Score",
    research: "Research",
    brainstorm: "Ideas",
  },

  evaluation: {
    scoreLabel: "Conviction",
    meaning: {
      1: "Too early",
      2: "Handle with care",
      3: "Could go either way",
      4: "Worth pursuing",
      5: "Strongly behind it",
    },
    section: {
      strengths: "Strengths",
      risks: "Risks",
      novelty: "Novelty",
      nextMove: "Next move",
    },
  },

  deleteConfirm: (title) => `Delete "${title}". This can't be undone.`,

  errors: {
    required: "Please write something",
    tooLong: "Too long",
    notFound: "Not found",
    invalidStage: "Invalid stage",
    invalidReviewStatus: "Invalid review status",
    outcomeTooLong: "The outcome is too long",
    noteTooLong: "The note is too long",
    scoreRange: "Pick a number from 1 to 5",
  },
};
