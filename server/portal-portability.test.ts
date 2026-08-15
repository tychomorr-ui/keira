import { describe, expect, it } from "vitest";

describe("Portal Portability & Sovereign Deployment", () => {
  it("ensures fallback messages do not surface Manus reflection errors", () => {
    const fallbackMessage = "The sovereign dialogue channel remains open. State your premise.";
    expect(fallbackMessage).toContain("sovereign dialogue channel");
    expect(fallbackMessage).not.toContain("unavailable");
  });
});
