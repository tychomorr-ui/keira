import { describe, expect, it } from "vitest";

/**
 * Opt-in live configuration probe. It is intentionally not part of the normal
 * suite because the hosted secret values are not present in local sandboxes.
 */
describe("configured KEIRA local model endpoint", () => {
  it("reports the configured model from the Ollama models endpoint", async () => {
    if (process.env.KEIRA_LLM_LIVE_PROBE !== "true") return;

    const endpoint = process.env.KEIRA_LLM_ENDPOINT?.replace(/\/$/, "");
    const model = process.env.KEIRA_LLM_MODEL?.trim();
    expect(endpoint).toBeTruthy();
    expect(model).toBeTruthy();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    try {
      const response = await fetch(`${endpoint}/models`, {
        signal: controller.signal,
        headers: process.env.KEIRA_LLM_API_KEY
          ? { Authorization: `Bearer ${process.env.KEIRA_LLM_API_KEY}` }
          : undefined,
      });
      expect(response.ok).toBe(true);
      const payload = (await response.json()) as {
        data?: Array<{ id?: string }>;
      };
      expect(payload.data?.some((entry) => entry.id === model)).toBe(true);
    } finally {
      clearTimeout(timeout);
    }
  });
});
