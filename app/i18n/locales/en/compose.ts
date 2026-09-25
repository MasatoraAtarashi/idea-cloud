import type { Dictionary } from "../../dictionary";

export const compose: Dictionary["compose"] = {
  title: "New idea",
  metaTitle: "New idea — Idea Cloud",
  shortcutHint: "New idea (⌘N)",

  heading: "New idea",
  subheading: "No need to tidy it up. Let it age first.",
  titlePlaceholder: "Title",
  placeholder: "Just as it came to you, in a line.",

  submit: "Create",
  submitWide: "Create idea",
  submitting: "Creating…",
  draftHint: "⌘Enter to create",

  tags: "Tags",
  tagsPlaceholder: "Tags (auto-tagged if empty)",
  tagHint: "Auto if empty",
  autoTagNote:
    "The idea is kept even if auto-tagging fails. URLs in the body are also kept as inspirations.",
  urlHint: "URLs in the body are also kept as inspirations",

  category: {
    label: "Category",
    optional: "Category (optional)",
    namePlaceholder: "Category name",
    add: "+ New category",
    cancel: "Cancel",
    none: "None",
    newOption: "New category…",
  },
};
