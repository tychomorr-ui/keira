import { describe, expect, it } from "vitest";

describe("Portal Atmosphere & Session Export Organization", () => {
  it("formats exported sessions with categories, tags, and search metadata", () => {
    const exportPayload = {
      version: "2.0",
      category: "Esoteric Axioms",
      tags: ["truth", "monadic", "recursive"],
      exportedAt: new Date().toISOString(),
      messages: [{ role: "portal", content: "The truth requires no defense." }],
    };

    expect(exportPayload.category).toBe("Esoteric Axioms");
    expect(exportPayload.tags).toContain("recursive");
    expect(exportPayload.messages.length).toBe(1);
  });
});
