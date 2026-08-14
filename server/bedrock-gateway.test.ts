import { describe, it, expect, vi, beforeEach } from "vitest";
import { isBedrockConfigured, invokeBedrock, resetBedrockClientForTests } from "./bedrock-gateway";

describe("Bedrock Gateway", () => {
  beforeEach(() => {
    resetBedrockClientForTests();
  });

  it("reports unconfigured when env credentials or model ID are missing", () => {
    // With default/mock test env without full AWS secrets, it should be false
    expect(isBedrockConfigured()).toBe(false);
  });

  it("throws an error when invoking Bedrock while unconfigured", async () => {
    await expect(
      invokeBedrock({
        system: "You are an AI.",
        messages: [{ role: "user", content: "Hello" }],
      })
    ).rejects.toThrow("Amazon Bedrock is not configured");
  });
});
