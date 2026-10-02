import { describe, it, expect, beforeEach } from "vitest";

// First-touch attribution (src/lib/firstTouch.js) feeds signup_attribution and
// the store-link campaign tags. The two properties that matter: the FIRST
// visit wins forever, and nothing but short slugs and a hostname is stored.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { captureFirstTouch, readFirstTouch, storeSource, recordSignupAttribution } =
  await import("../../src/lib/firstTouch.js");
const { playStoreUrl, appStoreUrl, PLAY_STORE_URL } = await import("../../src/lib/links.js");

const loc = (url) => new URL(url);

describe("first-touch attribution", () => {
  beforeEach(() => store.clear());

  it("records utm tags, referrer hostname and landing path", () => {
    const ft = captureFirstTouch(
      loc("https://balliq.app/footle?utm_source=instagram_story&utm_content=d01"),
      "https://l.instagram.com/?u=https%3A%2F%2Fballiq.app%2Fig&e=secret",
    );
    expect(ft).toMatchObject({
      utm_source: "instagram_story",
      utm_content: "d01",
      referrer: "l.instagram.com",
      landing_path: "/footle",
    });
    expect(JSON.stringify(readFirstTouch())).not.toContain("secret");
  });

  it("keeps the first touch when the visitor comes back another way", () => {
    captureFirstTouch(loc("https://balliq.app/footle?utm_source=threads"), "");
    captureFirstTouch(loc("https://balliq.app/?utm_source=x"), "https://google.com/");
    expect(readFirstTouch().utm_source).toBe("threads");
  });

  it("ignores our own domain as a referrer and slugs junk", () => {
    const ft = captureFirstTouch(
      loc("https://balliq.app/play?utm_source=Insta%20<script>"),
      "https://balliq.app/clubs/arsenal/",
    );
    expect(ft.referrer).toBeNull();
    expect(ft.utm_source).toBe("instascript");
  });

  it("tags the Play link with the first-touch source, and only then", () => {
    expect(playStoreUrl()).toBe(PLAY_STORE_URL);
    captureFirstTouch(loc("https://balliq.app/footle?utm_source=threads"), "");
    expect(storeSource()).toBe("threads");
    expect(playStoreUrl()).toBe(
      `${PLAY_STORE_URL}&referrer=${encodeURIComponent("utm_source=threads&utm_medium=web")}`,
    );
  });

  it("leaves the App Store link untouched until a provider token exists", () => {
    captureFirstTouch(loc("https://balliq.app/footle?utm_source=threads"), "");
    expect(appStoreUrl()).not.toContain("ct=");
    expect(appStoreUrl({ campaign: false })).not.toContain("?");
  });

  it("writes one signup_attribution row and treats a duplicate as done", async () => {
    captureFirstTouch(loc("https://balliq.app/footle?utm_source=instagram"), "");
    const rows = [];
    const fake = (error) => ({
      from: (t) => ({ insert: async (row) => { rows.push([t, row]); return { error }; } }),
    });
    expect(await recordSignupAttribution(fake(null), "u1")).toBe(true);
    expect(rows[0][0]).toBe("signup_attribution");
    expect(rows[0][1]).toMatchObject({ user_id: "u1", utm_source: "instagram", platform: "web" });
    expect(await recordSignupAttribution(fake({ code: "23505" }), "u1")).toBe(true);
    expect(await recordSignupAttribution(fake(null), null)).toBe(false);
  });
});
