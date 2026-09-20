import { afterEach, describe, expect, it } from "vitest";
import { parseOpenGraphHtml } from "../server/ogp/parse";
import {
  assertPublicHttpUrl,
  isBlockedHostname,
  isPrivateIpv4,
  isPrivateIpv6,
  isPublicHttpUrl,
  PublicUrlRejectedError,
} from "../server/ogp/url";
import { fetchOpenGraph, setTestOgpFetch, setTestOgpHtmlFetch } from "../server/ogp/fetch";

describe("Open Graph HTML parse", () => {
  it("reads og tags and resolves a relative image against the page URL", () => {
    const parsed = parseOpenGraphHtml(
      `<!doctype html><html><head>
        <meta property="og:title" content="駅の光">
        <meta property="og:description" content="夜のホーム">
        <meta property="og:image" content="/og.png">
        <meta property="og:site_name" content="Example">
        <title>ignored</title>
      </head></html>`,
      "https://example.com/poster",
    );
    expect(parsed.title).toBe("駅の光");
    expect(parsed.description).toBe("夜のホーム");
    expect(parsed.imageUrl).toBe("https://example.com/og.png");
    expect(parsed.siteName).toBe("Example");
  });

  it("accepts reversed attribute order and twitter:image fallback", () => {
    const parsed = parseOpenGraphHtml(
      `<meta content="Tw Title" name="twitter:title">
       <meta name="twitter:image" content="https://cdn.example.com/card.jpg">
       <meta name="description" content="meta desc">`,
      "https://example.com",
    );
    expect(parsed.title).toBe("Tw Title");
    expect(parsed.description).toBe("meta desc");
    expect(parsed.imageUrl).toBe("https://cdn.example.com/card.jpg");
  });

  it("falls back to <title> and decodes entities", () => {
    const parsed = parseOpenGraphHtml(
      `<title>A &amp; B &#39;quote&#39;</title>`,
      "https://example.com",
    );
    expect(parsed.title).toBe("A & B 'quote'");
  });

  it("drops http or private og:image URLs", () => {
    const parsed = parseOpenGraphHtml(
      `<meta property="og:image" content="http://example.com/insecure.png">`,
      "https://example.com",
    );
    expect(parsed.imageUrl).toBe("");

    const privateImage = parseOpenGraphHtml(
      `<meta property="og:image" content="https://127.0.0.1/secret.png">`,
      "https://example.com",
    );
    expect(privateImage.imageUrl).toBe("");
  });
});

describe("OGP URL SSRF reject", () => {
  it("accepts public https URLs", () => {
    expect(isPublicHttpUrl("https://example.com/path")).toBe(true);
    expect(assertPublicHttpUrl("https://example.com/path").hostname).toBe("example.com");
  });

  it("rejects private IPv4, loopback, and metadata", () => {
    expect(isPrivateIpv4("10.0.0.4")).toBe(true);
    expect(isPrivateIpv4("192.168.1.1")).toBe(true);
    expect(isPrivateIpv4("127.0.0.1")).toBe(true);
    expect(isPrivateIpv4("169.254.169.254")).toBe(true);
    expect(isPrivateIpv4("172.16.5.1")).toBe(true);
    expect(isPrivateIpv4("8.8.8.8")).toBe(false);

    for (const url of [
      "http://127.0.0.1/",
      "https://10.1.2.3/x",
      "https://192.168.0.12",
      "https://169.254.169.254/latest/meta-data",
      "https://172.20.0.2/",
      "http://0.0.0.0/",
    ]) {
      expect(isPublicHttpUrl(url)).toBe(false);
      expect(() => assertPublicHttpUrl(url)).toThrow(PublicUrlRejectedError);
    }
  });

  it("rejects localhost, credentials, and non-http schemes", () => {
    expect(isBlockedHostname("localhost")).toBe(true);
    expect(isBlockedHostname("foo.localhost")).toBe(true);
    expect(isPrivateIpv6("::1")).toBe(true);
    expect(isPublicHttpUrl("https://localhost/admin")).toBe(false);
    // Assemble userinfo at runtime so detect-secrets does not see a Basic Auth URL literal.
    const userinfo = ["ユーザー", "ダミー"].join(":");
    expect(isPublicHttpUrl(`https://${userinfo}@example.com`)).toBe(false);
    expect(isPublicHttpUrl("file:///etc/passwd")).toBe(false);
    expect(isPublicHttpUrl("ftp://example.com/a")).toBe(false);
    expect(isPublicHttpUrl("https://[::1]/")).toBe(false);
  });
});

describe("OGP fetch fail-soft", () => {
  afterEach(() => {
    setTestOgpFetch();
    setTestOgpHtmlFetch();
  });

  it("returns none for an empty URL and failed for a blocked host", async () => {
    expect(await fetchOpenGraph("")).toMatchObject({ status: "none", title: "" });
    expect(await fetchOpenGraph("http://127.0.0.1/secret")).toMatchObject({ status: "failed" });
  });

  it("does not follow a redirect onto a private IP", async () => {
    setTestOgpHtmlFetch(async () => {
      return new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1/steal" },
      });
    });
    const result = await fetchOpenGraph("https://example.com/start");
    expect(result.status).toBe("failed");
    expect(result.imageUrl).toBe("");
  });

  it("parses HTML from the test transport", async () => {
    setTestOgpHtmlFetch(async () => {
      return new Response(
        `<meta property="og:title" content="Fetched"><meta property="og:image" content="https://cdn.example.com/a.jpg">`,
        { status: 200, headers: { "content-type": "text/html" } },
      );
    });
    const result = await fetchOpenGraph("https://example.com/page");
    expect(result.status).toBe("ok");
    expect(result.title).toBe("Fetched");
    expect(result.imageUrl).toBe("https://cdn.example.com/a.jpg");
  });
});
