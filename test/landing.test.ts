import { describe, expect, it } from "vitest";
import { loader as landingLoader, meta as landingMeta } from "../app/routes/landing";
import { action as setLocaleAction } from "../app/routes/set-locale";
import { dictionary } from "../app/i18n/dictionary";
import { LOCALES } from "../app/i18n/locale";

function context(userEmail: string | null, locale: "ja" | "en" | "zh" | "ko" = "ja") {
  return { userEmail, locale } as never;
}

/** The loader `throw`s its redirect, so every call goes through here. */
async function landing(
  url: string,
  userEmail: string | null,
): Promise<{ data?: { locale: string }; redirect?: Response }> {
  try {
    const data = (await landingLoader({
      request: new Request(url),
      context: context(userEmail),
      params: {},
    } as never)) as { locale: string };
    return { data };
  } catch (thrown) {
    if (thrown instanceof Response) return { redirect: thrown };
    throw thrown;
  }
}

async function setLocale(body: Record<string, string>) {
  const form = new URLSearchParams(body);
  const request = new Request("https://example.test/lang", {
    method: "POST",
    body: form,
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
  return (await setLocaleAction({
    request,
    context: context(null),
    params: {},
  } as never)) as Response;
}

describe("landing page", () => {
  it("renders for a visitor with no session", async () => {
    const { data, redirect } = await landing("https://example.test/", null);
    expect(redirect).toBeUndefined();
    expect(data).toEqual({ locale: "ja" });
  });

  it("sends a signed-in visitor into the app instead of a second home", async () => {
    const { redirect } = await landing("https://example.test/", "someone@example.test");
    expect(redirect?.status).toBe(302);
    expect(redirect?.headers.get("location")).toBe("/app");
  });

  it("honours a same-site ?next but never an off-site one", async () => {
    const same = await landing("https://example.test/?next=%2Fapp%2Flist", "a@b.test");
    expect(same.redirect?.headers.get("location")).toBe("/app/list");
    const offsite = await landing("https://example.test/?next=https%3A%2F%2Fevil.test", "a@b.test");
    expect(offsite.redirect?.headers.get("location")).toBe("/app");
  });

  it("titles and describes itself in the reader's language", () => {
    for (const locale of LOCALES) {
      const tags = landingMeta({ data: { locale } } as never) as { title?: string }[];
      expect(tags[0].title).toBe(dictionary(locale).lp.metaTitle);
    }
  });
});

describe("POST /lang", () => {
  it("stores the choice and returns to the page it was asked from", async () => {
    const response = await setLocale({ locale: "ko", next: "/app/list?stage=ripe" });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/app/list?stage=ripe");
    expect(response.headers.get("set-cookie")).toContain("lang=ko");
  });

  it("ignores a locale it cannot serve", async () => {
    const response = await setLocale({ locale: "klingon", next: "/" });
    expect(response.headers.get("set-cookie")).toContain("lang=ja");
  });

  it("never redirects off-site", async () => {
    const response = await setLocale({ locale: "en", next: "https://evil.test/steal" });
    expect(response.headers.get("location")).toBe("/");
  });
});
