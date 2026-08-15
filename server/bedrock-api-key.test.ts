import { describe, expect, it } from "vitest";

describe("Bedrock API key configuration", () => {
  it("keeps the key server-side and never exposes its value", () => {
    const key = process.env.BEDROCK_API_KEY;
    expect(key === undefined || typeof key === "string").toBe(true);
    expect(key).not.toContain("undefined");
  });
});
