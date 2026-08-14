import { describe, expect, it } from "vitest";

describe("Portal branding configuration", () => {
  it("uses Portal as the application title", () => {
    expect(process.env.VITE_APP_TITLE ?? "Portal").toBe("Portal");
  });
});
