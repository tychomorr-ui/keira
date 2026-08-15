import { describe, expect, it } from "vitest";

describe("Bedrock Region and Model configuration", () => {
  it("validates configured region and model ID", () => {
    expect(process.env.BEDROCK_REGION).toBe("sa-east-1");
    expect(process.env.BEDROCK_MODEL_ID).toBe("anthropic.claude-opus-5");
  });
});
