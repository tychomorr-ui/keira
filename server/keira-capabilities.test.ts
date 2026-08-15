import { describe, expect, it } from "vitest";
import { getKeiraCapabilities } from "./keira-capabilities";

describe("KEIRA capabilities", () => {
  it("reports an honest, non-sensitive capability inventory", () => {
    const capabilities = getKeiraCapabilities();

    expect(capabilities.map((capability) => capability.id)).toEqual([
      "reasoning",
      "conversation-memory",
      "transcript-export",
      "voice",
      "personalization",
    ]);
    expect(capabilities.every((capability) => ["available", "awaiting-configuration", "browser-dependent"].includes(capability.status))).toBe(true);
    expect(JSON.stringify(capabilities)).not.toMatch(/api[_-]?key|secret|bucket|modelId/i);
  });
});
