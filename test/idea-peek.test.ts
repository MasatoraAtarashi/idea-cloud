import { describe, expect, it } from "vitest";
import { dictionary } from "../app/i18n/dictionary";
import { LOCALES } from "../app/i18n/locale";
import { PEEK_PARAM, isPeekOnlyChange, parsePeekId } from "../app/lib/idea-peek";
import { shouldRevalidate } from "../app/routes/app/board";

function url(search: string) {
  return new URL(`https://example.test/app/list${search}`);
}

describe("quick peek", () => {
  it("reads the open idea out of the URL", () => {
    expect(parsePeekId(new URLSearchParams(`${PEEK_PARAM}=7`))).toBe("7");
    expect(parsePeekId(new URLSearchParams())).toBeNull();
    expect(parsePeekId(new URLSearchParams(`${PEEK_PARAM}=`))).toBeNull();
  });

  it("tells a peek apart from a real change of what the list shows", () => {
    expect(isPeekOnlyChange(url("?peek=1"), url("?peek=2"))).toBe(true);
    expect(isPeekOnlyChange(url("?stage=ripe"), url("?stage=ripe&peek=2"))).toBe(true);
    // Order of the other params is not a change.
    expect(isPeekOnlyChange(url("?tab=candidates&q=a"), url("?q=a&tab=candidates&peek=9"))).toBe(
      true,
    );
    expect(isPeekOnlyChange(url("?stage=ripe"), url("?stage=aging"))).toBe(false);
    expect(isPeekOnlyChange(url("?peek=1"), new URL("https://example.test/app/ideas/1"))).toBe(
      false,
    );
  });
});

describe("list revalidation", () => {
  it("does not re-query the shelf just to open the drawer", () => {
    expect(
      shouldRevalidate({
        currentUrl: url("?peek=1"),
        nextUrl: url("?peek=2"),
        defaultShouldRevalidate: true,
      }),
    ).toBe(false);
  });

  it("still re-queries after a write, and when the filters change", () => {
    expect(
      shouldRevalidate({
        currentUrl: url("?peek=1"),
        nextUrl: url("?peek=2"),
        formMethod: "POST",
        defaultShouldRevalidate: true,
      }),
    ).toBe(true);
    expect(
      shouldRevalidate({
        currentUrl: url("?peek=1"),
        nextUrl: url("?stage=ripe&peek=1"),
        defaultShouldRevalidate: true,
      }),
    ).toBe(true);
  });
});

describe("drawer copy", () => {
  it("is translated everywhere, and never falls back to Japanese", () => {
    const ja = dictionary("ja").list.peek;
    for (const locale of LOCALES) {
      const peek = dictionary(locale).list.peek;
      expect(peek.openDetail.trim()).not.toBe("");
      expect(peek.heading.trim()).not.toBe("");
      if (locale !== "ja") expect(peek.openDetail).not.toBe(ja.openDetail);
      expect(peek.position(2, 9)).toContain("9");
    }
  });
});
