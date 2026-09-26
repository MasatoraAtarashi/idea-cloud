import { describe, expect, it } from "vitest";
import { aiErrorMessage } from "../app/lib/idea-ai";
import { dictionary } from "../app/i18n/dictionary";
import { LOCALES, type Locale } from "../app/i18n/locale";
import { brainstormSystemPrompt } from "../server/ai/brainstorm";
import { discussSystemPrompt } from "../server/ai/discuss";
import { evaluateSystemPrompt } from "../server/ai/evaluate";
import { researchSystemPrompt } from "../server/ai/research";
import { autoTagSystemPrompt } from "../server/ai/tags";
import { RESEARCH_FAIL_MESSAGE } from "../server/ai/research";
import { BRAINSTORM_FAIL_MESSAGE } from "../server/ai/brainstorm";
import { EVALUATE_FAIL_MESSAGE } from "../server/ai/evaluate";
import { DISCUSS_FAIL_MESSAGE, DISCUSS_NO_ROOM_MESSAGE } from "../server/ai/discuss";
import { languageName } from "../server/ai/language";
import { EVALUATION_SECTION_LABELS, parseEvaluationNotes } from "../app/lib/evaluation-notes";

const PROMPTS = {
  research: researchSystemPrompt,
  brainstorm: brainstormSystemPrompt,
  evaluate: evaluateSystemPrompt,
  discuss: discussSystemPrompt,
  autoTag: autoTagSystemPrompt,
} satisfies Record<string, (locale?: Locale) => string>;

describe("AI output language", () => {
  it("names the reader's language in every prompt", () => {
    for (const [name, build] of Object.entries(PROMPTS)) {
      for (const locale of LOCALES) {
        expect(build(locale), `${name} / ${locale}`).toContain(languageName(locale));
      }
    }
  });

  it("does not leave a prompt pinned to Japanese", () => {
    for (const [name, build] of Object.entries(PROMPTS)) {
      expect(build("en"), `${name}`).not.toBe(build("ja"));
    }
  });

  it("defaults to Japanese when no locale is given", () => {
    for (const [name, build] of Object.entries(PROMPTS)) {
      expect(build(), `${name}`).toBe(build("ja"));
    }
  });

  it("keeps the evaluation headings Japanese in every locale, because we parse them back", () => {
    // A note written today may be read months later by someone reading in
    // another language, so the storage keys must not move with the reader.
    for (const locale of LOCALES) {
      const prompt = evaluateSystemPrompt(locale);
      for (const heading of EVALUATION_SECTION_LABELS) {
        expect(prompt, `${locale} / ${heading}`).toContain(heading);
      }
      expect(prompt).toContain("スコア:");
    }
  });

  it("still parses a note whose prose is English under Japanese headings", () => {
    const note = [
      "強み",
      "- Cheap to try in a week",
      "",
      "リスク",
      "- Nobody may want it",
      "",
      "新規性",
      "- Mild",
      "",
      "次の一手",
      "- Ship a landing page",
      "",
      "スコア: 4",
    ].join("\n");
    const parsed = parseEvaluationNotes(note);
    expect(parsed).not.toBeNull();
    expect(parsed?.score).toBe(4);
    expect(parsed?.sections.map((section) => section.label)).toEqual([
      ...EVALUATION_SECTION_LABELS,
    ]);
    expect(parsed?.sections[0]?.body).toContain("Cheap to try");
  });
});

describe("AI failures reach the screen in the reader's language", () => {
  it("renders every code from the dictionary, never the server's sentence", () => {
    const en = dictionary("en");
    expect(aiErrorMessage(en, "research", "archived")).toBe(en.ai.archive.research);
    expect(aiErrorMessage(en, "brainstorm", "failed")).toBe(en.ai.failure.brainstorm);
    expect(aiErrorMessage(en, "discuss", "noRoom")).toBe(en.ai.failure.noRoom);
    expect(aiErrorMessage(en, "evaluate", "notFound")).toBe(en.ai.notFound);
    expect(aiErrorMessage(en, "discuss", "tooLong")).toBe(en.ai.failure.tooLong);
    expect(aiErrorMessage(en, "discuss", "empty")).toBe(en.ai.failure.empty);
    expect(aiErrorMessage(en, "research", "badRequest")).toBe(en.ai.failure.badRequest);
  });

  it("did not quietly reword the Japanese UI while moving copy into the dictionary", () => {
    // The screen used to render these server constants directly. Japanese
    // readers must see exactly what they saw before.
    const ja = dictionary("ja");
    expect(ja.ai.failure.research).toBe(RESEARCH_FAIL_MESSAGE);
    expect(ja.ai.failure.brainstorm).toBe(BRAINSTORM_FAIL_MESSAGE);
    expect(ja.ai.failure.evaluate).toBe(EVALUATE_FAIL_MESSAGE);
    expect(ja.ai.failure.discuss).toBe(DISCUSS_FAIL_MESSAGE);
    expect(ja.ai.failure.noRoom).toBe(DISCUSS_NO_ROOM_MESSAGE);
  });

  it("says something in all four languages, and never the same thing twice", () => {
    const rendered = LOCALES.map((locale) =>
      aiErrorMessage(dictionary(locale), "research", "archived"),
    );
    expect(new Set(rendered).size).toBe(LOCALES.length);
    for (const text of rendered) expect(text.length).toBeGreaterThan(0);
  });
});
